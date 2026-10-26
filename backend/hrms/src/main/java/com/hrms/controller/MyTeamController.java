
package com.hrms.controller;

import com.hrms.dto.TeamMemberDTO;
import com.hrms.entity.Employee;
import com.hrms.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/my-team")
@RequiredArgsConstructor
public class MyTeamController {

    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    @GetMapping
    public List<TeamMemberDTO> getMyTeam(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in");
        }

        Employee currentUser = employeeRepository
                .findByEmail(authentication.getName())
                .filter(Employee::isActive)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Logged-in employee not found"));

        List<Employee> activeEmployees =
                employeeRepository.findByActiveTrueOrderByFirstNameAsc();

        Map<Long, Employee> byId = activeEmployees.stream()
                .collect(Collectors.toMap(
                        Employee::getId,
                        employee -> employee,
                        (first, second) -> first));

        Set<Long> visible = new LinkedHashSet<>();
        String role = currentUser.getRole().name();

        switch (role) {

            // MANAGER: HR -> Manager -> Team Leaders -> Employees
            case "MANAGER" -> {
                addActiveParent(currentUser.getHr(), byId, visible);
                visible.add(currentUser.getId());

                for (Employee leader : activeEmployees) {
                    if ("TEAM_LEADER".equals(leader.getRole().name())
                            && hasParent(leader.getManager(), currentUser)) {

                        visible.add(leader.getId());

                        addEmployeesOfLeader(
                                leader.getId(),
                                activeEmployees,
                                visible);
                    }
                }
            }

            // TEAM_LEADER: Manager -> Team Leader -> Employees
            case "TEAM_LEADER" -> {
                addActiveParent(currentUser.getManager(), byId, visible);
                visible.add(currentUser.getId());

                addEmployeesOfLeader(
                        currentUser.getId(),
                        activeEmployees,
                        visible);
            }

            // EMPLOYEE: Logged-in employee and assigned Team Leader's team
            // Excludes the Manager.
            case "EMPLOYEE" -> {
                visible.add(currentUser.getId());

                Employee teamLeader = currentUser.getTeamLeader();

                if (teamLeader != null) {
                    addActiveParent(teamLeader, byId, visible);

                    addEmployeesOfLeader(
                            teamLeader.getId(),
                            activeEmployees,
                            visible);
                }
            }

            // HR: HR -> Managers -> Team Leaders -> Employees
            case "HR" -> {
                visible.add(currentUser.getId());

                for (Employee manager : activeEmployees) {
                    if ("MANAGER".equals(manager.getRole().name())
                            && hasParent(manager.getHr(), currentUser)) {

                        visible.add(manager.getId());

                        for (Employee leader : activeEmployees) {
                            if ("TEAM_LEADER".equals(
                                    leader.getRole().name())
                                    && hasParent(
                                            leader.getManager(), manager)) {

                                visible.add(leader.getId());

                                addEmployeesOfLeader(
                                        leader.getId(),
                                        activeEmployees,
                                        visible);
                            }
                        }
                    }
                }
            }

            // ADMIN: All active employees
            case "ADMIN" -> {
                activeEmployees.forEach(
                        employee -> visible.add(employee.getId()));
            }

            default -> throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Unsupported role: " + role);
        }

        return activeEmployees.stream()
                .filter(employee -> visible.contains(employee.getId()))
                .sorted(
                        Comparator
                                // Logged-in employee always comes first.
                                .comparingInt((Employee employee) ->
                                        Objects.equals(
                                                employee.getId(),
                                                currentUser.getId()) ? 0 : 1)
                                // Then sort the remaining people by hierarchy.
                                .thenComparingInt(employee ->
                                        roleOrder(
                                                employee.getRole().name()))
                                .thenComparing(
                                        Employee::getFirstName,
                                        Comparator.nullsLast(
                                                String.CASE_INSENSITIVE_ORDER))
                )
                .map(this::toDTO)
                .toList();
    }

    private boolean hasParent(
            Employee parent,
            Employee expected) {

        return parent != null
                && expected != null
                && Objects.equals(
                        parent.getId(),
                        expected.getId());
    }

    private void addActiveParent(
            Employee parent,
            Map<Long, Employee> byId,
            Set<Long> visible) {

        if (parent != null
                && byId.containsKey(parent.getId())) {

            visible.add(parent.getId());
        }
    }

    private void addEmployeesOfLeader(
            Long leaderId,
            List<Employee> activeEmployees,
            Set<Long> visible) {

        for (Employee employee : activeEmployees) {
            if ("EMPLOYEE".equals(employee.getRole().name())
                    && employee.getTeamLeader() != null
                    && Objects.equals(
                            employee.getTeamLeader().getId(),
                            leaderId)) {

                visible.add(employee.getId());
            }
        }
    }

    private int roleOrder(String role) {
        return switch (role) {
            case "HR", "ADMIN" -> 0;
            case "MANAGER" -> 1;
            case "TEAM_LEADER" -> 2;
            case "EMPLOYEE" -> 3;
            default -> 4;
        };
    }

    private TeamMemberDTO toDTO(Employee employee) {
        return new TeamMemberDTO(
                employee.getId(),
                employee.getEmployeeId(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getEmail(),
                employee.getDepartment(),
                employee.getRole().name(),
                employee.getTeamLeader() == null
                        ? null
                        : employee.getTeamLeader().getId(),
                employee.getManager() == null
                        ? null
                        : employee.getManager().getId(),
                employee.getHr() == null
                        ? null
                        : employee.getHr().getId()
        );
    }
}
