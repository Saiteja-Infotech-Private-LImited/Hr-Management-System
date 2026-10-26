package com.hrms.repository;

import com.hrms.entity.Employee;
import com.hrms.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmail(String email);

    Optional<Employee> findByEmployeeId(String employeeId);

    Optional<Employee> findByAzureOid(String azureOid);

    boolean existsByEmail(String email);

    Page<Employee> findByDepartment(String department, Pageable pageable);

    @Query("SELECT e FROM Employee e WHERE LOWER(e.department) = LOWER(:department)")
    Page<Employee> findByDepartmentIgnoreCase(String department, Pageable pageable);

    Page<Employee> findByRole(Role role, Pageable pageable);

    Page<Employee> findByActive(boolean active, Pageable pageable);

    List<Employee> findByActiveTrue();

    @Query("""
                SELECT e FROM Employee e
                WHERE LOWER(e.firstName) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(e.lastName) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(CONCAT(e.firstName, ' ', e.lastName)) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(e.email) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(e.employeeId) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(e.department) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(e.designation) LIKE LOWER(CONCAT('%', :q, '%'))
            """)
    Page<Employee> search(String q, Pageable pageable);

    @Query("SELECT DISTINCT e.department FROM Employee e WHERE e.department IS NOT NULL")
    List<String> findAllDepartments();

    long countByActive(boolean active);

    long countByDepartment(String department);

    List<Employee> findByRoleAndActiveTrue(Role role);

    List<Employee> findByRoleAndActiveTrueOrderByFirstNameAsc(Role role);

    Optional<Employee> findByIdAndRole(Long id, Role role);

    List<Employee> findByTeamLeader_IdAndActiveTrueOrderByFirstNameAsc(Long teamLeaderId);
    
    List<Employee> findByActiveTrueOrderByFirstNameAsc();

}