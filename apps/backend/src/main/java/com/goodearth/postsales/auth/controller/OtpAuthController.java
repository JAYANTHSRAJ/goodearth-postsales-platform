package com.goodearth.postsales.auth.controller;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.auth.service.OtpService;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.common.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping({"/api/v1/auth", "/auth"})
public class OtpAuthController {

    private static final Logger log = LoggerFactory.getLogger(OtpAuthController.class);

    private final OtpService otpService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Pattern: Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character.
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\",./<>?]).{8,}$");

    public OtpAuthController(
            OtpService otpService,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.otpService = otpService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/activation/request-otp")
    public ResponseEntity<ApiResponse<String>> requestActivationOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            throw new CustomException("Email is required.", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new CustomException("No portal account found for the registered email.", HttpStatus.NOT_FOUND));

        if (user.isAccountActivated()) {
            throw new CustomException("Your account is already activated. Please login directly.", HttpStatus.BAD_REQUEST);
        }

        otpService.generateAndSendOtp(email, "ACCOUNT_ACTIVATION");
        return ResponseEntity.ok(new ApiResponse<>("OTP sent to your registered email."));
    }

    @PostMapping("/activation/verify-otp")
    public ResponseEntity<ApiResponse<String>> verifyActivationOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        if (email == null || otp == null || email.trim().isEmpty() || otp.trim().isEmpty()) {
            throw new CustomException("Email and OTP are required.", HttpStatus.BAD_REQUEST);
        }

        otpService.verifyOtp(email, "ACCOUNT_ACTIVATION", otp);
        return ResponseEntity.ok(new ApiResponse<>("OTP verified successfully."));
    }

    @PostMapping("/activation/complete")
    public ResponseEntity<ApiResponse<String>> completeActivation(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        String password = request.get("password");

        if (email == null || otp == null || password == null || email.trim().isEmpty() || otp.trim().isEmpty() || password.trim().isEmpty()) {
            throw new CustomException("Email, OTP, and password are required.", HttpStatus.BAD_REQUEST);
        }

        // Verify OTP first (which marks it used)
        otpService.verifyOtp(email, "ACCOUNT_ACTIVATION", otp);

        // Validate Password Complexity
        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            throw new CustomException("Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new CustomException("User not found.", HttpStatus.NOT_FOUND));

        user.setPassword(passwordEncoder.encode(password));
        log.info("Password Created for user: {}", email);
        user.setAccountActivated(true);
        log.info("Account Activated for user: {}", email);
        user.setPortalActivated(true);
        user.setPasswordChangeRequired(false);
        user.setLastPasswordChange(LocalDateTime.now());
        userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse<>("Account activated successfully. You can now login."));
    }

    @PostMapping("/password-reset/request-otp")
    public ResponseEntity<ApiResponse<String>> requestPasswordResetOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            throw new CustomException("Email is required.", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new CustomException("No portal account found for the registered email.", HttpStatus.NOT_FOUND));

        otpService.generateAndSendOtp(email, "PASSWORD_RESET");
        return ResponseEntity.ok(new ApiResponse<>("OTP sent to your registered email."));
    }

    @PostMapping("/password-reset/complete")
    public ResponseEntity<ApiResponse<String>> completePasswordReset(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        String password = request.get("password");

        if (email == null || otp == null || password == null || email.trim().isEmpty() || otp.trim().isEmpty() || password.trim().isEmpty()) {
            throw new CustomException("Email, OTP, and password are required.", HttpStatus.BAD_REQUEST);
        }

        otpService.verifyOtp(email, "PASSWORD_RESET", otp);

        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            throw new CustomException("Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new CustomException("User not found.", HttpStatus.NOT_FOUND));

        user.setPassword(passwordEncoder.encode(password));
        log.info("Password Reset for user: {}", email);
        user.setAccountActivated(true);
        user.setAccountLocked(false);
        user.setFailedLoginAttempts(0);
        user.setLastPasswordChange(LocalDateTime.now());
        userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse<>("Password reset successfully. You can now login."));
    }
}
