package com.goodearth.postsales.auth.service;

import com.goodearth.postsales.auth.entity.RefreshToken;
import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.RefreshTokenRepository;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final long refreshExpirationMs;

    public RefreshTokenServiceImpl(
            RefreshTokenRepository refreshTokenRepository,
            @Value("${app.jwt.refresh-expiration-ms:604800000}") long refreshExpirationMs) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    @Override
    @Transactional
    public RefreshToken createRefreshToken(User user, String deviceName, String ipAddress, String userAgent) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setUser(user);
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshExpirationMs));
        refreshToken.setRevoked(false);
        refreshToken.setDeviceName(deviceName);
        refreshToken.setIpAddress(ipAddress);
        if (userAgent != null && userAgent.length() > 500) {
            userAgent = userAgent.substring(0, 500);
        }
        refreshToken.setUserAgent(userAgent);

        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    @Transactional(readOnly = true)
    public RefreshToken validateRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new CustomException("Refresh token not found", HttpStatus.UNAUTHORIZED));

        if (refreshToken.isRevoked()) {
            throw new CustomException("Refresh token has been revoked", HttpStatus.UNAUTHORIZED);
        }

        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            throw new CustomException("Refresh token has expired", HttpStatus.UNAUTHORIZED);
        }

        return refreshToken;
    }

    @Override
    @Transactional
    public RefreshToken rotateRefreshToken(RefreshToken oldToken, String deviceName, String ipAddress, String userAgent) {
        oldToken.setRevoked(true);
        refreshTokenRepository.save(oldToken);

        return createRefreshToken(oldToken.getUser(), deviceName, ipAddress, userAgent);
    }

    @Override
    @Transactional
    public void revokeRefreshToken(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(t -> {
            t.setRevoked(true);
            refreshTokenRepository.save(t);
        });
    }
}
