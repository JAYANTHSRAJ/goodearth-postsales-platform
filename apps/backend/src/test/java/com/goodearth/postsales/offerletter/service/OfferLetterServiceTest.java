package com.goodearth.postsales.offerletter.service;

import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import com.goodearth.postsales.kyc.dto.KycDocumentStreamDto;
import com.goodearth.postsales.kyc.service.ZohoKycSyncService;
import com.goodearth.postsales.offerletter.dto.OfferLetterDto;
import com.goodearth.postsales.offerletter.dto.OfferLetterStatusDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class OfferLetterServiceTest {

    @Mock
    private ZohoApiClient apiClient;

    @Mock
    private ZohoProperties properties;

    @Mock
    private ZohoKycSyncService zohoKycSyncService;

    @Mock
    private OfferLetterPdfGenerator pdfGenerator;

    private OfferLetterServiceImpl offerLetterService;

    @BeforeEach
    void setUp() {
        offerLetterService = new OfferLetterServiceImpl(apiClient, properties, zohoKycSyncService, pdfGenerator);
    }

    @Test
    @DisplayName("getOfferLetterStatus returns generated=true when Deal exists")
    void testGetOfferLetterStatus_WhenDealExists() {
        String dealId = "CADENCE-A001";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn("6638590000147048029");

        OfferLetterStatusDto status = offerLetterService.getOfferLetterStatus(dealId);

        assertNotNull(status);
        assertTrue(status.isGenerated());
        assertNotNull(status.getFileUrl());
        assertTrue(status.getFileUrl().contains("CADENCE-A001"));
    }

    @Test
    @DisplayName("buildOfferLetterDto extracts CRM fields into OfferLetterDto")
    void testBuildOfferLetterDto() {
        String dealId = "CADENCE-A001";
        String targetRecordId = "6638590000147048029";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(targetRecordId);
        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of(
                "id", targetRecordId,
                "Deal_Name", "CADENCE-A001",
                "Project_Name", "Good Earth Cadence",
                "Unit_Name", "CADENCE-A001",
                "First_Applicant", "Nishtha Bhatia",
                "Cost_of_unit", "37619048",
                "GST_Amount", "1880952",
                "Cost_of_home", "39500000"
        );
        Map<String, Object> crmResponse = Map.of("data", List.of(crmDeal));

        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + targetRecordId), eq(Map.class)))
                .thenReturn(crmResponse);

        OfferLetterDto dto = offerLetterService.buildOfferLetterDto(dealId);

        assertNotNull(dto);
        assertEquals("CADENCE-A001", dto.getUnitName());
        assertEquals("Good Earth Cadence", dto.getProjectName());
        assertEquals("INR 3,76,19,048", dto.getCostOfUnitFormatted());
        assertEquals("INR 18,80,952", dto.getGstAmountFormatted());
        assertEquals("INR 3,95,00,000", dto.getCostOfHomeFormatted());
        assertFalse(dto.getMilestones().isEmpty());
    }

    @Test
    @DisplayName("streamOfferLetterPdf delegates to pdfGenerator and returns stream DTO")
    void testStreamOfferLetterPdf() {
        String dealId = "CADENCE-A001";
        String targetRecordId = "6638590000147048029";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(targetRecordId);
        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of("id", targetRecordId, "Deal_Name", "CADENCE-A001");
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + targetRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));

        byte[] fakePdfBytes = "%PDF-1.4 Fake PDF Content".getBytes();
        when(pdfGenerator.generatePdf(any(OfferLetterDto.class))).thenReturn(fakePdfBytes);

        KycDocumentStreamDto streamDto = offerLetterService.streamOfferLetterPdf(dealId, "ADMIN");

        assertNotNull(streamDto);
        assertEquals("Offer_Letter_CADENCE-A001.pdf", streamDto.getFileName());
        assertEquals("application/pdf", streamDto.getMimeType());
        assertArrayEquals(fakePdfBytes, streamDto.getContent());
    }

    @Test
    @DisplayName("CASE 1: 1 Applicant dynamically extracted and formatted")
    void testDynamicApplicants_1Applicant() {
        String dealId = "CADENCE-A001";
        String targetRecordId = "6638590000147048029";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(targetRecordId);
        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of(
                "id", targetRecordId,
                "Title_A", "Ms.",
                "First_Applicant", "Nishtha Bhatia"
        );
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + targetRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));

        OfferLetterDto dto = offerLetterService.buildOfferLetterDto(dealId);

        assertNotNull(dto);
        assertEquals(1, dto.getApplicants().size());
        assertEquals("Ms. Nishtha Bhatia", dto.getApplicants().get(0).getFormattedNameWithSalutation());
        assertEquals("First applicant", dto.getApplicants().get(0).getLabel());
        assertEquals("Primary Applicant", dto.getApplicants().get(0).getSignatureLabel());
    }

    @Test
    @DisplayName("CASE 2: 2 Applicants dynamically extracted and formatted")
    void testDynamicApplicants_2Applicants() {
        String dealId = "CADENCE-A001";
        String targetRecordId = "6638590000147048029";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(targetRecordId);
        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of(
                "id", targetRecordId,
                "Title_A", "Ms.",
                "First_Applicant", "Nishtha Bhatia",
                "Title_C", "Mr.",
                "Second_Applicant", "Aman Uzuwaal"
        );
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + targetRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));

        OfferLetterDto dto = offerLetterService.buildOfferLetterDto(dealId);

        assertNotNull(dto);
        assertEquals(2, dto.getApplicants().size());
        assertEquals("Ms. Nishtha Bhatia", dto.getApplicants().get(0).getFormattedNameWithSalutation());
        assertEquals("Mr. Aman Uzuwaal", dto.getApplicants().get(1).getFormattedNameWithSalutation());
        assertEquals("Second applicant", dto.getApplicants().get(1).getLabel());
        assertEquals("Co Applicant", dto.getApplicants().get(1).getSignatureLabel());
    }

    @Test
    @DisplayName("CASE 3: 3 Applicants dynamically extracted and formatted")
    void testDynamicApplicants_3Applicants() {
        String dealId = "CADENCE-A001";
        String targetRecordId = "6638590000147048029";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(targetRecordId);
        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of(
                "id", targetRecordId,
                "Title_A", "Ms.",
                "First_Applicant", "Nishtha Bhatia",
                "Title_C", "Mr.",
                "Second_Applicant", "Aman Uzuwaal",
                "Title_T", "Mr.",
                "Third_Applicant", "David Doe"
        );
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + targetRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));

        OfferLetterDto dto = offerLetterService.buildOfferLetterDto(dealId);

        assertNotNull(dto);
        assertEquals(3, dto.getApplicants().size());
        assertEquals("Ms. Nishtha Bhatia", dto.getApplicants().get(0).getFormattedNameWithSalutation());
        assertEquals("Mr. Aman Uzuwaal", dto.getApplicants().get(1).getFormattedNameWithSalutation());
        assertEquals("Mr. David Doe", dto.getApplicants().get(2).getFormattedNameWithSalutation());
        assertEquals("Third applicant", dto.getApplicants().get(2).getLabel());
        assertEquals("Third Applicant", dto.getApplicants().get(2).getSignatureLabel());
    }

    @Test
    @DisplayName("CASE 4: 4 Applicants via subform dynamically extracted without code changes")
    void testDynamicApplicants_4Applicants_FutureSupport() {
        String dealId = "CADENCE-A001";
        String targetRecordId = "6638590000147048029";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(targetRecordId);
        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        List<Map<String, Object>> applicantsSubform = List.of(
                Map.of("Salutation", "Ms.", "Full_Name", "Nishtha Bhatia", "Role", "PRIMARY"),
                Map.of("Salutation", "Mr.", "Full_Name", "Aman Uzuwaal", "Role", "CO_APPLICANT"),
                Map.of("Salutation", "Mr.", "Full_Name", "David Doe", "Role", "THIRD_APPLICANT"),
                Map.of("Salutation", "Mrs.", "Full_Name", "Sarah Smith", "Role", "FOURTH_APPLICANT")
        );

        Map<String, Object> crmDeal = Map.of(
                "id", targetRecordId,
                "Applicants", applicantsSubform
        );
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + targetRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));

        OfferLetterDto dto = offerLetterService.buildOfferLetterDto(dealId);

        assertNotNull(dto);
        assertEquals(4, dto.getApplicants().size());
        assertEquals("Ms. Nishtha Bhatia", dto.getApplicants().get(0).getFormattedNameWithSalutation());
        assertEquals("Mr. Aman Uzuwaal", dto.getApplicants().get(1).getFormattedNameWithSalutation());
        assertEquals("Mr. David Doe", dto.getApplicants().get(2).getFormattedNameWithSalutation());
        assertEquals("Mrs. Sarah Smith", dto.getApplicants().get(3).getFormattedNameWithSalutation());
        assertEquals("Fourth applicant", dto.getApplicants().get(3).getLabel());
        assertEquals("Fourth Applicant", dto.getApplicants().get(3).getSignatureLabel());
    }
}
