package com.goodearth.postsales.auth.service;

import com.goodearth.postsales.auth.entity.RefreshToken;
import com.goodearth.postsales.auth.entity.User;

/**
 * Service interface responsible for managing persistent OAuth-style refresh tokens.
 * Handles token generation, caching, rotation, and revocation for multi-device sessions.
 */
public interface RefreshTokenService {

    /**
     * Creates and persists a new RefreshToken for the specified user and device metadata.
     *
     * @param user       the user principal
     * @param deviceName the name of the device initiating the session
     * @param ipAddress  the client IP address
     * @param userAgent  the client browser user agent
     * @return the created RefreshToken entity
     */
    RefreshToken createRefreshToken(User user, String deviceName, String ipAddress, String userAgent);

    /**
     * Validates that the token exists, is active (not revoked), and has not expired.
     *
     * @param token the raw refresh token string
     * @return the validated RefreshToken entity
     * @throws RuntimeException if the token is invalid or expired
     */
    RefreshToken validateRefreshToken(String token);

    /**
     * Rotates an existing refresh token by revoking it and issuing a new one for security.
     *
     * @param oldToken   the active old refresh token entity
     * @param deviceName the device name
     * @param ipAddress  the client IP address
     * @param userAgent  the client browser user agent
     * @return the newly rotated RefreshToken entity
     */
    RefreshToken rotateRefreshToken(RefreshToken oldToken, String deviceName, String ipAddress, String userAgent);

    /**
     * Revokes a specific refresh token by setting its revoked flag to true.
     *
     * @param token the raw refresh token string
     */
    void revokeRefreshToken(String token);
}
