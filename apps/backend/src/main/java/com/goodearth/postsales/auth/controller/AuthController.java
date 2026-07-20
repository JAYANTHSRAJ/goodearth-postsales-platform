package com.goodearth.postsales.auth.controller;

import com.goodearth.postsales.auth.dto.LoginRequest;
import com.goodearth.postsales.auth.dto.LoginResponse;
import com.goodearth.postsales.auth.dto.RefreshTokenRequest;
import com.goodearth.postsales.auth.dto.RefreshTokenResponse;
import com.goodearth.postsales.auth.dto.ActivateAccountRequest;
import com.goodearth.postsales.auth.dto.ActivateAccountResponse;
import com.goodearth.postsales.auth.dto.ResendActivationRequest;
import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.service.AuthService;
import com.goodearth.postsales.auth.service.ActivationTokenService;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.notification.service.EmailService;
import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.common.exception.CustomException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping({"/api/v1/auth", "/auth"})
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final ActivationTokenService activationTokenService;
    private final UserRepository userRepository;
    private final BuyerRepository buyerRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            AuthService authService,
            ActivationTokenService activationTokenService,
            UserRepository userRepository,
            BuyerRepository buyerRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder) {
        this.authService = authService;
        this.activationTokenService = activationTokenService;
        this.userRepository = userRepository;
        this.buyerRepository = buyerRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            HttpServletRequest httpServletRequest) {
        
        String ipAddress = httpServletRequest.getRemoteAddr();
        LoginResponse response = authService.authenticateCredentials(request, ipAddress, userAgent);
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            HttpServletRequest httpServletRequest) {

        String ipAddress = httpServletRequest.getRemoteAddr();
        RefreshTokenResponse response = authService.refreshToken(request, ipAddress, userAgent);
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/activate")
    public ResponseEntity<ActivateAccountResponse> validateActivationToken(
            @RequestParam("token") String token) {
        log.info("Activation request received. Token={}", token);
        log.info("Before validateToken lookup for token={}", token);
        User user;
        try {
            user = activationTokenService.validateToken(token);
            log.info("After validateToken lookup. Found user: {}", user.getEmail());
        } catch (Exception ex) {
            log.info("validateToken lookup failed. Exception: {}", ex.getMessage());
            throw ex;
        }
        
        String fullName = user.getFullName();
        log.info("Before buyerRepository.findByEmailIgnoreCase lookup for email={}", user.getEmail());
        Optional<com.goodearth.postsales.buyer.entity.Buyer> buyerOpt = buyerRepository.findByEmailIgnoreCase(user.getEmail());
        if (buyerOpt.isPresent()) {
            fullName = buyerOpt.get().getFullName();
            log.info("Found buyer matching email. Updated fullName={}", fullName);
        } else {
            log.info("No buyer found matching email={}", user.getEmail());
        }
        
        log.info("Before returning validateActivationToken success");
        return ResponseEntity.ok(new ActivateAccountResponse(
                true,
                false,
                user.getEmail(),
                fullName
        ));
    }

    @PostMapping("/activate")
    public ResponseEntity<ApiResponse<String>> activateAccount(
            @Valid @RequestBody ActivateAccountRequest request) {
        log.info("Activation request received (POST). Token={}", request.getToken());
        log.info("Before validateToken lookup for token={}", request.getToken());
        User user;
        try {
            user = activationTokenService.validateToken(request.getToken());
            log.info("After validateToken lookup. Found user: {}", user.getEmail());
        } catch (Exception ex) {
            log.info("validateToken lookup failed. Exception: {}", ex.getMessage());
            throw ex;
        }
        
        log.info("Before validatePasswordStrength check");
        validatePasswordStrength(request.getPassword());
        log.info("After validatePasswordStrength check (passed)");
        
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        log.info("Before markActivated");
        activationTokenService.markActivated(user);
        log.info("After markActivated");
        
        log.info("Before returning activateAccount success");
        return ResponseEntity.ok(new ApiResponse<>("Account activated successfully"));
    }

    @PostMapping("/resend-activation")
    public ResponseEntity<ApiResponse<String>> resendActivation(
            @Valid @RequestBody ResendActivationRequest request) {
        log.info("Resending activation email for: {}", request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        
        if (user.isAccountActivated()) {
            throw new CustomException("Account is already activated", HttpStatus.BAD_REQUEST);
        }
        
        String token = activationTokenService.generateToken(user);
        
        String fullName = user.getFullName();
        Optional<com.goodearth.postsales.buyer.entity.Buyer> buyerOpt = buyerRepository.findByEmailIgnoreCase(user.getEmail());
        if (buyerOpt.isPresent()) {
            fullName = buyerOpt.get().getFullName();
        }
        
        String subject = "Welcome to GoodEarth Homeowner Portal";
        String activationUrl = "https://goodearth-postsales-platform.vercel.app/activate?token=" + token;
        String body = String.format(
                "Dear %s,\n\n" +
                "Welcome to GoodEarth.\n\n" +
                "Your homeowner portal has been created.\n\n" +
                "Please activate your account by clicking below.\n\n" +
                "%s\n\n" +
                "This link expires in 24 hours.\n\n" +
                "If you did not request this account, ignore this email.\n\n" +
                "Regards,\n" +
                "GoodEarth Team",
                fullName,
                activationUrl
        );
        
        emailService.sendEmail(user.getEmail(), subject, body);
        log.info("Activation email resent successfully to: {}", user.getEmail());
        
        return ResponseEntity.ok(new ApiResponse<>("Activation email resent successfully"));
    }

    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new CustomException("Password must be at least 8 characters long", HttpStatus.BAD_REQUEST);
        }
        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;
        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isDigit(c)) hasDigit = true;
            else if (!Character.isLetterOrDigit(c)) hasSpecial = true;
        }
        if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
            throw new CustomException("Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character", HttpStatus.BAD_REQUEST);
        }
    }
}
