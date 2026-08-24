package com.hrms.service;

import com.hrms.entity.OtpPurpose;
import com.hrms.entity.OtpStore;
import com.hrms.repository.OtpStoreRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

        private final OtpStoreRepository otpStoreRepository;

        private final SecureRandom secureRandom = new SecureRandom();

        /**
         * OTP expiry in minutes.
         *
         * application.properties:
         *
         * app.otp.expiry=10
         */
        @Value("${app.otp.expiry:10}")
        private long otpExpiryMinutes;

        /**
         * ============================================================
         * GENERATE LOGIN OTP
         * ============================================================
         */
        @Transactional
        public String generateLoginOtp(String email) {

                return generateAndSaveOtp(
                                email,
                                OtpPurpose.LOGIN);
        }

        /**
         * ============================================================
         * GENERATE PASSWORD RESET OTP
         * ============================================================
         */
        @Transactional
        public String generatePasswordResetOtp(String email) {

                return generateAndSaveOtp(
                                email,
                                OtpPurpose.PASSWORD_RESET);
        }

        /**
         * ============================================================
         * COMMON OTP GENERATION
         * ============================================================
         */
        @Transactional
        public String generateAndSaveOtp(
                        String email,
                        OtpPurpose purpose) {

                if (email == null || email.isBlank()) {
                        throw new IllegalArgumentException(
                                        "Email cannot be empty");
                }

                if (purpose == null) {
                        throw new IllegalArgumentException(
                                        "OTP purpose cannot be null");
                }

                String normalizedEmail = email.trim().toLowerCase();

                /*
                 * IMPORTANT:
                 *
                 * Delete only OTPs belonging to the SAME purpose.
                 *
                 * Login OTP:
                 * LOGIN -> deleted
                 * PASSWORD_RESET -> preserved
                 *
                 * Password reset OTP:
                 * PASSWORD_RESET -> deleted
                 * LOGIN -> preserved
                 */
                otpStoreRepository.deleteByEmailAndPurpose(
                                normalizedEmail,
                                purpose);

                /*
                 * Generate secure 6-digit OTP.
                 */
                String otp = String.format(
                                "%06d",
                                secureRandom.nextInt(1_000_000));

                /*
                 * Create OTP record.
                 */
                OtpStore otpStore = new OtpStore(
                                normalizedEmail,
                                otp,
                                LocalDateTime.now()
                                                .plusMinutes(
                                                                otpExpiryMinutes),
                                purpose);

                otpStoreRepository.save(otpStore);

                /*
                 * Never log the actual OTP.
                 */
                log.info(
                                "{} OTP generated for email: {}",
                                purpose,
                                normalizedEmail);

                return otp;
        }

        /**
         * ============================================================
         * VALIDATE LOGIN OTP
         * ============================================================
         */
        @Transactional
        public boolean validateLoginOtp(
                        String email,
                        String otp) {

                return validateOtp(
                                email,
                                otp,
                                OtpPurpose.LOGIN);
        }

        /**
         * ============================================================
         * VALIDATE PASSWORD RESET OTP
         * ============================================================
         */
        @Transactional
        public boolean validatePasswordResetOtp(
                        String email,
                        String otp) {

                return validateOtp(
                                email,
                                otp,
                                OtpPurpose.PASSWORD_RESET);
        }

        /**
         * ============================================================
         * COMMON OTP VALIDATION
         * ============================================================
         */
        @Transactional
        public boolean validateOtp(
                        String email,
                        String otp,
                        OtpPurpose purpose) {

                if (email == null
                                || email.isBlank()
                                || otp == null
                                || otp.isBlank()
                                || purpose == null) {

                        return false;
                }

                String normalizedEmail = email.trim().toLowerCase();

                String normalizedOtp = otp.trim();

                Optional<OtpStore> otpStoreOptional = otpStoreRepository.findLatestActiveOtp(
                                normalizedEmail,
                                purpose,
                                LocalDateTime.now());

                if (otpStoreOptional.isEmpty()) {

                        log.warn(
                                        "No active {} OTP found for email: {}",
                                        purpose,
                                        normalizedEmail);

                        return false;
                }

                OtpStore store = otpStoreOptional.get();

                /*
                 * Additional expiration check.
                 */
                if (store.isExpired()) {

                        log.warn(
                                        "{} OTP expired for email: {}",
                                        purpose,
                                        normalizedEmail);

                        return false;
                }

                /*
                 * Check OTP value.
                 */
                if (!store.getOtp().equals(normalizedOtp)) {

                        log.warn(
                                        "Invalid {} OTP for email: {}",
                                        purpose,
                                        normalizedEmail);

                        return false;
                }

                /*
                 * Mark OTP as used.
                 */
                store.setUsed(true);

                otpStoreRepository.save(store);

                log.info(
                                "{} OTP successfully verified for email: {}",
                                purpose,
                                normalizedEmail);

                return true;
        }

        /**
         * ============================================================
         * OLD METHOD - BACKWARD COMPATIBILITY
         * ============================================================
         *
         * If some existing password reset code is still calling:
         *
         * generateAndSaveOtp(email)
         *
         * it will continue to work as PASSWORD_RESET.
         */
        @Transactional
        public String generateAndSaveOtp(String email) {

                return generatePasswordResetOtp(email);
        }

        /**
         * ============================================================
         * OLD VALIDATION METHOD - BACKWARD COMPATIBILITY
         * ============================================================
         *
         * Existing password-reset code calling:
         *
         * validateOtp(email, otp)
         *
         * will continue to validate PASSWORD_RESET OTP.
         */
        @Transactional
        public boolean validateOtp(
                        String email,
                        String otp) {

                return validatePasswordResetOtp(
                                email,
                                otp);
        }

        /**
         * ============================================================
         * CLEANUP EXPIRED OTPs
         * ============================================================
         */
        @Transactional
        public void deleteExpiredOtps() {

                otpStoreRepository.deleteExpiredOtps(
                                LocalDateTime.now());

                log.info("Expired OTP records cleaned up");
        }
}