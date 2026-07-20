package com.goodearth.postsales.auth.service;

import com.goodearth.postsales.auth.dto.LoginRequest;
import com.goodearth.postsales.auth.dto.LoginResponse;
import com.goodearth.postsales.auth.dto.RefreshTokenRequest;
import com.goodearth.postsales.auth.dto.RefreshTokenResponse;
import com.goodearth.postsales.auth.entity.User;

/**
 * Service interface responsible for orchestrating user authentication, token generation,
 * session audits, and security validation policies (failed logins, locking preparations).
 */
public interface AuthService {

    /**
     * Authenticates a user by email and password, increments failed logins on mismatch,
     * resets attempts on success, and logs the session.
     *
     * @param request    the login credentials payload
     * @param ipAddress  the client IP address
     * @param userAgent  the client browser user agent
     * @return the LoginResponse containing access and refresh tokens
     */
    LoginResponse authenticateCredentials(LoginRequest request, String ipAddress, String userAgent);

    /**
     * Validates and rotates a persistent refresh token, returning a new access/refresh token pair.
     *
     * @param request    the refresh token payload
     * @param ipAddress  the client IP address
     * @param userAgent  the client browser user agent
     * @return the RefreshTokenResponse containing the new token pair
     */
    RefreshTokenResponse refreshToken(RefreshTokenRequest request, String ipAddress, String userAgent);

    /**
     * Generates a standard LoginResponse DTO for a validated User. Exposing this method
     * allows OTP, Zoho SSO, and future OAuth providers to reuse the JWT infrastructure.
     *
     * @param user       the authenticated user entity
     * @param deviceName the device name
     * @param ipAddress  the client IP address
     * @param userAgent  the client browser user agent
     * @return the LoginResponse payload
     */
    LoginResponse generateLoginResponse(User user, String deviceName, String ipAddress, String userAgent);
}
