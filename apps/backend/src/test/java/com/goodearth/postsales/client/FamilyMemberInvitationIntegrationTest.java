package com.goodearth.postsales.client;

import com.goodearth.postsales.auth.controller.AuthController;
import com.goodearth.postsales.auth.dto.ActivateAccountRequest;
import com.goodearth.postsales.auth.dto.ActivateAccountResponse;
import com.goodearth.postsales.auth.dto.LoginRequest;
import com.goodearth.postsales.auth.dto.LoginResponse;
import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.auth.service.AuthService;
import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.entity.FamilyMember;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.buyer.repository.FamilyMemberRepository;
import com.goodearth.postsales.client.dto.FamilyMemberDto;
import com.goodearth.postsales.client.service.ClientPortalServiceHelper;
import com.goodearth.postsales.client.service.FamilyMemberService;
import com.goodearth.postsales.notification.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles(value = "test", inheritProfiles = false)
@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
@Transactional
public class FamilyMemberInvitationIntegrationTest {

    @Autowired
    private FamilyMemberService familyMemberService;

    @Autowired
    private FamilyMemberRepository familyMemberRepository;

    @Autowired
    private BuyerRepository buyerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthController authController;

    @Autowired
    private AuthService authService;

    @Autowired
    private com.goodearth.postsales.client.controller.ClientPortalController clientPortalController;

    @Autowired
    private ClientPortalServiceHelper helper;

    @MockBean
    private EmailService emailService;

    private Buyer primaryBuyer;
    private UserDetails buyerUserDetails;

    @BeforeEach
    public void setUp() {
        // Clean existing test buyer/user
        String buyerEmail = "primary.buyer.test@goodearth.com";
        String memberEmail = "family.member.test@goodearth.com";

        userRepository.findByEmailIgnoreCase(buyerEmail).ifPresent(u -> userRepository.delete(u));
        userRepository.findByEmailIgnoreCase(memberEmail).ifPresent(u -> userRepository.delete(u));
        buyerRepository.findByEmailIgnoreCase(buyerEmail).ifPresent(b -> buyerRepository.delete(b));

        primaryBuyer = new Buyer();
        primaryBuyer.setZohoContactId("ZOHO-TEST-123");
        primaryBuyer.setFullName("Primary Buyer Test");
        primaryBuyer.setEmail(buyerEmail);
        primaryBuyer.setPhone("+919876543210");
        primaryBuyer = buyerRepository.save(primaryBuyer);

        User buyerUser = new User();
        buyerUser.setEmail(buyerEmail);
        buyerUser.setFullName("Primary Buyer Test");
        buyerUser.setPassword("Password123!");
        buyerUser.setRole(com.goodearth.postsales.common.enumeration.UserRole.CLIENT);
        buyerUser.setAccountActivated(true);
        userRepository.save(buyerUser);

        buyerUserDetails = org.springframework.security.core.userdetails.User.withUsername(buyerEmail)
                .password("Password123!")
                .roles("CLIENT")
                .build();
    }

    @Test
    public void testFamilyMemberInvitationWorkflowComplete() {
        // 1. Add Family Member (POST /family-members equivalent)
        FamilyMemberDto dto = new FamilyMemberDto();
        dto.setName("Jane Doe");
        dto.setRelation("Spouse");
        dto.setEmail("family.member.test@goodearth.com");
        dto.setPhone("+919876543299");
        dto.setPermissions(List.of("VIEW_MY_HOME", "VIEW_DOCUMENTS"));

        FamilyMemberDto createdDto = familyMemberService.addFamilyMember(buyerUserDetails, dto);
        assertNotNull(createdDto.getId());
        assertEquals("INVITED", createdDto.getInvitationStatus());

        // Verify saved in DB
        Optional<FamilyMember> memberOpt = familyMemberRepository.findById(createdDto.getId());
        assertTrue(memberOpt.isPresent());
        FamilyMember member = memberOpt.get();
        assertEquals("Jane Doe", member.getName());
        assertEquals("INVITED", member.getInvitationStatus());

        // Verify User record & Activation Token created
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase("family.member.test@goodearth.com");
        assertTrue(userOpt.isPresent());
        User memberUser = userOpt.get();
        assertNotNull(memberUser.getActivationToken());
        assertNotNull(memberUser.getActivationTokenExpiry());
        assertFalse(memberUser.isAccountActivated());

        // Verify EmailService.sendEmail was called with activation link
        ArgumentCaptor<String> emailCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> subjectCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);

        verify(emailService, times(1)).sendEmail(emailCaptor.capture(), subjectCaptor.capture(), bodyCaptor.capture());
        assertEquals("family.member.test@goodearth.com", emailCaptor.getValue());
        assertTrue(subjectCaptor.getValue().contains("Family Member"));
        assertTrue(bodyCaptor.getValue().contains("/activate?token=" + memberUser.getActivationToken()));

        // 2. Validate Activation Token via GET /auth/activate?token=...
        String token = memberUser.getActivationToken();
        ResponseEntity<ActivateAccountResponse> valRes = authController.validateActivationToken(token);
        assertEquals(HttpStatus.OK, valRes.getStatusCode());
        assertTrue(valRes.getBody().isValid());
        assertEquals("family.member.test@goodearth.com", valRes.getBody().getEmail());
        assertEquals("Jane Doe", valRes.getBody().getName());

        // 3. Activate Account via POST /auth/activate
        ActivateAccountRequest activateReq = new ActivateAccountRequest();
        activateReq.setToken(token);
        activateReq.setPassword("FamilyPass@123");

        ResponseEntity<com.goodearth.postsales.common.response.ApiResponse<String>> actRes = authController.activateAccount(activateReq);
        assertEquals(HttpStatus.OK, actRes.getStatusCode());

        // Verify activated states
        User updatedMemberUser = userRepository.findByEmailIgnoreCase("family.member.test@goodearth.com").orElseThrow();
        assertTrue(updatedMemberUser.isAccountActivated());

        FamilyMember updatedMember = familyMemberRepository.findById(member.getId()).orElseThrow();
        assertEquals("ACTIVATED", updatedMember.getInvitationStatus());

        // 4. Family Member Login via POST /auth/login
        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("family.member.test@goodearth.com");
        loginReq.setPassword("FamilyPass@123");

        LoginResponse loginRes = authService.authenticateCredentials(loginReq, "127.0.0.1", "TestClient");
        assertNotNull(loginRes);
        assertNotNull(loginRes.getAccessToken());
        assertTrue(loginRes.getUser().isAccountActivated());

        // 5. Access Buyer Portal as Family Member
        UserDetails fmUserDetails = org.springframework.security.core.userdetails.User
                .withUsername("family.member.test@goodearth.com")
                .password("FamilyPass@123")
                .roles("CLIENT")
                .build();

        Buyer resolvedBuyer = helper.getAuthenticatedBuyer(fmUserDetails);
        assertNotNull(resolvedBuyer);
        assertEquals(primaryBuyer.getId(), resolvedBuyer.getId());

        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(fmUserDetails, null, fmUserDetails.getAuthorities())
        );

        ResponseEntity<com.goodearth.postsales.common.response.ApiResponse<List<com.goodearth.postsales.client.dto.ClientUnitDto>>> unitsRes = clientPortalController.getOwnedUnits(fmUserDetails);
        assertEquals(HttpStatus.OK, unitsRes.getStatusCode());
        assertNotNull(unitsRes.getBody());
        List<com.goodearth.postsales.client.dto.ClientUnitDto> ownedUnits = unitsRes.getBody().getData();
        assertFalse(ownedUnits.isEmpty(), "Family member should receive active units from associated buyer, not empty list");
        assertEquals(primaryBuyer.getId(), ownedUnits.get(0).getId());

        // 6. Test Re-send invitation
        familyMemberService.sendInvitation(buyerUserDetails, member.getId());
        verify(emailService, times(2)).sendEmail(anyString(), anyString(), anyString());
    }
}
