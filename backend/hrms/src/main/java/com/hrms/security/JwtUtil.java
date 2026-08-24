package com.hrms.security;

import com.hrms.entity.Employee;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    private Key cachedKey;

    @PostConstruct
    public void init() {

        this.cachedKey = Keys.hmacShaKeyFor(
                secret.getBytes());
    }

    private Key getSigningKey() {

        return cachedKey != null
                ? cachedKey
                : Keys.hmacShaKeyFor(
                        secret.getBytes());
    }

    // ============================================================
    // ACCESS TOKEN
    // ============================================================

    public String generateToken(Employee employee) {

        return Jwts.builder()
                .setSubject(employee.getEmail())

                .claim(
                        "role",
                        employee.getRole().name())

                .claim(
                        "employeeId",
                        employee.getEmployeeId())

                .claim(
                        "id",
                        employee.getId())

                .setIssuedAt(new Date())

                .setExpiration(
                        new Date(
                                System.currentTimeMillis()
                                        + expiration))

                .signWith(
                        getSigningKey(),
                        SignatureAlgorithm.HS256)

                .compact();
    }

    // ============================================================
    // REFRESH TOKEN
    // ============================================================

    public String generateRefreshToken(
            Employee employee) {

        return Jwts.builder()
                .setSubject(employee.getEmail())

                .setIssuedAt(new Date())

                .setExpiration(
                        new Date(
                                System.currentTimeMillis()
                                        + refreshExpiration))

                .signWith(
                        getSigningKey(),
                        SignatureAlgorithm.HS256)

                .compact();
    }

    // ============================================================
    // EMAIL
    // ============================================================

    public String extractEmail(String token) {

        return getClaims(token)
                .getSubject();
    }

    // ============================================================
    // VALIDATE
    // ============================================================

    public boolean validateToken(String token) {

        try {

            getClaims(token);

            return true;

        } catch (
                JwtException | IllegalArgumentException e) {

            return false;
        }
    }

    // ============================================================
    // EXPIRATION
    // ============================================================

    public long getExpiration() {

        return expiration;
    }

    // ============================================================
    // CLAIMS
    // ============================================================

    private Claims getClaims(String token) {

        return Jwts
                .parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}