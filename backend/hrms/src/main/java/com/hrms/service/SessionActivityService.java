package com.hrms.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionActivityService {

    private final Map<String, Long> lastActivity = new ConcurrentHashMap<>();

    @Value("${app.session.inactivity-timeout:300000}")
    private long inactivityTimeout;

    /**
     * Start or refresh the user's activity timer.
     */
    public void recordActivity(String email) {

        if (email == null || email.isBlank()) {
            return;
        }

        lastActivity.put(
                normalizeEmail(email),
                System.currentTimeMillis());
    }

    /**
     * Check whether the session has expired.
     */
    public boolean isSessionExpired(String email) {

        if (email == null || email.isBlank()) {
            return true;
        }

        String key = normalizeEmail(email);

        Long lastActiveTime = lastActivity.get(key);

        /*
         * IMPORTANT:
         *
         * If there is no activity record yet, don't immediately
         * destroy a freshly authenticated JWT session.
         *
         * The JWT itself has already been validated by JwtUtil.
         */
        if (lastActiveTime == null) {
            return false;
        }

        long inactiveTime = System.currentTimeMillis() - lastActiveTime;

        return inactiveTime >= inactivityTimeout;
    }

    /**
     * Get remaining inactivity time.
     */
    public long getRemainingTime(String email) {

        if (email == null || email.isBlank()) {
            return 0;
        }

        Long lastActiveTime = lastActivity.get(normalizeEmail(email));

        if (lastActiveTime == null) {
            return inactivityTimeout;
        }

        long remaining = inactivityTimeout -
                (System.currentTimeMillis() - lastActiveTime);

        return Math.max(remaining, 0);
    }

    /**
     * Remove user's activity.
     */
    public void removeActivity(String email) {

        if (email == null || email.isBlank()) {
            return;
        }

        lastActivity.remove(
                normalizeEmail(email));
    }

    /**
     * Clear all activity.
     */
    public void clearAll() {
        lastActivity.clear();
    }

    private String normalizeEmail(String email) {
        return email.toLowerCase().trim();
    }
}