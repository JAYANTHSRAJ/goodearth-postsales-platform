package com.goodearth.postsales.integration.controller;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.entity.UserOtp;
import com.goodearth.postsales.auth.repository.UserOtpRepository;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.integration.service.ZohoDealsOnboardingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/onboarding")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class ZohoOnboardingAdminController {

    private final BuyerRepository buyerRepository;
    private final UserRepository userRepository;
    private final UserOtpRepository otpRepository;
    private final ZohoDealsOnboardingService onboardingService;
    private final PasswordEncoder passwordEncoder;

    public ZohoOnboardingAdminController(
            BuyerRepository buyerRepository,
            UserRepository userRepository,
            UserOtpRepository otpRepository,
            ZohoDealsOnboardingService onboardingService,
            PasswordEncoder passwordEncoder) {
        this.buyerRepository = buyerRepository;
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.onboardingService = onboardingService;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/activations")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getOnboardingActivations() {
        List<Buyer> buyers = buyerRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();

        for (Buyer b : buyers) {
            if (b.getZohoDealId() != null || b.isPortalActivated()) {
                Map<String, Object> map = new HashMap<>();
                map.put("buyerId", b.getId());
                map.put("fullName", b.getFullName());
                map.put("email", b.getEmail());
                map.put("zohoDealId", b.getZohoDealId());
                map.put("portalActivated", b.isPortalActivated());
                map.put("syncStatus", b.getSyncStatus());
                map.put("lastSyncAt", b.getLastSyncAt());

                User u = null;
                if (b.getEmail() != null) {
                    u = userRepository.findByEmailIgnoreCase(b.getEmail()).orElse(null);
                }

                if (u != null) {
                    map.put("accountActivated", u.isAccountActivated());
                    map.put("firstLoginCompleted", u.isFirstLoginCompleted());
                    map.put("lastLogin", u.getLastLoginAt());
                    map.put("accountLocked", u.isAccountLocked());
                } else {
                    map.put("accountActivated", false);
                    map.put("firstLoginCompleted", false);
                    map.put("lastLogin", null);
                    map.put("accountLocked", false);
                }

                // Get last OTP sent time
                UserOtp lastOtp = otpRepository.findFirstByEmailIgnoreCaseAndPurposeAndUsedFalseOrderByCreatedAtDesc(b.getEmail(), "ACCOUNT_ACTIVATION").orElse(null);
                if (lastOtp == null) {
                    lastOtp = otpRepository.findFirstByEmailIgnoreCaseAndPurposeAndUsedFalseOrderByCreatedAtDesc(b.getEmail(), "PASSWORD_RESET").orElse(null);
                }
                map.put("lastOtpSent", lastOtp != null ? lastOtp.getCreatedAt() : null);

                response.add(map);
            }
        }

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/{buyerId}/resend-email")
    public ResponseEntity<ApiResponse<String>> resendWelcomeEmail(@PathVariable UUID buyerId) {
        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new CustomException("Buyer not found.", HttpStatus.NOT_FOUND));

        onboardingService.sendWelcomeEmail(buyer);
        return ResponseEntity.ok(new ApiResponse<>("Activation/welcome email resent successfully."));
    }

    @PostMapping("/{buyerId}/force-reset")
    public ResponseEntity<ApiResponse<String>> forcePasswordReset(@PathVariable UUID buyerId) {
        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new CustomException("Buyer not found.", HttpStatus.NOT_FOUND));
        User user = userRepository.findByEmailIgnoreCase(buyer.getEmail())
                .orElseThrow(() -> new CustomException("Portal user not found.", HttpStatus.NOT_FOUND));

        user.setAccountActivated(false);
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString())); // Invalidate password (encoded)
        userRepository.save(user);

        buyer.setWelcomeEmailSent(false);
        buyer.setLastSyncAt(LocalDateTime.now());
        buyerRepository.save(buyer);

        return ResponseEntity.ok(new ApiResponse<>("Password reset forced. Account deactivated until OTP verification."));
    }

    @PostMapping("/{buyerId}/lock")
    public ResponseEntity<ApiResponse<String>> lockAccount(@PathVariable UUID buyerId) {
        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new CustomException("Buyer not found.", HttpStatus.NOT_FOUND));
        User user = userRepository.findByEmailIgnoreCase(buyer.getEmail())
                .orElseThrow(() -> new CustomException("Portal user not found.", HttpStatus.NOT_FOUND));

        user.setAccountLocked(true);
        userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse<>("Account locked successfully."));
    }

    @PostMapping("/{buyerId}/unlock")
    public ResponseEntity<ApiResponse<String>> unlockAccount(@PathVariable UUID buyerId) {
        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new CustomException("Buyer not found.", HttpStatus.NOT_FOUND));
        User user = userRepository.findByEmailIgnoreCase(buyer.getEmail())
                .orElseThrow(() -> new CustomException("Portal user not found.", HttpStatus.NOT_FOUND));

        user.setAccountLocked(false);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse<>("Account unlocked successfully."));
    }
}
