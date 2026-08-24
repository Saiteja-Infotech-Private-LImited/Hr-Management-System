package com.hrms.repository;

import com.hrms.entity.OtpPurpose;
import com.hrms.entity.OtpStore;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpStoreRepository
        extends JpaRepository<OtpStore, Long> {

    /**
     * Delete existing OTPs only for the same
     * email and same purpose.
     *
     * LOGIN OTP will NOT delete PASSWORD_RESET OTP.
     */
    @Modifying
    @Query("""
            DELETE FROM OtpStore o
            WHERE LOWER(o.email) = LOWER(:email)
            AND o.purpose = :purpose
            """)
    void deleteByEmailAndPurpose(
            @Param("email") String email,
            @Param("purpose") OtpPurpose purpose);

    /**
     * Find the latest active OTP for a particular
     * email and purpose.
     */
    @Query("""
            SELECT o
            FROM OtpStore o
            WHERE LOWER(o.email) = LOWER(:email)
            AND o.purpose = :purpose
            AND o.used = false
            AND o.expiresAt > :now
            ORDER BY o.id DESC
            """)
    Optional<OtpStore> findLatestActiveOtp(
            @Param("email") String email,
            @Param("purpose") OtpPurpose purpose,
            @Param("now") LocalDateTime now);

    /**
     * Optional cleanup method.
     */
    @Modifying
    @Query("""
            DELETE FROM OtpStore o
            WHERE o.expiresAt < :now
            """)
    void deleteExpiredOtps(
            @Param("now") LocalDateTime now);
}