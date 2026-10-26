package com.hrms.dto;

public record TeamMemberDTO(
        Long id,
        String employeeId,
        String firstName,
        String lastName,
        String email,
        String department,
        String role,
        Long teamLeaderId,
        Long managerId,
        Long hrId
) {}