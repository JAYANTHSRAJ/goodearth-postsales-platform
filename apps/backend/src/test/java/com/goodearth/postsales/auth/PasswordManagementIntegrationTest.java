package com.goodearth.postsales.auth;

import com.goodearth.postsales.auth.controller.AuthController;
import com.goodearth.postsales.auth.dto.*;
import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.auth.service.AuthService;
import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.entity.FamilyMember;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.buyer.repository.FamilyMemberRepository;
import com.goodearth.postsales.common.enumeration.UserRole;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.notification.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles(value = "test", inheritProfiles = false)
@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
@Transactional
public class PasswordManagementIntegrationTest {

    @Autowired
    private AuthController authController;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BuyerRepository buyerRepository;

    @Autowired
    private FamilyMemberRepository familyMemberRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private EmailService emailService;

    private User buyerUser;
    private User familyUser;

    @BeforeEach
    public void setUp() {
        String buyerEmail = "primary.buyer.pwd@goodearth.com";
        String familyEmail = "family.member.pwd@goodearth.com";

        userRepository.findByEmailIgnoreCase(buyerEmail).ifPresent(u -> userRepository.delete(u));
        userRepository.findByEmailIgnoreCase(familyEmail).ifPresent(u -> userRepository.delete(u));
        buyerRepository.findByEmailIgnoreCase(buyerEmail).ifPresent(b -> buyerRepository.delete(b));

        Buyer buyer = new Buyer();
        buyer.setEmail(buyerEmail);
        buyer.setFullName("Primary Buyer Pwd");
        buyer.setZohoContactId("ZOHO-PWD-1");
        buyer = buyerRepository.save(buyer);

        buyerUser = new User();
        buyerUser.setEmail(buyerEmail);
        buyerUser.setFullName("Primary Buyer Pwd");
        buyerUser.setPassword(passwordEncoder.encode("OldPass@123"));
        buyerUser.setRole(UserRole.CLIENT);
        buyerUser.setAccountActivated(true);
        buyerUser = userRepository.save(buyerUser);

        FamilyMember fm = new FamilyMember();
        fm.setName("Family Member Pwd");
        fm.setEmail(familyEmail);
        fm.setRelation("Spouse");
        fm.setBuyer(buyer);
        familyMemberRepository.save(fm);

        familyUser = new User();
        familyUser.setEmail(familyEmail);
        familyUser.setFullName("Family Member Pwd");
        familyUser.setPassword(passwordEncoder.encode("FamilyOldPass@123"));
        familyUser.setRole(UserRole.CLIENT);
        familyUser.setAccountActivated(true);
        familyUser = userRepository.save(familyUser);
    }

    @Test
    public void testPrimaryBuyerChangePassword() {
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(buyerUser.getEmail())
                .password("OldPass@123")
                .roles("CLIENT")
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())
        );

        ChangePasswordRequestDto req = new ChangePasswordRequestDto("OldPass@123", "NewPass@456", "NewPass@456");
        ResponseEntity<ApiResponse<String>> res = authController.changePassword(userDetails, req);

        assertEquals(HttpStatus.OK, res.getStatusCode());

        // Verify login with old password fails
        LoginRequest oldLogin = new LoginRequest();
        oldLogin.setEmail(buyerUser.getEmail());
        oldLogin.setPassword("OldPass@123");
        assertThrows(CustomException.class, () -> authService.authenticateCredentials(oldLogin, "127.0.0.1", "Test"));

        // Verify login with new password succeeds
        LoginRequest newLogin = new LoginRequest();
        newLogin.setEmail(buyerUser.getEmail());
        newLogin.setPassword("NewPass@456");
        LoginResponse loginRes = authService.authenticateCredentials(newLogin, "127.0.0.1", "Test");
        assertNotNull(loginRes);
        assertNotNull(loginRes.getAccessToken());
    }

    @Test
    public void testFamilyMemberChangePassword() {
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(familyUser.getEmail())
                .password("FamilyOldPass@123")
                .roles("CLIENT")
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())
        );

        ChangePasswordRequestDto req = new ChangePasswordRequestDto("FamilyOldPass@123", "FamilyNewPass@789", "FamilyNewPass@789");
        ResponseEntity<ApiResponse<String>> res = authController.changePassword(userDetails, req);

        assertEquals(HttpStatus.OK, res.getStatusCode());

        // Verify login with new password succeeds
        LoginRequest newLogin = new LoginRequest();
        newLogin.setEmail(familyUser.getEmail());
        newLogin.setPassword("FamilyNewPass@789");
        LoginResponse loginRes = authService.authenticateCredentials(newLogin, "127.0.0.1", "Test");
        assertNotNull(loginRes);
    }

    @Test
    public void testForgotPasswordAndResetPasswordFlow() {
        // 1. Request Forgot Password Email
        ForgotPasswordRequestDto forgotReq = new ForgotPasswordRequestDto(buyerUser.getEmail());
        ResponseEntity<ApiResponse<String>> forgotRes = authController.forgotPassword(forgotReq);
        assertEquals(HttpStatus.OK, forgotRes.getStatusCode());

        // Verify Email Sent
        ArgumentCaptor<String> emailCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> subjectCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);

        verify(emailService, times(1)).sendEmail(emailCaptor.capture(), subjectCaptor.capture(), bodyCaptor.capture());
        assertEquals(buyerUser.getEmail(), emailCaptor.getValue());
        assertTrue(subjectCaptor.getValue().contains("Reset Your GoodEarth Password"));
        assertTrue(bodyCaptor.getValue().contains("This link expires in 30 minutes"));

        // Retrieve Token from DB
        User userWithToken = userRepository.findByEmailIgnoreCase(buyerUser.getEmail()).orElseThrow();
        String token = userWithToken.getResetPasswordToken();
        assertNotNull(token);

        // 2. Validate Invalid Token
        ResponseEntity<ApiResponse<ResetPasswordValidateResponseDto>> invalidVal = authController.validateResetPasswordToken("invalid-token-123");
        assertFalse(invalidVal.getBody().getData().isValid());

        // 3. Validate Expired Token
        userWithToken.setResetPasswordTokenExpiry(LocalDateTime.now().minusMinutes(5));
        userRepository.save(userWithToken);

        ResponseEntity<ApiResponse<ResetPasswordValidateResponseDto>> expiredVal = authController.validateResetPasswordToken(token);
        assertFalse(expiredVal.getBody().getData().isValid());

        // Reset expiry to valid
        userWithToken.setResetPasswordTokenExpiry(LocalDateTime.now().plusMinutes(30));
        userRepository.save(userWithToken);

        // 4. Validate Valid Token
        ResponseEntity<ApiResponse<ResetPasswordValidateResponseDto>> validRes = authController.validateResetPasswordToken(token);
        assertTrue(validRes.getBody().getData().isValid());
        assertEquals(buyerUser.getEmail(), validRes.getBody().getData().getEmail());

        // 5. Submit Password Reset
        ResetPasswordRequestDto resetReq = new ResetPasswordRequestDto(token, "ResetPass@999", "ResetPass@999");
        ResponseEntity<ApiResponse<String>> resetRes = authController.resetPassword(resetReq);
        assertEquals(HttpStatus.OK, resetRes.getStatusCode());

        // 6. Verify Old Password Rejected
        LoginRequest oldLogin = new LoginRequest();
        oldLogin.setEmail(buyerUser.getEmail());
        oldLogin.setPassword("OldPass@123");
        assertThrows(CustomException.class, () -> authService.authenticateCredentials(oldLogin, "127.0.0.1", "Test"));

        // 7. Verify Login with New Password Succeeds
        LoginRequest newLogin = new LoginRequest();
        newLogin.setEmail(buyerUser.getEmail());
        newLogin.setPassword("ResetPass@999");
        LoginResponse loginRes = authService.authenticateCredentials(newLogin, "127.0.0.1", "Test");
        assertNotNull(loginRes.getAccessToken());

        // 8. Verify Token is One-Time Used (invalid after reset)
        ResponseEntity<ApiResponse<ResetPasswordValidateResponseDto>> reusedVal = authController.validateResetPasswordToken(token);
        assertFalse(reusedVal.getBody().getData().isValid());
    }
}
