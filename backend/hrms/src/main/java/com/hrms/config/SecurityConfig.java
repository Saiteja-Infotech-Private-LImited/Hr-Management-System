package com.hrms.config;

import com.hrms.repository.EmployeeRepository;
import com.hrms.security.JwtAuthFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

        // ============================================================
        // PUBLIC URLS
        // ============================================================

        private static final String[] PUBLIC_URLS = {

                        // Authentication
                        "/api/auth/login",

                        // OTP LOGIN
                        "/api/auth/verify-login-otp",
                        "/api/auth/resend-login-otp",

                        // Token
                        "/api/auth/refresh",

                        // Password
                        "/api/auth/forgot-password",
                        "/api/auth/reset-password",

                        // Files
                        "/api/files/**",

                        // Recruitment
                        "/api/recruitment/jobs",
                        "/api/recruitment/jobs/*/apply",

                        // Swagger
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/api-docs/**",
                        "/v3/api-docs/**",

                        // Public managers
                        "/api/employees/managers",

                        // Greeting
                        "/api/greeting/status",

                        // Upload
                        "/api/upload/document"
        };

        // ============================================================
        // ADMIN / HR URLS
        // ============================================================

        private static final String[] ADMIN_HR_URLS = {

                        "/api/employees/search",

                        // Payroll
                        "/api/payroll/generate",
                        "/api/payroll/month",
                        "/api/payroll/*/mark-paid",
                        "/api/payslips/generate/**",

                        // Leave
                        "/api/leaves/pending",
                        "/api/leaves/pending-cancellations",
                        "/api/leaves",
                        "/api/leaves/*/hr-action",
                        "/api/leaves/*/cancel-action",

                        // Attendance
                        "/api/attendance/admin/**",

                        // Performance
                        "/api/performance",
                        "/api/performance/*/update",

                        // Training
                        "/api/trainings/enrollments/*/complete",

                        // Recruitment
                        "/api/recruitment/jobs/all",
                        "/api/recruitment/jobs",
                        "/api/recruitment/applications/**",

                        // Onboarding
                        "/api/onboarding/init/**",
                        "/api/onboarding/pending",
                        "/api/onboarding",

                        // Greeting
                        "/api/greeting/send",
                        "/api/greeting/templates",
                        "/api/greeting/templates/**",
                        "/api/greeting/history",
                        "/api/greeting/history/**",

                        "/api/greeting/send-online-interview",
                        "/api/greeting/send-offline-interview",
                        "/api/greeting/send-offer-letter",

                        // Document Request
                        "/api/document-request/send",
                        "/api/document-request/list"
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

                                // ------------------------------------------------
                                // CSRF
                                // ------------------------------------------------
                                .csrf(csrf -> csrf.disable())

                                // ------------------------------------------------
                                // CORS
                                // ------------------------------------------------
                                .cors(cors -> cors.configurationSource(
                                                corsConfigurationSource()))

                                // ------------------------------------------------
                                // JWT / STATELESS
                                // ------------------------------------------------
                                .sessionManagement(sm -> sm.sessionCreationPolicy(
                                                SessionCreationPolicy.STATELESS))

                                // ------------------------------------------------
                                // AUTHORIZATION
                                // ------------------------------------------------
                                .authorizeHttpRequests(auth -> auth

                                                // Public
                                                .requestMatchers(PUBLIC_URLS)
                                                .permitAll()

                                                // Managers
                                                .requestMatchers(
                                                                "/api/employees/managers")
                                                .permitAll()

                                                // Admin / HR
                                                .requestMatchers(ADMIN_HR_URLS)
                                                .hasAnyRole("ADMIN", "HR")

                                                // Authenticated password update
                                                .requestMatchers(
                                                                "/api/auth/change-password")
                                                .authenticated()

                                                .requestMatchers(
                                                                "/api/auth/update-password")
                                                .authenticated()

                                                // Attendance
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

                                                // Everything else
                                                .anyRequest()
                                                .authenticated())

                                // ------------------------------------------------
                                // AUTH PROVIDER
                                // ------------------------------------------------
                                .authenticationProvider(
                                                authenticationProvider)

                                // ------------------------------------------------
                                // JWT FILTER
                                // ------------------------------------------------
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

                return username -> employeeRepository
                                .findByEmail(username)
                                .orElseThrow(() -> new UsernameNotFoundException(
                                                "User not found: " + username));
        }

        // ============================================================
        // AUTHENTICATION PROVIDER
        // ============================================================

        @Bean
        public AuthenticationProvider authenticationProvider(
                        UserDetailsService userDetailsService,
                        PasswordEncoder passwordEncoder) {

                DaoAuthenticationProvider provider = new DaoAuthenticationProvider();

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
        // CORS
        // ============================================================

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {

                CorsConfiguration config = new CorsConfiguration();

                config.setAllowedOriginPatterns(
                                List.of("*"));

                config.setAllowedMethods(
                                List.of(
                                                "GET",
                                                "POST",
                                                "PUT",
                                                "DELETE",
                                                "PATCH",
                                                "OPTIONS"));

                config.setAllowedHeaders(
                                List.of("*"));

                config.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

                source.registerCorsConfiguration(
                                "/**",
                                config);

                return source;
        }
}