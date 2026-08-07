package com.goodearth.postsales.buyer;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.buyer.service.ZohoBuyerSyncService;
import com.goodearth.postsales.client.controller.ClientPortalController;
import com.goodearth.postsales.client.dto.ClientUnitDto;
import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.integration.zoho.dto.ZohoDealResponse;
import com.goodearth.postsales.notification.service.EmailService;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles(value = "test", inheritProfiles = false)
@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
@Transactional
public class ExistingBuyerNewPropertyIntegrationTest {

    @Autowired
    private ZohoBuyerSyncService zohoBuyerSyncService;

    @Autowired
    private BuyerRepository buyerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkflowRepository workflowRepository;

    @Autowired
    private ClientPortalController clientPortalController;

    @MockBean
    private EmailService emailService;

    private final String buyerEmail = "repeat.buyer@goodearth.com";

    @BeforeEach
    public void setUp() {
        reset(emailService);
    }

    @Test
    public void testExistingBuyerSecondPropertyWorkflow() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("buyersCreated", 0);
        summary.put("buyersUpdated", 0);
        summary.put("buyersSkipped", 0);

        // -------------------------------------------------------------
        // STEP 1: Buyer purchases first property (Deal 1: ochre2122)
        // -------------------------------------------------------------
        ZohoDealResponse.ZohoDeal deal1 = new ZohoDealResponse.ZohoDeal();
        deal1.setId("ochre2122");
        deal1.setDealName("Villa Motif16 - Booking");
        deal1.setEmail(buyerEmail);
        deal1.setStage("BOOKING_CONFIRMED");

        ZohoDealResponse.ProjectSite ps1 = new ZohoDealResponse.ProjectSite();
        ps1.setName("GoodEarth Motif");
        deal1.setProjectSite(ps1);

        ZohoDealResponse.UnitName u1 = new ZohoDealResponse.UnitName();
        u1.setName("Motif16");
        deal1.setUnitName(u1);

        zohoBuyerSyncService.processSingleDeal(deal1, summary);

        // Verify Buyer created
        List<Buyer> buyersAfterFirst = buyerRepository.findAllByEmailIgnoreCase(buyerEmail);
        assertEquals(1, buyersAfterFirst.size(), "Should have exactly 1 Buyer entity after 1st deal");
        Buyer buyer1 = buyersAfterFirst.get(0);
        assertEquals("Motif16", buyer1.getUnitName());

        // Verify User created
        List<User> usersAfterFirst = userRepository.findAll().stream()
                .filter(u -> buyerEmail.equalsIgnoreCase(u.getEmail()))
                .toList();
        assertEquals(1, usersAfterFirst.size(), "Should have exactly 1 User after 1st deal");

        // Verify Welcome/Activation email sent
        verify(emailService, times(1)).sendEmail(eq(buyerEmail), contains("Welcome to GoodEarth Homeowner Portal"), anyString());

        // -------------------------------------------------------------
        // STEP 2: Buyer purchases second property (Deal 2: emerald3040)
        // -------------------------------------------------------------
        reset(emailService);

        ZohoDealResponse.ZohoDeal deal2 = new ZohoDealResponse.ZohoDeal();
        deal2.setId("emerald3040");
        deal2.setDealName("Villa Motif24 - Booking");
        deal2.setEmail(buyerEmail);
        deal2.setStage("STRUCTURE_COMPLETED");

        ZohoDealResponse.ProjectSite ps2 = new ZohoDealResponse.ProjectSite();
        ps2.setName("GoodEarth Motif");
        deal2.setProjectSite(ps2);

        ZohoDealResponse.UnitName u2 = new ZohoDealResponse.UnitName();
        u2.setName("Motif24");
        deal2.setUnitName(u2);

        zohoBuyerSyncService.processSingleDeal(deal2, summary);

        // -------------------------------------------------------------
        // STEP 3: Verification & Assertions
        // -------------------------------------------------------------

        // A. No duplicate Buyer created
        List<Buyer> buyersAfterSecond = buyerRepository.findAllByEmailIgnoreCase(buyerEmail);
        assertEquals(1, buyersAfterSecond.size(), "Buyer entity MUST be reused, no duplicate Buyer");

        // B. No duplicate User created
        List<User> usersAfterSecond = userRepository.findAll().stream()
                .filter(u -> buyerEmail.equalsIgnoreCase(u.getEmail()))
                .toList();
        assertEquals(1, usersAfterSecond.size(), "User entity MUST be reused, no duplicate User");

        // C. Second Booking / Workflow created under same Buyer
        List<Workflow> workflows = workflowRepository.findByBuyerId(buyer1.getId());
        assertEquals(2, workflows.size(), "Second Workflow MUST be created for the second property under the same Buyer");

        // D. Property Purchase Notification email sent (NOT Welcome Activation Email)
        verify(emailService, times(1)).sendEmail(
                eq(buyerEmail),
                contains("Congratulations on your new property"),
                contains("Open GoodEarth Portal")
        );
        verify(emailService, never()).sendEmail(eq(buyerEmail), contains("Welcome to GoodEarth Homeowner Portal"), anyString());

        // E. Owned units count becomes 2 via ClientPortalController
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(buyerEmail).password("Pass@123").roles("CLIENT").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities()));

        ResponseEntity<ApiResponse<List<ClientUnitDto>>> res = clientPortalController.getOwnedUnits(userDetails);
        assertEquals(HttpStatus.OK, res.getStatusCode());

        List<ClientUnitDto> ownedUnits = res.getBody().getData();
        assertEquals(2, ownedUnits.size(), "Owned units count MUST become 2 for the buyer");

        // Verify title (unitName) vs Unit Ref/Code (bookingId / unitId)
        assertTrue(ownedUnits.stream().anyMatch(u -> "Motif16".equals(u.getUnitName())), "First unit title should be Motif16");
        assertTrue(ownedUnits.stream().anyMatch(u -> "Motif24".equals(u.getUnitName())), "Second unit title should be Motif24");
    }
}
