package com.goodearth.postsales.client;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.entity.FamilyMember;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.buyer.repository.FamilyMemberRepository;
import com.goodearth.postsales.client.controller.ClientPortalController;
import com.goodearth.postsales.client.dto.ClientUnitDto;
import com.goodearth.postsales.client.service.ClientPortalServiceHelper;
import com.goodearth.postsales.common.enumeration.UserRole;
import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.notification.service.EmailService;
import com.goodearth.postsales.project.entity.Project;
import com.goodearth.postsales.project.repository.ProjectRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.entity.WorkflowStatus;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles(value = "test", inheritProfiles = false)
@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
@Transactional
public class MultiUnitBuyerIntegrationTest {

    @Autowired
    private ClientPortalController clientPortalController;

    @Autowired
    private ClientPortalServiceHelper helper;

    @Autowired
    private BuyerRepository buyerRepository;

    @Autowired
    private FamilyMemberRepository familyMemberRepository;

    @Autowired
    private WorkflowRepository workflowRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @MockBean
    private EmailService emailService;

    private String singleBuyerEmail = "single.buyer@goodearth.com";
    private String multiBuyerEmail = "multi.buyer@goodearth.com";
    private String familyMemberEmail = "family.multi@goodearth.com";

    private Buyer buyer1;
    private Buyer buyer2;

    @BeforeEach
    public void setUp() {
        Project project = new Project();
        project.setProjectName("GoodEarth Motif");
        project.setProjectCode("GEM");
        project.setZohoDealId("ZOHO-PROJ-1");
        project = projectRepository.save(project);

        // 1. Single unit buyer
        Buyer single = new Buyer();
        single.setFullName("Single Unit Buyer");
        single.setEmail(singleBuyerEmail);
        single.setUnitName("Villa Motif01");
        single.setZohoDealId("DEAL-01");
        single.setZohoContactId("CONTACT-SINGLE-01");
        buyerRepository.save(single);

        // 2. Multi-unit buyer (5 units)
        for (int i = 1; i <= 5; i++) {
            Buyer multi = new Buyer();
            multi.setFullName("Multi Unit Buyer");
            multi.setEmail(multiBuyerEmail);
            multi.setUnitName("Villa Motif" + (i + 10));
            multi.setZohoDealId("DEAL-MULTI-" + i);
            multi.setZohoContactId("CONTACT-MULTI-" + i);
            multi = buyerRepository.save(multi);

            Workflow wf = new Workflow();
            wf.setBuyer(multi);
            wf.setProject(project);
            wf.setStatus(WorkflowStatus.ACTIVE);
            workflowRepository.save(wf);

            if (i == 1) buyer1 = multi;
            if (i == 2) buyer2 = multi;
        }

        // 3. Family Member assigned only to buyer1 (Motif11)
        FamilyMember fm = new FamilyMember();
        fm.setName("Family Member Multi");
        fm.setEmail(familyMemberEmail);
        fm.setRelation("Spouse");
        fm.setBuyer(buyer1);
        familyMemberRepository.save(fm);
    }

    private void setAuth(UserDetails userDetails) {
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    public void testBuyerWithSingleUnit() {
        UserDetails userDetails = User.withUsername(singleBuyerEmail)
                .password("Pass@123").roles("CLIENT").build();
        setAuth(userDetails);

        ResponseEntity<ApiResponse<List<ClientUnitDto>>> res = clientPortalController.getOwnedUnits(userDetails);
        assertEquals(HttpStatus.OK, res.getStatusCode());

        List<ClientUnitDto> units = res.getBody().getData();
        assertEquals(1, units.size());
        assertEquals("Villa Motif01", units.get(0).getUnitName());
    }

    @Test
    public void testBuyerWithFiveUnits() {
        UserDetails userDetails = User.withUsername(multiBuyerEmail)
                .password("Pass@123").roles("CLIENT").build();
        setAuth(userDetails);

        ResponseEntity<ApiResponse<List<ClientUnitDto>>> res = clientPortalController.getOwnedUnits(userDetails);
        assertEquals(HttpStatus.OK, res.getStatusCode());

        List<ClientUnitDto> units = res.getBody().getData();
        assertEquals(5, units.size());
    }

    @Test
    public void testActiveUnitSwitchingContext() {
        UserDetails userDetails = User.withUsername(multiBuyerEmail)
                .password("Pass@123").roles("CLIENT").build();
        setAuth(userDetails);

        // Switch to Unit 1
        com.goodearth.postsales.client.context.ActiveUnitContext.setActiveUnitId(buyer1.getId());
        Buyer active1 = helper.getAuthenticatedBuyer(userDetails);
        assertEquals(buyer1.getId(), active1.getId());
        assertEquals("Villa Motif11", active1.getUnitName());

        // Switch to Unit 2
        com.goodearth.postsales.client.context.ActiveUnitContext.setActiveUnitId(buyer2.getId());
        Buyer active2 = helper.getAuthenticatedBuyer(userDetails);
        assertEquals(buyer2.getId(), active2.getId());
        assertEquals("Villa Motif12", active2.getUnitName());

        com.goodearth.postsales.client.context.ActiveUnitContext.clear();
    }

    @Test
    public void testFamilyMemberUnitIsolation() {
        UserDetails userDetails = User.withUsername(familyMemberEmail)
                .password("Pass@123").roles("CLIENT").build();
        setAuth(userDetails);

        ResponseEntity<ApiResponse<List<ClientUnitDto>>> res = clientPortalController.getOwnedUnits(userDetails);
        assertEquals(HttpStatus.OK, res.getStatusCode());

        List<ClientUnitDto> units = res.getBody().getData();
        assertEquals(1, units.size());
        assertEquals("Villa Motif11", units.get(0).getUnitName());
    }
}
