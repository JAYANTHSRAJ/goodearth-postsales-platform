package com.goodearth.postsales.config;

import com.goodearth.postsales.security.CustomAccessDeniedHandler;
import com.goodearth.postsales.security.CustomAuthenticationEntryPoint;
import com.goodearth.postsales.security.jwt.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.beans.factory.annotation.Value;
import java.util.List;

/**
 * Spring Security Core Web filter chain configuration class. Sets stateless session policy,
 * defines URL access routes, and links custom authentication and access handlers.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class WebSecurityConfig {

    @Value("${app.cors.allowed-origins:*}")
    private List<String> allowedOrigins;

    @Value("${app.swagger.enabled:true}")
    private boolean swaggerEnabled;

    @Value("${app.hsts.enabled:false}")
    private boolean hstsEnabled;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final com.goodearth.postsales.client.context.ActiveUnitFilter activeUnitFilter;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    public WebSecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            com.goodearth.postsales.client.context.ActiveUnitFilter activeUnitFilter,
            CustomAuthenticationEntryPoint authenticationEntryPoint,
            CustomAccessDeniedHandler accessDeniedHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.activeUnitFilter = activeUnitFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .headers(headers -> {
                headers.frameOptions(frame -> frame.sameOrigin())
                       .contentTypeOptions(content -> {})
                       .referrerPolicy(referrer -> referrer.policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN));
                
                if (hstsEnabled) {
                    headers.httpStrictTransportSecurity(hsts -> hsts
                        .includeSubDomains(true)
                        .maxAgeInSeconds(31536000)
                    );
                } else {
                    headers.httpStrictTransportSecurity(hsts -> hsts.disable());
                }
            })
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .authorizeHttpRequests(auth -> {
                auth.requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                    .requestMatchers("/actuator/**", "/health", "/api/v1/health", "/api/v1/admin/verification/**", "/admin/verification/**", "/verification/**").permitAll()
                    .requestMatchers(
                        "/api/v1/auth/login", "/api/v1/auth/refresh", "/api/v1/auth/activation/**", "/api/v1/auth/password-reset/**",
                        "/api/v1/auth/forgot-password", "/api/v1/auth/reset-password/**",
                        "/api/v1/auth/activate", "/api/v1/resend-activation",
                        "/auth/login", "/auth/refresh", "/auth/activation/**", "/auth/password-reset/**",
                        "/auth/forgot-password", "/auth/reset-password/**",
                        "/auth/activate", "/auth/resend-activation"
                    ).permitAll()
                    .requestMatchers("/api/v1/webhooks/**", "/webhooks/**").permitAll();
                
                if (swaggerEnabled) {
                    auth.requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**").permitAll();
                } else {
                    auth.requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**").denyAll();
                }
                
                auth.anyRequest().authenticated();
            })
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(activeUnitFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public org.springframework.web.filter.CorsFilter corsFilter() {
        return new org.springframework.web.filter.CorsFilter(corsConfigurationSource());
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        List<String> origins = new java.util.ArrayList<>(List.of(
            "https://goodearth-postsales-platform.vercel.app",
            "https://*.vercel.app",
            "https://goodearth.in",
            "https://*.goodearth.in",
            "http://localhost:*",
            "http://127.0.0.1:*"
        ));

        if (allowedOrigins != null && !allowedOrigins.isEmpty()) {
            for (String orig : allowedOrigins) {
                if (orig != null && !orig.isBlank()) {
                    String cleaned = orig.replace("[", "").replace("]", "").trim();
                    for (String part : cleaned.split(",")) {
                        String singleOrigin = part.trim();
                        // Filter out invalid middle-wildcard pattern if passed via env
                        if (singleOrigin.contains("-*.")) {
                            singleOrigin = "https://*.vercel.app";
                        }
                        if (!singleOrigin.isEmpty() && !origins.contains(singleOrigin)) {
                            origins.add(singleOrigin);
                        }
                    }
                }
            }
        }

        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Link", "X-Total-Count", "X-Active-Unit-ID"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
