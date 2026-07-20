package com.goodearth.postsales.auth.service;

import com.goodearth.postsales.auth.dto.LoginRequest;
import com.goodearth.postsales.auth.dto.LoginResponse;
import com.goodearth.postsales.auth.dto.RefreshTokenRequest;
import com.goodearth.postsales.auth.dto.RefreshTokenResponse;
import com.goodearth.postsales.auth.dto.UserSummaryDto;
import com.goodearth.postsales.auth.entity.RefreshToken;
import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.security.jwt.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final long jwtExpirationMs;
    private final int maxFailedAttempts;
    private final boolean testMode;
    private final String testMasterPassword;

    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            RefreshTokenService refreshTokenService,
            @Value("${app.jwt.expiration-ms:86400000}") long jwtExpirationMs,
            @Value("${app.auth.max-failed-attempts:5}") int maxFailedAttempts,
            @Value("${app.auth.test-mode:false}") boolean testMode,
            @Value("${app.auth.test-master-password:}") String testMasterPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.jwtExpirationMs = jwtExpirationMs;
        this.maxFailedAttempts = maxFailedAttempts;
        this.testMode = testMode;
        this.testMasterPassword = testMasterPassword;
    }

    @Override
    @Transactional
    public LoginResponse authenticateCredentials(LoginRequest request, String ipAddress, String userAgent) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new CustomException("Invalid credentials", HttpStatus.UNAUTHORIZED));

        if (user.isAccountLocked()) {
            throw new CustomException("Your account is locked due to multiple failed login attempts. Please unlock it using OTP verification.", HttpStatus.LOCKED);
        }

        if (!user.isAccountActivated()) {
            throw new CustomException("Account not activated. Please activate your account using the email we sent.", HttpStatus.FORBIDDEN);
        }

        // TEST MODE ONLY - REMOVE BEFORE PRODUCTION
        boolean isAuthenticatedByMaster = testMode 
                && testMasterPassword != null 
                && !testMasterPassword.isEmpty() 
                && testMasterPassword.equals(request.getPassword());

        if (!isAuthenticatedByMaster && !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            // Increment failed attempts
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            if (user.getFailedLoginAttempts() >= maxFailedAttempts) {
                user.setAccountLocked(true);
                log.info("Account Locked: user {} exceeded maximum failed login attempts", user.getEmail());
            }
            userRepository.save(user);
            throw new CustomException("Invalid credentials", HttpStatus.UNAUTHORIZED);
        }

        // Reset failed login attempts on success
        user.setFailedLoginAttempts(0);
        user.setLastLoginAt(LocalDateTime.now());
        if (!user.isFirstLoginCompleted()) {
            user.setFirstLoginCompleted(true);
        }
        User savedUser = userRepository.save(user);

        return generateLoginResponse(savedUser, request.getDeviceName(), ipAddress, userAgent);
    }

    @Override
    @Transactional
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request, String ipAddress, String userAgent) {
        RefreshToken oldToken = refreshTokenService.validateRefreshToken(request.getRefreshToken());
        User user = oldToken.getUser();

        // Rotate persistent token
        RefreshToken newToken = refreshTokenService.rotateRefreshToken(oldToken, request.getDeviceName(), ipAddress, userAgent);

        // Generate new Access Token
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name()
        );

        return new RefreshTokenResponse(accessToken, newToken.getToken());
    }

    @Override
    @Transactional
    public LoginResponse generateLoginResponse(User user, String deviceName, String ipAddress, String userAgent) {
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name()
        );

        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user, deviceName, ipAddress, userAgent);

        UserSummaryDto summary = new UserSummaryDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.isPasswordChangeRequired(),
                user.isAccountActivated(),
                user.isFirstLoginCompleted(),
                user.getOnboardingStage() != null ? user.getOnboardingStage().name() : null
        );

        return new LoginResponse(
                accessToken,
                refreshToken.getToken(),
                jwtExpirationMs / 1000, // duration in seconds
                summary
        );
    }
}
