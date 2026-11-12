package com.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class ChatbotDTOs {

    private ChatbotDTOs() {
        // Utility class
    }

    // =========================================================
    // MESSAGE REQUEST
    // =========================================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageRequest {
        private String message;
    }

    // =========================================================
    // MESSAGE RESPONSE
    // =========================================================

    @Data
    @NoArgsConstructor
    public static class MessageResponse {

        private String reply;
        private String intent;
        private String type;

        // Leave
        private List<LeaveBalanceItem> leaveBalances;
        private List<LeaveHistoryItem> leaveHistory;

        // Attendance
        private AttendanceItem attendance;
        private AttendanceAnalyticsItem attendanceAnalytics;

        // Payroll
        private PayrollItem payroll;
        private List<PayrollItem> payrollHistory;

        // Employee Profile
        private EmployeeProfileItem employeeProfile;

        // Training
        private List<TrainingItem> trainings;

        // Recruitment
        private List<JobItem> jobs;
        private List<RecruitmentApplicationItem> recruitmentApplications;

        // NEW - HR/Admin Recruitment Intelligence
        private RecruitmentSummaryItem recruitmentSummary;

        private LocalDateTime timestamp;

        // =====================================================
        // EXISTING CONSTRUCTORS - KEEPING BACKWARD COMPATIBILITY
        // =====================================================

        public MessageResponse(
                String reply,
                String intent,
                String type,
                List<LeaveBalanceItem> leaveBalances,
                AttendanceItem attendance,
                AttendanceAnalyticsItem attendanceAnalytics,
                LocalDateTime timestamp) {

            this.reply = reply;
            this.intent = intent;
            this.type = type;
            this.leaveBalances = leaveBalances;
            this.attendance = attendance;
            this.attendanceAnalytics = attendanceAnalytics;
            this.timestamp = timestamp;
        }

        public MessageResponse(
                String reply,
                String intent,
                String type,
                List<LeaveBalanceItem> leaveBalances,
                AttendanceItem attendance,
                AttendanceAnalyticsItem attendanceAnalytics,
                List<LeaveHistoryItem> leaveHistory,
                LocalDateTime timestamp) {

            this.reply = reply;
            this.intent = intent;
            this.type = type;
            this.leaveBalances = leaveBalances;
            this.attendance = attendance;
            this.attendanceAnalytics = attendanceAnalytics;
            this.leaveHistory = leaveHistory;
            this.timestamp = timestamp;
        }

        public MessageResponse(
                String reply,
                String intent,
                String type,
                List<LeaveBalanceItem> leaveBalances,
                AttendanceItem attendance,
                AttendanceAnalyticsItem attendanceAnalytics,
                List<LeaveHistoryItem> leaveHistory,
                PayrollItem payroll,
                List<PayrollItem> payrollHistory,
                LocalDateTime timestamp) {

            this.reply = reply;
            this.intent = intent;
            this.type = type;
            this.leaveBalances = leaveBalances;
            this.attendance = attendance;
            this.attendanceAnalytics = attendanceAnalytics;
            this.leaveHistory = leaveHistory;
            this.payroll = payroll;
            this.payrollHistory = payrollHistory;
            this.timestamp = timestamp;
        }

        public MessageResponse(
                String reply,
                String intent,
                String type,
                List<LeaveBalanceItem> leaveBalances,
                AttendanceItem attendance,
                AttendanceAnalyticsItem attendanceAnalytics,
                List<LeaveHistoryItem> leaveHistory,
                PayrollItem payroll,
                List<PayrollItem> payrollHistory,
                EmployeeProfileItem employeeProfile,
                LocalDateTime timestamp) {

            this.reply = reply;
            this.intent = intent;
            this.type = type;
            this.leaveBalances = leaveBalances;
            this.attendance = attendance;
            this.attendanceAnalytics = attendanceAnalytics;
            this.leaveHistory = leaveHistory;
            this.payroll = payroll;
            this.payrollHistory = payrollHistory;
            this.employeeProfile = employeeProfile;
            this.timestamp = timestamp;
        }
    }

    // =========================================================
    // PAYROLL
    // =========================================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PayrollItem {

        private Long id;

        private Long employeeDbId;

        private String employeeName;

        private String employeeCode;

        private int month;

        private int year;

        private java.math.BigDecimal basicSalary;

        private java.math.BigDecimal hra;

        private java.math.BigDecimal da;

        private java.math.BigDecimal specialAllowance;

        private java.math.BigDecimal grossSalary;

        private java.math.BigDecimal esi;

        private java.math.BigDecimal tds;

        private java.math.BigDecimal totalDeductions;

        private java.math.BigDecimal netSalary;

        private int presentDays;

        private java.math.BigDecimal lopDays;
        private boolean paid;

        private LocalDate payDate;
    }

    // =========================================================
    // LEAVE BALANCE
    // =========================================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaveBalanceItem {

        private String leaveType;

        private int year;

        private double total;

        private double used;

        private Object remaining;

        private String status;
    }

    // =========================================================
    // LEAVE HISTORY
    // =========================================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaveHistoryItem {

        private Long id;

        private String leaveType;

        private LocalDate startDate;

        private LocalDate endDate;

        private int totalDays;

        private String reason;

        private String status;

        private String reviewedByName;

        private String remarks;

        private LocalDateTime appliedAt;

        private LocalDateTime actionAt;

        private String cancellationReason;

        private LocalDateTime cancellationRequestedAt;

        private String cancellationRemarks;

        private LocalDateTime cancellationActionAt;

        private String cancellationReviewedByName;
    }

    // =========================================================
    // EMPLOYEE PROFILE
    // =========================================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeProfileItem {

        private String employeeId;

        private String name;

        private String email;

        private String phone;

        private String department;

        private String designation;

        private LocalDate dateOfJoining;

        private String role;

        private boolean active;
    }

    // =========================================================
    // TRAINING
    // =========================================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrainingItem {

        private Long enrollmentId;

        private Long trainingId;

        private String title;

        private String description;

        private String category;

        private String trainer;

        private String mode;

        private LocalDate startDate;

        private LocalDate endDate;

        private Integer durationHours;

        private Integer maxParticipants;

        private Integer enrolledCount;

        private String venue;

        private String meetingLink;

        private String trainingStatus;

        private String enrollmentStatus;

        private boolean completed;

        private Integer score;

        private String feedback;

        private LocalDateTime enrolledAt;

        private LocalDateTime completedAt;
    }

    // =========================================================
    // JOB / RECRUITMENT
    // =========================================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobItem {

        private Long id;

        private String title;

        private String department;

        private String location;

        private String employmentType;

        private String description;

        private String requirements;

        private String experienceRequired;

        private String salaryRange;

        private LocalDate applicationDeadline;

        private String status;

        private int applicationCount;

        private LocalDateTime createdAt;
    }

    // =========================================================
    // RECRUITMENT APPLICATION
    // =========================================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecruitmentApplicationItem {

        private Long id;

        private Long jobPostingId;

        private String jobTitle;

        private String department;

        private String candidateName;

        private Integer experienceYears;

        private Integer experienceMonths;

        private String status;

        private LocalDate interviewDate;

        private String interviewMode;

        private Integer interviewScore;

        private String interviewerName;

        private String rejectionReason;

        private LocalDateTime appliedAt;
    }

    // =========================================================
    // NEW - RECRUITMENT INTELLIGENCE SUMMARY
    // HR / ADMIN ONLY
    // =========================================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecruitmentSummaryItem {

        // -----------------------------------------------------
        // JOB POSTING COUNTS
        // -----------------------------------------------------

        private int totalJobs;

        private int openPositions;

        private int draftJobs;

        private int onHoldJobs;

        private int closedJobs;

        // -----------------------------------------------------
        // APPLICATION PIPELINE
        // -----------------------------------------------------

        private int totalApplications;

        private int appliedCount;

        private int shortlistedCount;

        private int interviewScheduledCount;

        private int interviewedCount;

        private int offerSentCount;

        private int offerAcceptedCount;

        private int offerRejectedCount;

        private int rejectedCount;

        private int withdrawnCount;

        // -----------------------------------------------------
        // RECRUITMENT ACTIVITY
        // -----------------------------------------------------

        private int upcomingInterviewsCount;

        private int jobsClosingSoonCount;

        // -----------------------------------------------------
        // REPORT DATE
        // -----------------------------------------------------

        private LocalDate asOfDate;
    }

    // =========================================================
    // ATTENDANCE
    // =========================================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceItem {

        private LocalDate date;

        private String status;

        private LocalTime checkIn;

        private LocalTime checkOut;

        private Double workHours;

        private Integer totalBreakMinutes;

        private Boolean onBreak;

        private String remarks;
    }

    // =========================================================
    // ATTENDANCE ANALYTICS
    // =========================================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceAnalyticsItem {

        private LocalDate asOfDate;

        private String period;

        private LocalDate periodStart;

        private LocalDate periodEnd;

        private LocalDate yesterdayDate;

        private String yesterdayStatus;

        private LocalTime yesterdayCheckIn;

        private LocalTime yesterdayCheckOut;

        private Double yesterdayWorkHours;

        private String yesterdayRemarks;

        private Integer weeklyPresentCount;

        private Integer weeklyAbsentCount;

        private Integer weeklyHalfDayCount;

        private Integer weeklyLeaveCount;

        private Double weeklyAverageWorkHours;

        private Double weeklyTotalWorkHours;

        private Integer monthlyWorkingDays;

        private Integer monthlyPresentCount;

        private Integer monthlyAbsentCount;

        private Integer monthlyHalfDayCount;

        private Integer monthlyLeaveCount;

        private Double monthlyAttendancePercent;

        private Double monthlyTotalWorkHours;

        private List<DailyAttendanceItem> dailyRecords;
    }

    // =========================================================
    // DAILY ATTENDANCE
    // =========================================================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyAttendanceItem {

        private LocalDate date;

        private String dayName;

        private String status;

        private LocalTime checkIn;

        private LocalTime checkOut;

        private Double workHours;

        private Integer totalBreakMinutes;

        private String remarks;
    }
}