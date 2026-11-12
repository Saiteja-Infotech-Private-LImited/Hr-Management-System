
package com.hrms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payroll")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payroll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "\"month\"")
    private int month;

    @Column(name = "\"year\"")
    private int year;

    // Salary components
    @Column(precision = 12, scale = 2)
    private BigDecimal basicSalary;

    @Column(precision = 12, scale = 2)
    private BigDecimal hra;

    @Column(precision = 12, scale = 2)
    private BigDecimal da;

    @Column(precision = 12, scale = 2)
    private BigDecimal specialAllowance;

    @Column(precision = 12, scale = 2)
    private BigDecimal grossSalary;

    // Deductions
    @Column(precision = 12, scale = 2)
    private BigDecimal esi;

    @Column(precision = 12, scale = 2)
    private BigDecimal tds;

    @Column(precision = 12, scale = 2)
    private BigDecimal lopDeduction;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalDeductions;

    @Column(precision = 12, scale = 2)
    private BigDecimal netSalary;

    // Calendar details
    private int totalDays;
    private int weekOffDays;
    private int holidayDays;
    private int workingDays;

    // Attendance and leave details
    private int presentDays;
    private int halfDays;
    private int absentDays;
    private int paidLeaveDays;
    private int unpaidLeaveDays;

    @Column(precision = 5, scale = 2)
    private BigDecimal lopDays;

    @Column(precision = 5, scale = 2)
    private BigDecimal payableDays;

    private boolean paid = false;

    private LocalDate payDate;

    private LocalDateTime generatedAt;

    @PrePersist
    protected void onCreate() {
        generatedAt = LocalDateTime.now();
    }
}
