
package com.hrms.service;

import com.hrms.dto.PayrollDTOs;
import com.hrms.entity.Attendance;
import com.hrms.entity.Employee;
import com.hrms.entity.Holiday;
import com.hrms.entity.LeaveRequest;
import com.hrms.entity.Payroll;
import com.hrms.enums.AttendanceStatus;
import com.hrms.enums.LeaveStatus;
import com.hrms.repository.AttendanceRepository;
import com.hrms.repository.LeaveRequestRepository;
import com.hrms.repository.PayrollRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PayrollService {

    private final PayrollRepository payrollRepo;
    private final EmployeeService employeeService;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final HolidayService holidayService;

    // Existing salary configuration - preserved
    private static final BigDecimal HRA_RATE = new BigDecimal("0.40");
    private static final BigDecimal DA_RATE = new BigDecimal("0.10");
    private static final BigDecimal ESI_RATE = new BigDecimal("0.0075");
    private static final BigDecimal ESI_GROSS_LIMIT = new BigDecimal("000");

    // One free approved leave day per employee per month
    private static final int FREE_LEAVE_DAYS_PER_MONTH = 1;

    @Transactional
    public PayrollDTOs.Response generatePayroll(
            PayrollDTOs.GenerateRequest request) {

        Employee employee = employeeService.findById(request.getEmployeeId());

        if (payrollRepo.findByEmployeeAndMonthAndYear(
                employee, request.getMonth(), request.getYear()).isPresent()) {

            throw new IllegalStateException(
                    "Payroll already generated for this employee for this month");
        }

        BigDecimal targetGross = employee.getBasicSalary();

        if (targetGross == null) {
            throw new IllegalStateException(
                    "Employee has no basic salary set: " + employee.getEmployeeId());
        }

        YearMonth yearMonth = YearMonth.of(
                request.getYear(), request.getMonth());

        LocalDate monthStart = yearMonth.atDay(1);
        LocalDate monthEnd = yearMonth.atEndOfMonth();
        LocalDate today = LocalDate.now();

        // Do not generate payroll for a future month
        if (monthStart.isAfter(today)) {
            throw new IllegalArgumentException(
                    "Cannot generate payroll for a future month");
        }

        // For the current month, do not count future dates as absent.
        // For completed months, calculate through the month-end.
        LocalDate calculationEnd = monthEnd.isAfter(today)
                ? today
                : monthEnd;

        // ---------------------------------------------------------
        // 1. CALCULATE CALENDAR DAYS, WEEK-OFFS AND HOLIDAYS
        // ---------------------------------------------------------

        int totalDays = yearMonth.lengthOfMonth();
        int weekOffDays = 0;
        int holidayDays = 0;
        int workingDays = 0;

        Set<LocalDate> holidayDates = new HashSet<>();

        List<Holiday> holidays = holidayService.getHolidaysBetween(
                monthStart, monthEnd);

        for (Holiday holiday : holidays) {

            LocalDate from = holiday.getHolidayDate();

            LocalDate to = holiday.getHolidayToDate() != null
                    ? holiday.getHolidayToDate()
                    : from;

            LocalDate date = from.isBefore(monthStart)
                    ? monthStart
                    : from;

            LocalDate lastDate = to.isAfter(monthEnd)
                    ? monthEnd
                    : to;

            while (!date.isAfter(lastDate)) {
                holidayDates.add(date);
                date = date.plusDays(1);
            }
        }

        for (LocalDate date = monthStart; !date.isAfter(monthEnd); date = date.plusDays(1)) {

            if (isWeekend(date)) {
                weekOffDays++;
            } else if (holidayDates.contains(date)) {
                holidayDays++;
            } else {
                workingDays++;
            }
        }

        // ---------------------------------------------------------
        // 2. FETCH ATTENDANCE RECORDS
        // ---------------------------------------------------------

        List<Attendance> attendanceRecords = attendanceRepository.findByEmployeeAndDateBetween(
                employee, monthStart, calculationEnd);

        Map<LocalDate, Attendance> attendanceMap = new HashMap<>();

        for (Attendance attendance : attendanceRecords) {
            attendanceMap.put(attendance.getDate(), attendance);
        }

        // ---------------------------------------------------------
        // 3. FETCH APPROVED LEAVES
        // ---------------------------------------------------------

        List<LeaveStatus> approvedStatuses = Arrays.asList(
                LeaveStatus.APPROVED,
                LeaveStatus.CANCELLATION_PENDING);

        List<LeaveRequest> approvedLeaves = leaveRequestRepository
                .findByEmployeeAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        employee,
                        approvedStatuses,
                        calculationEnd,
                        monthStart);

        Map<LocalDate, String> leaveDateMap = new HashMap<>();

        for (LeaveRequest leave : approvedLeaves) {

            LocalDate from = leave.getStartDate().isBefore(monthStart)
                    ? monthStart
                    : leave.getStartDate();

            LocalDate to = leave.getEndDate().isAfter(calculationEnd)
                    ? calculationEnd
                    : leave.getEndDate();

            LocalDate date = from;

            while (!date.isAfter(to)) {

                // Weekends and company holidays are not leave days
                if (!isWeekend(date) && !holidayDates.contains(date)) {

                    String leaveType = leave.getLeaveType() == null
                            ? ""
                            : leave.getLeaveType().trim().toUpperCase();

                    // Keep one entry per date.
                    // If overlapping records exist, UNPAID takes priority.
                    leaveDateMap.merge(
                            date,
                            leaveType,
                            (existing, current) -> "UNPAID".equals(current)
                                    ? current
                                    : existing);
                }

                date = date.plusDays(1);
            }
        }

        // ---------------------------------------------------------
        // 4. CALCULATE ATTENDANCE AND LEAVE TOTALS
        // ---------------------------------------------------------

        int presentDays = 0;
        int halfDays = 0;
        int absentDays = 0;
        int paidLeaveDays = 0;
        int unpaidLeaveDays = 0;

        // Free leave allowance resets for each employee/month.
        int freeLeaveDaysUsed = 0;

        for (LocalDate date = monthStart; !date.isAfter(calculationEnd); date = date.plusDays(1)) {

            // Ignore weekends and company holidays
            if (isWeekend(date) || holidayDates.contains(date)) {
                continue;
            }

            // Approved leave takes priority over attendance
            if (leaveDateMap.containsKey(date)) {

                // First approved leave day is free,
                // regardless of leave type, including UNPAID.
                if (freeLeaveDaysUsed < FREE_LEAVE_DAYS_PER_MONTH) {

                    paidLeaveDays++;
                    freeLeaveDaysUsed++;

                } else {

                    // Every additional approved leave day is LOP
                    unpaidLeaveDays++;
                }

                continue;
            }

            Attendance attendance = attendanceMap.get(date);

            // Missing attendance is treated as absent
            if (attendance == null || attendance.getStatus() == null) {
                absentDays++;
                continue;
            }

            AttendanceStatus status = attendance.getStatus();

            switch (status) {

                case PRESENT:
                    presentDays++;
                    break;

                case HALF_DAY:
                    halfDays++;
                    break;

                case ABSENT:
                case ON_LEAVE:
                default:
                    absentDays++;
                    break;
            }
        }

        // ---------------------------------------------------------
        // 5. CALCULATE PAYABLE DAYS AND LOP DAYS
        // ---------------------------------------------------------

        BigDecimal halfDayValue = new BigDecimal("0.50");

        BigDecimal lopDays = BigDecimal.valueOf(absentDays)
                .add(BigDecimal.valueOf(unpaidLeaveDays))
                .add(BigDecimal.valueOf(halfDays).multiply(halfDayValue));

        BigDecimal payableDays = BigDecimal.valueOf(presentDays)
                .add(BigDecimal.valueOf(paidLeaveDays))
                .add(BigDecimal.valueOf(halfDays).multiply(halfDayValue));

        // ---------------------------------------------------------
        // 6. CALCULATE EXISTING SALARY COMPONENTS
        // ---------------------------------------------------------

        BigDecimal actualBasic = round(
                targetGross.multiply(new BigDecimal("0.50")));

        BigDecimal hra = round(actualBasic.multiply(HRA_RATE));

        BigDecimal da = round(actualBasic.multiply(DA_RATE));

        BigDecimal specialAllowance = targetGross
                .subtract(actualBasic)
                .subtract(hra)
                .subtract(da);

        BigDecimal basic = actualBasic;

        BigDecimal grossSalary = basic
                .add(hra)
                .add(da)
                .add(specialAllowance);

        // ---------------------------------------------------------
        // 7. CALCULATE LOP DEDUCTION
        // ---------------------------------------------------------

        BigDecimal lopDeduction = BigDecimal.ZERO;

        if (workingDays > 0 && lopDays.compareTo(BigDecimal.ZERO) > 0) {

            BigDecimal dailySalary = grossSalary.divide(
                    BigDecimal.valueOf(workingDays),
                    6,
                    RoundingMode.HALF_UP);

            lopDeduction = round(dailySalary.multiply(lopDays));
        }

        // ---------------------------------------------------------
        // 8. ESI AND TDS - EXISTING CONFIGURATION PRESERVED
        // ---------------------------------------------------------

        BigDecimal esi = grossSalary.compareTo(ESI_GROSS_LIMIT) <= 0
                ? round(grossSalary.multiply(ESI_RATE))
                : BigDecimal.ZERO;

        BigDecimal tds = BigDecimal.ZERO;

        // ---------------------------------------------------------
        // 9. FINAL SALARY
        // ---------------------------------------------------------

        BigDecimal totalDeductions = esi
                .add(tds)
                .add(lopDeduction);

        BigDecimal netSalary = grossSalary.subtract(totalDeductions);

        // ---------------------------------------------------------
        // 10. SAVE PAYROLL
        // ---------------------------------------------------------

        Payroll payroll = Payroll.builder()
                .employee(employee)
                .month(request.getMonth())
                .year(request.getYear())

                .basicSalary(basic)
                .hra(hra)
                .da(da)
                .specialAllowance(specialAllowance)
                .grossSalary(grossSalary)

                .esi(esi)
                .tds(tds)
                .lopDeduction(lopDeduction)
                .totalDeductions(totalDeductions)
                .netSalary(netSalary)

                .totalDays(totalDays)
                .weekOffDays(weekOffDays)
                .holidayDays(holidayDays)
                .workingDays(workingDays)

                .presentDays(presentDays)
                .halfDays(halfDays)
                .absentDays(absentDays)
                .paidLeaveDays(paidLeaveDays)
                .unpaidLeaveDays(unpaidLeaveDays)

                .lopDays(lopDays)
                .payableDays(payableDays)

                .paid(false)
                .build();

        return toResponse(payrollRepo.save(payroll));
    }

    // ---------------------------------------------------------
    // CHECK WEEKEND
    // ---------------------------------------------------------

    private boolean isWeekend(LocalDate date) {

        DayOfWeek day = date.getDayOfWeek();

        return day == DayOfWeek.SATURDAY
                || day == DayOfWeek.SUNDAY;
    }

    // ---------------------------------------------------------
    // GET PAYROLL BY EMPLOYEE
    // ---------------------------------------------------------

    @Transactional(readOnly = true)
    public Page<PayrollDTOs.Response> getByEmployee(
            Long employeeId,
            Pageable pageable) {

        Employee employee = employeeService.findById(employeeId);

        return payrollRepo.findByEmployee(employee, pageable)
                .map(this::toResponse);
    }

    // ---------------------------------------------------------
    // GET PAYROLL BY MONTH
    // ---------------------------------------------------------

    @Transactional(readOnly = true)
    public List<PayrollDTOs.Response> getByMonth(int month, int year) {

        return payrollRepo.findByMonthAndYear(month, year)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ---------------------------------------------------------
    // MARK PAYROLL AS PAID
    // ---------------------------------------------------------

    @Transactional
    public PayrollDTOs.Response markAsPaid(Long payrollId) {

        Payroll payroll = payrollRepo.findById(payrollId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Payroll not found: " + payrollId));

        payroll.setPaid(true);
        payroll.setPayDate(LocalDate.now());

        return toResponse(payrollRepo.save(payroll));
    }

    // ---------------------------------------------------------
    // ROUNDING
    // ---------------------------------------------------------

    private BigDecimal round(BigDecimal value) {

        return value.setScale(2, RoundingMode.HALF_UP);
    }

    // ---------------------------------------------------------
    // CONVERT ENTITY TO RESPONSE DTO
    // ---------------------------------------------------------

    private PayrollDTOs.Response toResponse(Payroll p) {

        PayrollDTOs.Response r = new PayrollDTOs.Response();

        r.setId(p.getId());

        r.setEmployeeDbId(p.getEmployee().getId());

        r.setEmployeeName(
                p.getEmployee().getFirstName()
                        + " "
                        + p.getEmployee().getLastName());

        r.setEmployeeCode(p.getEmployee().getEmployeeId());

        r.setMonth(p.getMonth());
        r.setYear(p.getYear());

        r.setBasicSalary(p.getBasicSalary());
        r.setHra(p.getHra());
        r.setDa(p.getDa());
        r.setSpecialAllowance(p.getSpecialAllowance());
        r.setGrossSalary(p.getGrossSalary());

        r.setEsi(p.getEsi());
        r.setTds(p.getTds());
        r.setLopDeduction(p.getLopDeduction());
        r.setTotalDeductions(p.getTotalDeductions());
        r.setNetSalary(p.getNetSalary());

        r.setTotalDays(p.getTotalDays());
        r.setWeekOffDays(p.getWeekOffDays());
        r.setHolidayDays(p.getHolidayDays());
        r.setWorkingDays(p.getWorkingDays());

        r.setPresentDays(p.getPresentDays());
        r.setHalfDays(p.getHalfDays());
        r.setAbsentDays(p.getAbsentDays());
        r.setPaidLeaveDays(p.getPaidLeaveDays());
        r.setUnpaidLeaveDays(p.getUnpaidLeaveDays());

        r.setLopDays(p.getLopDays());
        r.setPayableDays(p.getPayableDays());

        r.setPaid(p.isPaid());
        r.setPayDate(p.getPayDate());

        return r;
    }
}
