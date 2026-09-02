package com.hrms.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url:}")
    private String url;

    @Value("${spring.datasource.username:root}")
    private String username;

    @Value("${spring.datasource.password:}")
    private String password;

    @Value("${spring.datasource.driver-class-name:com.mysql.cj.jdbc.Driver}")
    private String driverClassName;

    @Bean
    public DataSource dataSource() {
        String finalUrl = url;
        
        // Add serverTimezone if using MySQL and not already present
        if (finalUrl != null && finalUrl.startsWith("jdbc:mysql:")) {
            if (!finalUrl.contains("serverTimezone")) {
                finalUrl += (finalUrl.contains("?") ? "&" : "?") + "serverTimezone=UTC";
            }
        }
        
        DataSourceBuilder<?> builder = DataSourceBuilder.create();
        if (finalUrl != null && !finalUrl.isEmpty()) builder.url(finalUrl);
        if (username != null && !username.isEmpty()) builder.username(username);
        if (password != null && !password.isEmpty()) builder.password(password);
        if (driverClassName != null && !driverClassName.isEmpty()) builder.driverClassName(driverClassName);
        
        return builder.build();
    }
}