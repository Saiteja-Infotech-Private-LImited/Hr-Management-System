package com.hrms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "otp_store", indexes = {
        @Index(name = "idx_otp_email_purpose", columnList = "email,purpose")
})
@Getter
@Setter
@NoArgsConstructor
public class OtpStore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(nullable = false, length = 6)
    private String otp;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OtpPurpose purpose;

    public OtpStore(
            String email,
            String otp,
            LocalDateTime expiresAt,
            OtpPurpose purpose) {

        this.email = email;
        this.otp = otp;
        this.expiresAt = expiresAt;
        this.purpose = purpose;
        this.used = false;
    }

    public boolean isExpired() {

        return expiresAt == null
                || LocalDateTime.now().isAfter(expiresAt);
    }
}