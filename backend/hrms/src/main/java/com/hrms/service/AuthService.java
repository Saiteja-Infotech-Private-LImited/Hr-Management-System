package com.hrms.service;

import com.hrms.dto.AuthDTOs;
import com.hrms.entity.Employee;
import com.hrms.enums.Role;
import com.hrms.repository.EmployeeRepository;
import com.hrms.security.JwtUtil;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

        private final AuthenticationManager authenticationManager;
        private final EmployeeRepository employeeRepository;
        private final UserCacheService userCacheService;
        private final JwtUtil jwtUtil;
        private final SessionActivityService sessionActivityService;
        private final OtpService otpService;
        private final EmailService emailService;

        // ============================================================
        // LOGIN
        // ============================================================

        public AuthDTOs.AuthResponse login(
                        AuthDTOs.LoginRequest request) {

                Employee emp;

                try {

                        emp = userCacheService
                                        .getByEmail(request.getEmail());

                } catch (Exception e) {

                        throw new BadCredentialsException(
                                        "Invalid email or password");
                }

                // ========================================================
                // CHECK LOGIN TYPE
                // ========================================================

                if ("EMPLOYEE".equalsIgnoreCase(
                                request.getLoginType())) {

                        if (emp.getRole() != Role.EMPLOYEE) {

                                throw new BadCredentialsException(
                                                "This account belongs to Admin/HR. Please use the Admin/HR login portal.");
                        }

                } else if ("ADMIN".equalsIgnoreCase(
                                request.getLoginType())) {

                        if (emp.getRole() == Role.EMPLOYEE) {

                                throw new BadCredentialsException(
                                                "This account is an Employee account. Please use the Employee login portal.");
                        }
                }

                // ========================================================
                // VERIFY EMAIL + PASSWORD
                // ========================================================

                Authentication auth = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getEmail(),
                                                request.getPassword()));

                Employee authenticated = (Employee) auth.getPrincipal();

                // ========================================================
                // GENERATE LOGIN OTP
                // ========================================================

                String otp = otpService.generateAndSaveOtp(
                                authenticated.getEmail());

                // ========================================================
                // SEND OTP EMAIL
                // ========================================================

                emailService.sendOtpEmail(
                                authenticated.getEmail(),
                                otp,
                                authenticated.getFirstName()
                                                + " "
                                                + authenticated.getLastName());

                // ========================================================
                // IMPORTANT
                //
                // DO NOT START SESSION TIMER HERE.
                // DO NOT GENERATE JWT HERE.
                //
                // Session starts only after OTP verification.
                // ========================================================

                AuthDTOs.AuthResponse response = new AuthDTOs.AuthResponse();

                response.setRequiresOtp(true);

                response.setEmail(
                                authenticated.getEmail());

                return response;
        }

        // ============================================================
        // VERIFY LOGIN OTP
        // ============================================================

        public AuthDTOs.AuthResponse verifyLoginOtp(
                        AuthDTOs.LoginOtpRequest request) {

                // ========================================================
                // VALIDATE OTP
                // ========================================================

                boolean validOtp = otpService.validateOtp(
                                request.getEmail(),
                                request.getOtp());

                if (!validOtp) {

                        throw new BadCredentialsException(
                                        "Invalid or expired OTP");
                }

                // ========================================================
                // FIND EMPLOYEE
                // ========================================================

                Employee employee;

                try {

                        employee = userCacheService.getByEmail(
                                        request.getEmail());

                } catch (Exception e) {

                        throw new BadCredentialsException(
                                        "User not found");
                }

                // ========================================================
                // START 5-MINUTE SESSION
                //
                // THIS MUST HAPPEN ONLY AFTER OTP SUCCESS.
                // ========================================================

                sessionActivityService.recordActivity(
                                employee.getEmail());

                // ========================================================
                // GENERATE JWT
                // ========================================================

                return buildAuthResponse(employee);
        }

        // ============================================================
        // RESEND LOGIN OTP
        // ============================================================

        public AuthDTOs.OtpResendResponse resendLoginOtp(
                        AuthDTOs.ResendLoginOtpRequest request) {

                Employee employee;

                try {

                        employee = userCacheService.getByEmail(
                                        request.getEmail());

                } catch (Exception e) {

                        throw new BadCredentialsException(
                                        "Unable to resend OTP");
                }

                // ========================================================
                // GENERATE NEW OTP
                // ========================================================

                String otp = otpService.generateAndSaveOtp(
                                employee.getEmail());

                // ========================================================
                // SEND OTP
                // ========================================================

                emailService.sendOtpEmail(
                                employee.getEmail(),
                                otp,
                                employee.getFirstName()
                                                + " "
                                                + employee.getLastName());

                return new AuthDTOs.OtpResendResponse(
                                true,
                                employee.getEmail());
        }

        // ============================================================
        // REFRESH TOKEN
        // ============================================================

        public AuthDTOs.AuthResponse refresh(
                        AuthDTOs.RefreshTokenRequest request) {

                if (!jwtUtil.validateToken(
                                request.getRefreshToken())) {

                        throw new BadCredentialsException(
                                        "Invalid or expired refresh token");
                }

                String email = jwtUtil.extractEmail(
                                request.getRefreshToken());

                Employee emp;

                try {

                        emp = userCacheService.getByEmail(email);

                } catch (Exception e) {

                        throw new BadCredentialsException(
                                        "User not found");
                }

                /*
                 * IMPORTANT:
                 *
                 * Refreshing JWT does not reset the
                 * inactivity timer.
                 */

                return buildAuthResponse(emp);
        }

        // ============================================================
        // BUILD AUTH RESPONSE
        // ============================================================

        private AuthDTOs.AuthResponse buildAuthResponse(
                        Employee employee) {

                AuthDTOs.AuthResponse response = new AuthDTOs.AuthResponse();

                response.setRequiresOtp(false);

                response.setAccessToken(
                                jwtUtil.generateToken(employee));

                response.setRefreshToken(
                                jwtUtil.generateRefreshToken(employee));

                response.setRole(
                                employee.getRole().name());

                response.setEmployeeId(
                                employee.getId());

                response.setEmployeeCode(
                                employee.getEmployeeId());

                response.setName(
                                employee.getFirstName()
                                                + " "
                                                + employee.getLastName());

                response.setEmail(
                                employee.getEmail());

                response.setExpiresIn(
                                jwtUtil.getExpiration());

                return response;
        }
}