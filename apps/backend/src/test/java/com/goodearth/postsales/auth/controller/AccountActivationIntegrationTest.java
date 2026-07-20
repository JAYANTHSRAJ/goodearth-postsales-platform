package com.goodearth.postsales.auth.controller;

import com.goodearth.postsales.auth.dto.*;
import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.auth.service.ActivationTokenService;
import com.goodearth.postsales.auth.service.AuthService;
import com.goodearth.postsales.common.enumeration.UserRole;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.common.response.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class AccountActivationIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivationTokenService activationTokenService;

    @Autowired
    private AuthController authController;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    private User testUser;

    @BeforeEach
    public void setUp() {
        // Clean up existing test user if any
        userRepository.findByEmailIgnoreCase("activation-test@goodearth.com")
                .ifPresent(u -> userRepository.delete(u));

        // Create new inactive user
        testUser = new User();
        testUser.setEmail("activation-test@goodearth.com");
        testUser.setFullName("Activation Test User");
        testUser.setPassword(passwordEncoder.encode("InitialPassword123"));
        testUser.setRole(UserRole.CLIENT);
        testUser.setEnabled(true);
        testUser.setEmailVerified(true);
        testUser.setAccountActivated(false);
        userRepository.save(testUser);
    }

    @Test
    public void testCompleteActivationFlow() {
        // 1. Generate token
        String token = activationTokenService.generateToken(testUser);
        assertNotNull(token);
        assertFalse(token.isEmpty());

        // Verify token saved on user
        User savedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertEquals(token, savedUser.getActivationToken());
        assertNotNull(savedUser.getActivationTokenExpiry());
        assertFalse(savedUser.isAccountActivated());

        // 2. Validate token via GET endpoint
        ResponseEntity<ActivateAccountResponse> getResponse = authController.validateActivationToken(token);
        assertEquals(HttpStatus.OK, getResponse.getStatusCode());
        ActivateAccountResponse body = getResponse.getBody();
        assertNotNull(body);
        assertTrue(body.isValid());
        assertFalse(body.isExpired());
        assertEquals("activation-test@goodearth.com", body.getEmail());

        // 3. Try logging in before activation - should fail with 403 FORBIDDEN
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("activation-test@goodearth.com");
        loginRequest.setPassword("InitialPassword123");
        loginRequest.setDeviceName("TestDevice");

        CustomException loginEx = assertThrows(CustomException.class, () -> {
            authService.authenticateCredentials(loginRequest, "127.0.0.1", "TestAgent");
        });
        assertEquals(HttpStatus.FORBIDDEN, loginEx.getStatus());
        assertEquals("Account not activated. Please activate your account using the email we sent.", loginEx.getMessage());

        // 4. Activate account via POST endpoint
        ActivateAccountRequest activateReq = new ActivateAccountRequest();
        activateReq.setToken(token);
        activateReq.setPassword("NewSecurePassword@123"); // Meets strength criteria

        ResponseEntity<ApiResponse<String>> activateRes = authController.activateAccount(activateReq);
        assertEquals(HttpStatus.OK, activateRes.getStatusCode());

        // Verify activation status in database
        User activatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertTrue(activatedUser.isAccountActivated());
        assertNull(activatedUser.getActivationToken());
        assertNull(activatedUser.getActivationTokenExpiry());
        assertNotNull(activatedUser.getActivatedAt());

        // Verify password is changed
        assertTrue(passwordEncoder.matches("NewSecurePassword@123", activatedUser.getPassword()));

        // 5. Try logging in now - should succeed
        loginRequest.setPassword("NewSecurePassword@123");
        LoginResponse loginRes = authService.authenticateCredentials(loginRequest, "127.0.0.1", "TestAgent");
        assertNotNull(loginRes);
        assertNotNull(loginRes.getAccessToken());
        assertTrue(loginRes.getUser().isAccountActivated());

        // 6. Resend activation for already active user - should fail with 400 BAD REQUEST
        ResendActivationRequest resendReq = new ResendActivationRequest();
        resendReq.setEmail("activation-test@goodearth.com");

        CustomException resendEx = assertThrows(CustomException.class, () -> {
            authController.resendActivation(resendReq);
        });
        assertEquals(HttpStatus.BAD_REQUEST, resendEx.getStatus());
        assertEquals("Account is already activated", resendEx.getMessage());
    }

    @Test
    public void testInvalidAndExpiredTokens() {
        // Test invalid token validation
        CustomException invalidEx = assertThrows(CustomException.class, () -> {
            authController.validateActivationToken("non-existent-token");
        });
        assertEquals(HttpStatus.NOT_FOUND, invalidEx.getStatus());

        // Test expired token validation
        testUser.setActivationToken("expired-token");
        testUser.setActivationTokenExpiry(LocalDateTime.now().minusHours(1));
        userRepository.save(testUser);

        CustomException expiredEx = assertThrows(CustomException.class, () -> {
            authController.validateActivationToken("expired-token");
        });
        assertEquals(HttpStatus.GONE, expiredEx.getStatus());
    }

    @Test
    public void testPasswordStrengthValidation() {
        String token = activationTokenService.generateToken(testUser);

        ActivateAccountRequest activateReq = new ActivateAccountRequest();
        activateReq.setToken(token);

        // Weak password (no digits/symbols)
        activateReq.setPassword("WeakPass");
        CustomException weakEx = assertThrows(CustomException.class, () -> {
            authController.activateAccount(activateReq);
        });
        assertEquals(HttpStatus.BAD_REQUEST, weakEx.getStatus());
    }
}
