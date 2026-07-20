package com.goodearth.postsales.auth.service;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.entity.UserOtp;
import com.goodearth.postsales.auth.repository.UserOtpRepository;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.notification.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    private final UserOtpRepository otpRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public OtpService(
            UserOtpRepository otpRepository,
            UserRepository userRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder) {
        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void generateAndSendOtp(String email, String purpose) {
        // Enforce hourly rate limit: max 3 per hour
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        List<UserOtp> recentOtps = otpRepository.findByEmailIgnoreCaseAndCreatedAtAfter(email, oneHourAgo);
        if (recentOtps.size() >= 3) {
            throw new CustomException("Resend limit reached. You can request at most 3 OTPs per hour.", HttpStatus.TOO_MANY_REQUESTS);
        }

        // Generate 6-digit OTP
        SecureRandom random = new SecureRandom();
        int otpCode = 100000 + random.nextInt(900000);
        String plainOtp = String.valueOf(otpCode);

        // Hash and Save OTP
        UserOtp userOtp = new UserOtp();
        userOtp.setEmail(email);
        userOtp.setOtpHash(passwordEncoder.encode(plainOtp));
        userOtp.setPurpose(purpose);
        userOtp.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        userOtp.setAttempts(0);
        userOtp.setUsed(false);

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        userOpt.ifPresent(userOtp::setUser);

        otpRepository.save(userOtp);
        log.info("OTP Generated for: {}, purpose: {}", email, purpose);

        // Send Email
        String subject = purpose.equals("ACCOUNT_ACTIVATION") ? "Activate Your GoodEarth Homeowner Portal Account" : "Reset Your GoodEarth Homeowner Portal Password";
        String body = String.format(
                "Dear Customer,\n\n" +
                "You have requested a secure verification code.\n\n" +
                "Your OTP code is: %s\n\n" +
                "This code is valid for 10 minutes and can only be used once.\n" +
                "If you did not request this code, please ignore this email.\n\n" +
                "Best regards,\n" +
                "GoodEarth Customer Support",
                plainOtp
        );
        emailService.sendEmail(email, subject, body);
        log.info("Sent OTP email to: {}", email);
    }

    @Transactional
    public void verifyOtp(String email, String purpose, String plainOtp) {
        UserOtp userOtp = otpRepository.findFirstByEmailIgnoreCaseAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, purpose)
                .orElseThrow(() -> new CustomException("Verification code is invalid or has expired.", HttpStatus.BAD_REQUEST));

        if (userOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            userOtp.setUsed(true);
            otpRepository.save(userOtp);
            throw new CustomException("Verification code has expired.", HttpStatus.BAD_REQUEST);
        }

        // Increment attempts
        int currentAttempts = userOtp.getAttempts() + 1;
        userOtp.setAttempts(currentAttempts);
        otpRepository.save(userOtp);

        if (currentAttempts > 5) {
            userOtp.setUsed(true);
            otpRepository.save(userOtp);
            throw new CustomException("Maximum OTP verification attempts exceeded. Please generate a new code.", HttpStatus.BAD_REQUEST);
        }

        if (!passwordEncoder.matches(plainOtp, userOtp.getOtpHash())) {
            throw new CustomException("Verification code is incorrect.", HttpStatus.BAD_REQUEST);
        }

        // Success: Mark used and unlock account if locked
        userOtp.setUsed(true);
        otpRepository.save(userOtp);
        log.info("OTP Verified for: {}, purpose: {}", email, purpose);

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user != null) {
            user.setAccountLocked(false);
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
            log.info("Account Unlocked for: {}", email);
        }
    }
}
