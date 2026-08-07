package com.goodearth.postsales.buyer;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.kyc.dto.ApplicantInfoSubmitRequestDto;
import com.goodearth.postsales.kyc.dto.KycApplicationResponseDto;
import com.goodearth.postsales.kyc.dto.KycCopyRequestDto;
import com.goodearth.postsales.kyc.dto.KycCopySourceDto;
import com.goodearth.postsales.kyc.entity.KycApplication;
import com.goodearth.postsales.kyc.entity.KycApplicationStatus;
import com.goodearth.postsales.kyc.exception.KycValidationException;
import com.goodearth.postsales.kyc.repository.KycApplicationRepository;
import com.goodearth.postsales.kyc.service.KycService;
import com.goodearth.postsales.project.entity.Project;
import com.goodearth.postsales.project.repository.ProjectRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.entity.WorkflowStatus;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class CopyKycIntegrationTest {

    @Autowired
    private BuyerRepository buyerRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private WorkflowRepository workflowRepository;

    @Autowired
    private KycApplicationRepository kycApplicationRepository;

    @Autowired
    private KycService kycService;

    private Buyer buyer;
    private Workflow wfMotif;
    private Workflow wfOchre;
    private Workflow wfUmang;

    @BeforeEach
    void setUp() {
        kycApplicationRepository.deleteAll();
        workflowRepository.deleteAll();
        projectRepository.deleteAll();
        buyerRepository.deleteAll();

        buyer = new Buyer();
        buyer.setEmail("multi.property.buyer@goodearth.com");
        buyer.setFullName("Rohan Verma");
        buyer.setPhone("+919876543210");
        buyer.setUnitName("motif16");
        buyer.setZohoDealId("motif16");
        buyer.setZohoContactId("cnt_motif16");
        buyer = buyerRepository.save(buyer);

        // Project 1: Motif
        Project projMotif = new Project();
        projMotif.setProjectName("GoodEarth Motif");
        projMotif.setProjectCode("MOTIF");
        projMotif.setLocation("motif16");
        projMotif.setZohoDealId("motif16");
        projMotif = projectRepository.save(projMotif);

        wfMotif = new Workflow();
        wfMotif.setBuyer(buyer);
        wfMotif.setProject(projMotif);
        wfMotif.setStatus(WorkflowStatus.ACTIVE);
        wfMotif = workflowRepository.save(wfMotif);

        // Project 2: Ochre
        Project projOchre = new Project();
        projOchre.setProjectName("GoodEarth Ochre");
        projOchre.setProjectCode("OCHRE");
        projOchre.setLocation("ochre2122");
        projOchre.setZohoDealId("ochre2122");
        projOchre = projectRepository.save(projOchre);

        wfOchre = new Workflow();
        wfOchre.setBuyer(buyer);
        wfOchre.setProject(projOchre);
        wfOchre.setStatus(WorkflowStatus.ACTIVE);
        wfOchre = workflowRepository.save(wfOchre);

        // Project 3: Umang
        Project projUmang = new Project();
        projUmang.setProjectName("GoodEarth Umang");
        projUmang.setProjectCode("UMANG");
        projUmang.setLocation("uumang2");
        projUmang.setZohoDealId("uumang2");
        projUmang = projectRepository.save(projUmang);

        wfUmang = new Workflow();
        wfUmang.setBuyer(buyer);
        wfUmang.setProject(projUmang);
        wfUmang.setStatus(WorkflowStatus.ACTIVE);
        wfUmang = workflowRepository.save(wfUmang);
    }

    @Test
    void testCopyKycWorkflowAcrossProperties() {
        // Step 1: Complete Motif16 KYC
        ApplicantInfoSubmitRequestDto submitDto = new ApplicantInfoSubmitRequestDto();
        submitDto.setBookingId("motif16");
        submitDto.setApplicantTitle("Mr.");
        submitDto.setApplicantFirstName("Rohan");
        submitDto.setApplicantLastName("Verma");
        submitDto.setApplicantGender("Male");
        submitDto.setApplicantDob("1985-05-15");
        submitDto.setApplicantEmail(buyer.getEmail());
        submitDto.setApplicantPhone("+919876543210");
        submitDto.setApplicantPan("ABCDE1234F");
        submitDto.setApplicantAadhar("123456789012");
        submitDto.setAddressStreet("100 Indiranagar 12th Main");
        submitDto.setAddressCity("Bengaluru");
        submitDto.setAddressState("Karnataka");
        submitDto.setAddressPincode("560038");
        submitDto.setAddressCountry("India");

        KycApplicationResponseDto motifRes = kycService.submitApplicantInfo(submitDto, buyer.getEmail());
        assertNotNull(motifRes.getKycApplicationId());

        // Step 2: Check available copy sources for Ochre2122
        List<KycCopySourceDto> sourcesForOchre = kycService.getAvailableKycCopySources(wfOchre.getId(), buyer.getEmail());
        assertEquals(1, sourcesForOchre.size(), "Should find 1 completed KYC source (Motif16)");
        assertEquals(wfMotif.getId(), sourcesForOchre.get(0).getWorkflowId());

        // Step 3: Perform Copy from Motif16 to Ochre2122
        KycCopyRequestDto copyReq = KycCopyRequestDto.builder()
                .sourceWorkflowId(wfMotif.getId())
                .overwrite(true)
                .build();

        KycApplicationResponseDto ochreRes = kycService.copyKycFromSource(wfOchre.getId(), copyReq, buyer.getEmail());

        // Assert copied details
        assertNotNull(ochreRes.getKycApplicationId());
        assertNotEquals(motifRes.getKycApplicationId(), ochreRes.getKycApplicationId(), "Must maintain separate DB records");
        assertEquals("ochre2122", ochreRes.getBookingId(), "Target bookingId must remain ochre2122");
        assertNotNull(ochreRes.getPrimaryApplicant());
        assertEquals("Rohan Verma", ochreRes.getPrimaryApplicant().getFullName());
        assertEquals("ABCDE1234F", ochreRes.getPrimaryApplicant().getPanNumber());
        assertEquals("Bengaluru", ochreRes.getPrimaryApplicant().getAddress().getCity());

        // Step 4: Verify modifying Ochre2122 does NOT alter Motif16
        ApplicantInfoSubmitRequestDto editOchre = new ApplicantInfoSubmitRequestDto();
        editOchre.setBookingId("ochre2122");
        editOchre.setApplicantTitle("Mr.");
        editOchre.setApplicantFirstName("Rohan");
        editOchre.setApplicantLastName("Verma Updated");
        editOchre.setApplicantPan("XYZDE9999F");

        kycService.submitApplicantInfo(editOchre, buyer.getEmail());

        KycApplicationResponseDto freshMotif = kycService.getKycApplicationByBooking("motif16");
        assertEquals("Rohan Verma", freshMotif.getPrimaryApplicant().getFullName(), "Motif16 KYC must remain untouched");
        assertEquals("ABCDE1234F", freshMotif.getPrimaryApplicant().getPanNumber(), "Motif16 PAN must remain untouched");
    }

    @Test
    void testSecurityValidationCrossBuyerCopyingPrevented() {
        // Create another buyer
        Buyer otherBuyer = new Buyer();
        otherBuyer.setEmail("stranger.buyer@goodearth.com");
        otherBuyer.setFullName("Stranger Danger");
        otherBuyer.setZohoContactId("cnt_stranger");
        otherBuyer = buyerRepository.save(otherBuyer);

        Project strangerProj = new Project();
        strangerProj.setProjectName("GoodEarth Horizon");
        strangerProj.setProjectCode("HORIZON");
        strangerProj.setLocation("horizon99");
        strangerProj.setZohoDealId("horizon99");
        strangerProj = projectRepository.save(strangerProj);

        Workflow strangerWf = new Workflow();
        strangerWf.setBuyer(otherBuyer);
        strangerWf.setProject(strangerProj);
        strangerWf.setStatus(WorkflowStatus.ACTIVE);
        strangerWf = workflowRepository.save(strangerWf);

        KycCopyRequestDto req = KycCopyRequestDto.builder()
                .sourceWorkflowId(wfMotif.getId())
                .overwrite(true)
                .build();

        final UUID strangerWfId = strangerWf.getId();
        final String strangerEmail = otherBuyer.getEmail();

        // Stranger attempts to copy Rohan's Motif16 KYC into strangerWf
        assertThrows(KycValidationException.class, () -> {
            kycService.copyKycFromSource(strangerWfId, req, strangerEmail);
        }, "Security validation must prevent copying KYC across different buyers");
    }
}
