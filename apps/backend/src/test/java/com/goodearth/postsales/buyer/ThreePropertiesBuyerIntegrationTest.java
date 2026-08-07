package com.goodearth.postsales.buyer;

import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.buyer.service.ZohoBuyerSyncService;
import com.goodearth.postsales.client.context.ActivePropertyContext;
import com.goodearth.postsales.client.controller.ClientPortalController;
import com.goodearth.postsales.client.dto.ClientUnitDto;
import com.goodearth.postsales.client.service.ClientPortalServiceHelper;
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
import static org.mockito.Mockito.reset;

@SpringBootTest
@ActiveProfiles(value = "test", inheritProfiles = false)
@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
@Transactional
public class ThreePropertiesBuyerIntegrationTest {

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

    @Autowired
    private ClientPortalServiceHelper helper;

    @MockBean
    private EmailService emailService;

    private final String buyerEmail = "triplet.buyer@goodearth.com";

    @BeforeEach
    public void setUp() {
        reset(emailService);
        ActivePropertyContext.clear();
    }

    @Test
    public void testBuyerOwningThreeDifferentProperties() {
        Map<String, Object> summary = new HashMap<>();

        // Deal 1: Motif -> motif16
        ZohoDealResponse.ZohoDeal deal1 = new ZohoDealResponse.ZohoDeal();
        deal1.setId("motif16");
        deal1.setDealName("Villa Motif16 - Booking");
        deal1.setEmail(buyerEmail);
        deal1.setStage("BOOKING_CONFIRMED");

        ZohoDealResponse.ProjectSite ps1 = new ZohoDealResponse.ProjectSite();
        ps1.setName("GoodEarth Motif");
        deal1.setProjectSite(ps1);

        ZohoDealResponse.UnitName u1 = new ZohoDealResponse.UnitName();
        u1.setName("motif16");
        deal1.setUnitName(u1);

        zohoBuyerSyncService.processSingleDeal(deal1, summary);

        // Deal 2: Ochre New -> ochre2122
        ZohoDealResponse.ZohoDeal deal2 = new ZohoDealResponse.ZohoDeal();
        deal2.setId("ochre2122");
        deal2.setDealName("Villa Ochre2122 - Booking");
        deal2.setEmail(buyerEmail);
        deal2.setStage("STRUCTURE_COMPLETED");

        ZohoDealResponse.ProjectSite ps2 = new ZohoDealResponse.ProjectSite();
        ps2.setName("GoodEarth Ochre");
        deal2.setProjectSite(ps2);

        ZohoDealResponse.UnitName u2 = new ZohoDealResponse.UnitName();
        u2.setName("ochre2122");
        deal2.setUnitName(u2);

        zohoBuyerSyncService.processSingleDeal(deal2, summary);

        // Deal 3: Umang -> uumang2
        ZohoDealResponse.ZohoDeal deal3 = new ZohoDealResponse.ZohoDeal();
        deal3.setId("uumang2");
        deal3.setDealName("Villa Umang2 - Booking");
        deal3.setEmail(buyerEmail);
        deal3.setStage("HANDOVER");

        ZohoDealResponse.ProjectSite ps3 = new ZohoDealResponse.ProjectSite();
        ps3.setName("GoodEarth Umang");
        deal3.setProjectSite(ps3);

        ZohoDealResponse.UnitName u3 = new ZohoDealResponse.UnitName();
        u3.setName("uumang2");
        deal3.setUnitName(u3);

        zohoBuyerSyncService.processSingleDeal(deal3, summary);

        // Verify owned units
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(buyerEmail).password("Pass@123").roles("CLIENT").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities()));

        ResponseEntity<ApiResponse<List<ClientUnitDto>>> res = clientPortalController.getOwnedUnits(userDetails);
        assertEquals(HttpStatus.OK, res.getStatusCode());

        List<ClientUnitDto> ownedUnits = res.getBody().getData();
        assertEquals(3, ownedUnits.size(), "Buyer should own exactly 3 distinct properties");

        ClientUnitDto unitMotif = ownedUnits.stream().filter(u -> "motif16".equals(u.getBookingId())).findFirst().orElse(null);
        ClientUnitDto unitOchre = ownedUnits.stream().filter(u -> "ochre2122".equals(u.getBookingId())).findFirst().orElse(null);
        ClientUnitDto unitUmang = ownedUnits.stream().filter(u -> "uumang2".equals(u.getBookingId())).findFirst().orElse(null);

        assertNotNull(unitMotif, "Motif unit should exist");
        assertNotNull(unitOchre, "Ochre unit should exist");
        assertNotNull(unitUmang, "Umang unit should exist");

        assertEquals("motif16", unitMotif.getUnitName(), "Card 1 unitName must be motif16 only");
        assertEquals("ochre2122", unitOchre.getUnitName(), "Card 2 unitName must be ochre2122 only");
        assertEquals("uumang2", unitUmang.getUnitName(), "Card 3 unitName must be uumang2 only");

        assertEquals("GoodEarth Motif", unitMotif.getProjectName());
        assertEquals("GoodEarth Ochre", unitOchre.getProjectName());
        assertEquals("GoodEarth Umang", unitUmang.getProjectName());

        // Verify active property context resolution for each property
        Buyer buyer = buyerRepository.findFirstByEmailIgnoreCaseOrderByIdDesc(buyerEmail).orElseThrow();

        // 1. Set Context to Motif
        ActivePropertyContext.setContext(ActivePropertyContext.PropertyContext.builder()
                .buyerId(buyer.getId())
                .workflowId(unitMotif.getWorkflowId())
                .bookingId("motif16")
                .dealId("motif16")
                .build());
        Workflow wfMotif = helper.getBuyerWorkflow(buyer);
        assertEquals("motif16", wfMotif.getProject().getZohoDealId(), "Opening Motif property must load Motif workflow");

        // 2. Set Context to Ochre
        ActivePropertyContext.setContext(ActivePropertyContext.PropertyContext.builder()
                .buyerId(buyer.getId())
                .workflowId(unitOchre.getWorkflowId())
                .bookingId("ochre2122")
                .dealId("ochre2122")
                .build());
        Workflow wfOchre = helper.getBuyerWorkflow(buyer);
        assertEquals("ochre2122", wfOchre.getProject().getZohoDealId(), "Opening Ochre property must load Ochre workflow");

        // 3. Set Context to Umang
        ActivePropertyContext.setContext(ActivePropertyContext.PropertyContext.builder()
                .buyerId(buyer.getId())
                .workflowId(unitUmang.getWorkflowId())
                .bookingId("uumang2")
                .dealId("uumang2")
                .build());
        Workflow wfUmang = helper.getBuyerWorkflow(buyer);
        assertEquals("uumang2", wfUmang.getProject().getZohoDealId(), "Opening Umang property must load Umang workflow");

        ActivePropertyContext.clear();
    }
}
