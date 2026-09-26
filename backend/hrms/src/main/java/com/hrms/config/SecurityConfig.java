package com.hrms.config;

import com.hrms.repository.EmployeeRepository;
import com.hrms.security.JwtAuthFilter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    // ============================================================
    // FRONTEND URL
    // ============================================================

    /*
     * Production frontend:
     *
     * https://hrms.saitejainfotechprivatelimited.com
     *
     * Spring property:
     *
     * app.frontend.url
     *
     * Multiple origins can be supplied as comma-separated values.
     */

    @Value("${app.frontend.url:https://hrms.saitejainfotechprivatelimited.com}")
    private String frontendUrl;

    // ============================================================
    // PUBLIC URLS
    // ============================================================

    private static final String[] PUBLIC_URLS = {

            // Authentication
            "/api/auth/login",
            "/api/auth/refresh",

            // Login OTP
            "/api/auth/login/send-otp",
            "/api/auth/login/verify-otp",

            // Forgot Password
            "/api/auth/forgot-password",
            "/api/auth/reset-password",

            // Files
            "/api/files/**",

            // Recruitment
            "/api/recruitment/jobs",
            "/api/recruitment/jobs/*/apply",

            // Swagger / OpenAPI
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/api-docs/**",
            "/v3/api-docs/**",

            // Other public endpoints
            "/api/employees/managers",
            "/api/greeting/status",
            "/api/upload/document"
    };

    // ============================================================
    // ADMIN / HR URLS
    // ============================================================

    /*
     * Controller methods already use @PreAuthorize.
     * Therefore this list can remain empty.
     */

    private static final String[] ADMIN_HR_URLS = {
    };

    // ============================================================
    // SECURITY FILTER CHAIN
    // ============================================================

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            JwtAuthFilter jwtAuthFilter,
            AuthenticationProvider authenticationProvider)
            throws Exception {

        http

                // ====================================================
                // CSRF
                // ====================================================

                .csrf(csrf -> csrf.disable())

                // ====================================================
                // CORS
                // ====================================================

                .cors(cors -> cors.configurationSource(
                        corsConfigurationSource()))

                // ====================================================
                // SESSION MANAGEMENT
                // ====================================================

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS))

                // ====================================================
                // AUTHORIZATION
                // ====================================================

                .authorizeHttpRequests(auth -> auth

                        // ====================================================
                        // CORS PREFLIGHT
                        // ====================================================

                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**")
                        .permitAll()

                        // ====================================================
                        // PUBLIC ENDPOINTS
                        // ====================================================

                        .requestMatchers(PUBLIC_URLS)
                        .permitAll()

                        // ====================================================
                        // RECRUITMENT JOB DELETE
                        // ====================================================

                        /*
                         * ADMIN / HR are allowed at the security layer.
                         *
                         * If you want ADMIN-only deletion, enforce it
                         * in the controller using:
                         *
                         * @PreAuthorize("hasRole('ADMIN')")
                         */

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/recruitment/jobs/**")
                        .hasAnyRole("ADMIN", "HR")

                        // ====================================================
                        // ADMIN / HR
                        // ====================================================

                        .requestMatchers(ADMIN_HR_URLS)
                        .hasAnyRole("ADMIN", "HR")

                        // ====================================================
                        // CHANGE PASSWORD
                        // ====================================================

                        .requestMatchers(
                                "/api/auth/change-password")
                        .authenticated()

                        // ====================================================
                        // ATTENDANCE
                        // ====================================================

                        .requestMatchers(
                                "/api/attendance/check-in")
                        .authenticated()

                        .requestMatchers(
                                "/api/attendance/check-out")
                        .authenticated()

                        .requestMatchers(
                                "/api/attendance/my")
                        .authenticated()

                        .requestMatchers(
                                "/api/attendance/my/**")
                        .authenticated()

                        // ====================================================
                        // CHATBOT
                        // ====================================================

                        /*
                         * The chatbot requires the logged-in employee/JWT.
                         * Do NOT make this endpoint public.
                         */

                        .requestMatchers(
                                "/api/chatbot/**")
                        .authenticated()

                        // ====================================================
                        // EVERYTHING ELSE
                        // ====================================================

                        .anyRequest()
                        .authenticated())

                // ====================================================
                // AUTHENTICATION PROVIDER
                // ====================================================

                .authenticationProvider(
                        authenticationProvider)

                // ====================================================
                // JWT FILTER
                // ====================================================

                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ============================================================
    // USER DETAILS SERVICE
    // ============================================================

    @Bean
    public UserDetailsService userDetailsService(
            EmployeeRepository employeeRepository) {

        return username -> {

            String normalizedUsername =
                    username == null
                            ? ""
                            : username.trim().toLowerCase();

            return employeeRepository
                    .findByEmail(normalizedUsername)
                    .orElseThrow(() ->
                            new UsernameNotFoundException(
                                    "User not found"));
        };
    }

    // ============================================================
    // AUTHENTICATION PROVIDER
    // ============================================================

    @Bean
    public AuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider();

        provider.setUserDetailsService(
                userDetailsService);

        provider.setPasswordEncoder(
                passwordEncoder);

        return provider;
    }

    // ============================================================
    // AUTHENTICATION MANAGER
    // ============================================================

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config)
            throws Exception {

        return config.getAuthenticationManager();
    }

    // ============================================================
    // PASSWORD ENCODER
    // ============================================================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

    // ============================================================
    // CORS CONFIGURATION
    // ============================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config =
                new CorsConfiguration();

        // ========================================================
        // ALLOWED ORIGINS
        // ========================================================

        /*
         * allowedOriginPatterns is used instead of
         * allowedOrigins so production origin handling is
         * more tolerant.
         */

        List<String> allowedOrigins =
                Arrays.stream(frontendUrl.split(","))
                        .map(String::trim)
                        .filter(origin -> !origin.isBlank())
                        .map(origin -> {

                            // Remove trailing slash
                            while (origin.endsWith("/")) {
                                origin = origin.substring(
                                        0,
                                        origin.length() - 1);
                            }

                            return origin;
                        })
                        .toList();

        config.setAllowedOriginPatterns(
                allowedOrigins);

        // ========================================================
        // HTTP METHODS
        // ========================================================

        config.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                ));

        // ========================================================
        // REQUEST HEADERS
        // ========================================================

        config.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept",
                        "Cache-Control",
                        "Pragma",
                        "Expires",
                        "X-Requested-With",
                        "Origin"
                ));

        // ========================================================
        // RESPONSE HEADERS
        // ========================================================

        config.setExposedHeaders(
                List.of(
                        "Authorization"
                ));

        // ========================================================
        // CREDENTIALS
        // ========================================================

        config.setAllowCredentials(true);

        // ========================================================
        // PREFLIGHT CACHE
        // ========================================================

        config.setMaxAge(3600L);

        // ========================================================
        // REGISTER CORS
        // ========================================================

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                config);

        return source;
    }
}
