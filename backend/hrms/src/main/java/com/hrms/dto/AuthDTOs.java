package com.hrms.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Data;

public class AuthDTOs {

    // ============================================================
    // LOGIN REQUEST
    // ============================================================

    @Data
    public static class LoginRequest {

        @NotBlank
        @Email
        private String email;

        @NotBlank
        @Size(min = 6)
        private String password;

        private String loginType;
    }

    // ============================================================
    // LOGIN OTP REQUEST
    // ============================================================

    @Data
    public static class LoginOtpRequest {

        @NotBlank
        @Email
        private String email;

        @NotBlank
        @Size(min = 6, max = 6)
        private String otp;
    }

    // ============================================================
    // RESEND LOGIN OTP
    // ============================================================

    @Data
    public static class ResendLoginOtpRequest {

        @NotBlank
        @Email
        private String email;
    }

    // ============================================================
    // OTP REQUIRED RESPONSE
    // ============================================================

    @Data
    public static class OtpRequiredResponse {

        private boolean requiresOtp;
        private String email;

        public OtpRequiredResponse(
                boolean requiresOtp,
                String email) {

            this.requiresOtp = requiresOtp;
            this.email = email;
        }
    }

    // ============================================================
    // OTP RESEND RESPONSE
    // ============================================================

    @Data
    public static class OtpResendResponse {

        private boolean otpSent;
        private String email;

        public OtpResendResponse(
                boolean otpSent,
                String email) {

            this.otpSent = otpSent;
            this.email = email;
        }
    }

    // ============================================================
    // AUTH RESPONSE
    // ============================================================

    @Data
    public static class AuthResponse {

        private String accessToken;
        private String refreshToken;

        private String tokenType = "Bearer";

        private String role;

        private Long employeeId;
        private String employeeCode;

        private String name;
        private String email;

        private Long expiresIn;

        // OTP LOGIN
        private boolean requiresOtp;
    }

    // ============================================================
    // REFRESH TOKEN
    // ============================================================

    @Data
    public static class RefreshTokenRequest {

        @NotBlank
        private String refreshToken;
    }
}