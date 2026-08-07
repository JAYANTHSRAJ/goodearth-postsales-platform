package com.goodearth.postsales.auth.service;

import com.goodearth.postsales.auth.dto.*;
import com.goodearth.postsales.auth.entity.RefreshToken;
import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.notification.service.EmailService;
import com.goodearth.postsales.security.jwt.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;
    private final long jwtExpirationMs;
    private final int maxFailedAttempts;
    private final boolean testMode;
    private final String testMasterPassword;

    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            RefreshTokenService refreshTokenService,
            EmailService emailService,
            @Value("${app.jwt.expiration-ms:86400000}") long jwtExpirationMs,
            @Value("${app.auth.max-failed-attempts:5}") int maxFailedAttempts,
            @Value("${app.auth.test-mode:false}") boolean testMode,
            @Value("${app.auth.test-master-password:}") String testMasterPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.emailService = emailService;
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

    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new CustomException("Password must be at least 8 characters long", HttpStatus.BAD_REQUEST);
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new CustomException("Password must contain at least one uppercase letter", HttpStatus.BAD_REQUEST);
        }
        if (!password.matches(".*[a-z].*")) {
            throw new CustomException("Password must contain at least one lowercase letter", HttpStatus.BAD_REQUEST);
        }
        if (!password.matches(".*[0-9].*")) {
            throw new CustomException("Password must contain at least one number", HttpStatus.BAD_REQUEST);
        }
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
            throw new CustomException("Password must contain at least one special character", HttpStatus.BAD_REQUEST);
        }
    }

    @Override
    @Transactional
    public void changePassword(UserDetails userDetails, ChangePasswordRequestDto request) {
        if (userDetails == null) {
            throw new CustomException("User is not authenticated", HttpStatus.UNAUTHORIZED);
        }
        User user = userRepository.findByEmailIgnoreCase(userDetails.getUsername())
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new CustomException("Current password is incorrect", HttpStatus.BAD_REQUEST);
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new CustomException("New password and confirm password do not match", HttpStatus.BAD_REQUEST);
        }

        validatePasswordStrength(request.getNewPassword());

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(Instant.now());
        user.setLastPasswordChange(LocalDateTime.now());
        user.setPasswordChangeRequired(false);
        userRepository.save(user);

        refreshTokenService.revokeAllUserTokens(user);
        log.info("[PASSWORD_MGMT] Successfully changed password for user={}", user.getEmail());
    }

    @Override
    @Transactional
    public String forgotPassword(ForgotPasswordRequestDto request) {
        String email = request.getEmail().trim().toLowerCase();
        log.info("[PASSWORD_MGMT] Forgot password requested for email={}", email);

        java.util.Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String resetToken = UUID.randomUUID().toString();
            user.setResetPasswordToken(resetToken);
            user.setResetPasswordTokenExpiry(LocalDateTime.now().plusMinutes(30));
            userRepository.save(user);

            String resetUrl = "https://goodearth-postsales-platform.vercel.app/reset-password?token=" + resetToken;
            String userName = user.getFullName() != null ? user.getFullName() : user.getEmail();
            String subject = "Reset Your GoodEarth Password";
            String body = String.format(
                    "Hello %s,\n\n" +
                    "Click below to reset your password:\n\n" +
                    "%s\n\n" +
                    "This link expires in 30 minutes.\n\n" +
                    "If you didn't request this, ignore this email.\n\n" +
                    "Regards,\n" +
                    "GoodEarth Team",
                    userName,
                    resetUrl
            );

            try {
                emailService.sendEmail(email, subject, body);
                log.info("[PASSWORD_MGMT] Password reset email sent successfully to email={}", email);
            } catch (Exception ex) {
                log.error("[PASSWORD_MGMT] Failed to send password reset email to email={}: {}", email, ex.getMessage(), ex);
            }
        } else {
            log.info("[PASSWORD_MGMT] Account not found for email={}, returning generic response", email);
        }

        return "If the account exists, a reset link has been sent.";
    }

    @Override
    @Transactional(readOnly = true)
    public ResetPasswordValidateResponseDto validateResetPasswordToken(String token) {
        if (token == null || token.isBlank()) {
            return new ResetPasswordValidateResponseDto(false, null, null, "Token is required");
        }

        java.util.Optional<User> userOpt = userRepository.findByResetPasswordToken(token);
        if (userOpt.isEmpty()) {
            return new ResetPasswordValidateResponseDto(false, null, null, "Invalid or expired password reset token");
        }

        User user = userOpt.get();
        if (user.getResetPasswordTokenExpiry() == null || user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            return new ResetPasswordValidateResponseDto(false, user.getEmail(), user.getFullName(), "Password reset token has expired");
        }

        return new ResetPasswordValidateResponseDto(true, user.getEmail(), user.getFullName(), "Token is valid");
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequestDto request) {
        if (request.getToken() == null || request.getToken().isBlank()) {
            throw new CustomException("Token is required", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findByResetPasswordToken(request.getToken())
                .orElseThrow(() -> new CustomException("Invalid or expired password reset token", HttpStatus.BAD_REQUEST));

        if (user.getResetPasswordTokenExpiry() == null || user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new CustomException("Password reset token has expired", HttpStatus.BAD_REQUEST);
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new CustomException("New password and confirm password do not match", HttpStatus.BAD_REQUEST);
        }

        validatePasswordStrength(request.getNewPassword());

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        user.setPasswordChangedAt(Instant.now());
        user.setLastPasswordChange(LocalDateTime.now());
        user.setPasswordChangeRequired(false);
        userRepository.save(user);

        refreshTokenService.revokeAllUserTokens(user);
        log.info("[PASSWORD_MGMT] Successfully reset password using token for user={}", user.getEmail());
    }
}
