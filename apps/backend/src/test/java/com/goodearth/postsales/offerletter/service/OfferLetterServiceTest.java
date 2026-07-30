package com.goodearth.postsales.offerletter.service;

import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import com.goodearth.postsales.kyc.dto.KycDocumentStreamDto;
import com.goodearth.postsales.kyc.service.ZohoKycSyncService;
import com.goodearth.postsales.notification.service.EmailService;
import com.goodearth.postsales.offerletter.dto.OfferLetterDto;
import com.goodearth.postsales.offerletter.dto.OfferLetterStatusDto;
import com.goodearth.postsales.offerletter.repository.OfferLetterAuditRepository;
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

    @Mock
    private OfferLetterAuditRepository auditRepository;

    @Mock
    private EmailService emailService;

    private OfferLetterServiceImpl offerLetterService;

    @BeforeEach
    void setUp() {
        offerLetterService = new OfferLetterServiceImpl(apiClient, properties, zohoKycSyncService, pdfGenerator, auditRepository, emailService);
    }

    @Test
    @DisplayName("getOfferLetterStatus returns generated=true when Deal exists")
    void testGetOfferLetterStatus_WhenDealExists() {
        String dealId = "CADENCE-A001";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn("6638590000147048029");
        when(auditRepository.findByBookingIdOrDealRecordId(eq(dealId), eq("6638590000147048029")))
                .thenReturn(java.util.Optional.of(com.goodearth.postsales.offerletter.entity.OfferLetterAudit.builder().sent(true).build()));

        OfferLetterStatusDto status = offerLetterService.getOfferLetterStatus(dealId);

        assertNotNull(status);
        assertTrue(status.isGenerated());
        assertNotNull(status.getFileUrl());
        assertTrue(status.getFileUrl().contains("CADENCE-A001"));
    }

    @Test
    @DisplayName("buildOfferLetterDto extracts CRM fields from Units module into OfferLetterDto")
    void testBuildOfferLetterDto() {
        String dealId = "CADENCE-A001";
        String targetRecordId = "6638590000147048029";
        String unitRecordId = "6638590000147099999";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(targetRecordId);
        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of(
                "id", targetRecordId,
                "Deal_Name", "CADENCE-A001",
                "Product_Name", Map.of("id", unitRecordId, "name", "CADENCE-A001"),
                "First_Applicant", "Nishtha Bhatia"
        );
        Map<String, Object> crmUnit = Map.of(
                "id", unitRecordId,
                "Project_Site", "Good Earth Cadence",
                "Product_Name", "CADENCE-A001",
                "Unit_Price", "40000000",
                "GST_at_5", "2000000",
                "Cost_of_Home_Inc_GST_A", "42000000"
        );

        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + targetRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Units/" + unitRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmUnit)));

        OfferLetterDto dto = offerLetterService.buildOfferLetterDto(dealId);

        assertNotNull(dto);
        assertEquals("CADENCE-A001", dto.getUnitName());
        assertEquals("Good Earth Cadence", dto.getProjectName());
        assertEquals("INR 4,00,00,000", dto.getCostOfUnitFormatted());
        assertEquals("INR 20,00,000", dto.getGstAmountFormatted());
        assertEquals("INR 4,20,00,000", dto.getCostOfHomeFormatted());
        assertFalse(dto.getMilestones().isEmpty());
    }

    @Test
    @DisplayName("Table 1 and Table 2 fetch directly from Zoho CRM Units module fields using field_labels.xlsx API names")
    void testBuildOfferLetterDto_WithUnitsModuleData() {
        String dealId = "CADENCE-A001";
        String targetRecordId = "6638590000147048029";
        String unitRecordId = "6638590000147099999";

        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(targetRecordId);
        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of(
                "id", targetRecordId,
                "Deal_Name", "CADENCE-A001",
                "Unit_Name", Map.of("id", unitRecordId, "name", "CADENCE-A001"),
                "First_Applicant", "John Doe"
        );

        Map<String, Object> crmUnit = Map.ofEntries(
                Map.entry("id", unitRecordId),
                Map.entry("Project_Site", "Good Earth Cadence"),
                Map.entry("Product_Name", "CADENCE-A001"),
                Map.entry("Carpet_Area", "150.00"),
                Map.entry("Built_up_Area", "225.00"),
                Map.entry("Exclusive_Common_Area_to_the_allottee", "110.00"),
                Map.entry("Exclusive_Common_Area_to_the_association", "70.00"),
                Map.entry("UDS_to_the_allotee", "45.00"),
                Map.entry("Total_UDS_A_B", "225.00"),
                Map.entry("Exclusive_Balcony_Verandah_use_areas2", "30.00"),
                Map.entry("Exclusive_open_terrace_use_areas_to_the_allotee2", "5.00"),
                Map.entry("Covered_Car_Parks", 2),
                Map.entry("Unit_Price", 40000000),
                Map.entry("GST_at_5", 2000000),
                Map.entry("Cost_of_Home_Inc_GST_A", 42000000),
                Map.entry("Maintenance_Deposit", 250000)
        );

        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + targetRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Units/" + unitRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmUnit)));

        OfferLetterDto dto = offerLetterService.buildOfferLetterDto(dealId);

        assertNotNull(dto);
        assertEquals("CADENCE-A001", dto.getUnitName());
        assertEquals("Good Earth Cadence", dto.getProjectName());
        assertEquals("150.00", dto.getCarpetAreaSqm());
        assertEquals("225.00", dto.getSuperBuiltUpAreaSqm());
        assertEquals("110.00", dto.getExclusiveCommonAreaSqm());
        assertEquals("70.00", dto.getAssociationCommonAreaSqm());
        assertEquals("45.00", dto.getUdsAllotteeSqm());
        assertEquals("225.00", dto.getTotalUdsSqm());
        assertEquals("30.00", dto.getExclusiveBalconySqm());
        assertEquals("5.00", dto.getOpenTerraceSqm());
        assertEquals("2", dto.getCoveredCarParks());

        assertEquals("INR 4,00,00,000", dto.getCostOfUnitFormatted());
        assertEquals("INR 20,00,000", dto.getGstAmountFormatted());
        assertEquals("INR 4,20,00,000", dto.getCostOfHomeFormatted());
        assertEquals("INR 2,50,000", dto.getMaintenanceDepositsFormatted());
    }

    @Test
    @DisplayName("Empty CRM Unit fields should remain empty without inserting sample values")
    void testBuildOfferLetterDto_WithEmptyCrmFields() {
        String dealId = "CADENCE-EMPTY";
        String targetRecordId = "6638590000147048030";
        String unitRecordId = "6638590000147099998";

        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(targetRecordId);
        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of(
                "id", targetRecordId,
                "Deal_Name", "CADENCE-EMPTY",
                "Product_Name", Map.of("id", unitRecordId, "name", "CADENCE-EMPTY")
        );
        Map<String, Object> crmUnit = Map.of("id", unitRecordId);

        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + targetRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Units/" + unitRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmUnit)));

        OfferLetterDto dto = offerLetterService.buildOfferLetterDto(dealId);

        assertNotNull(dto);
        assertEquals("", dto.getCarpetAreaSqm());
        assertEquals("", dto.getSuperBuiltUpAreaSqm());
        assertEquals("", dto.getExclusiveCommonAreaSqm());
        assertEquals("", dto.getAssociationCommonAreaSqm());
        assertEquals("", dto.getUdsAllotteeSqm());
        assertEquals("", dto.getTotalUdsSqm());
        assertEquals("", dto.getExclusiveBalconySqm());
        assertEquals("", dto.getOpenTerraceSqm());
        assertEquals("", dto.getCoveredCarParks());
        assertEquals("", dto.getCostOfUnitFormatted());
        assertEquals("", dto.getGstAmountFormatted());
        assertEquals("", dto.getCostOfHomeFormatted());
        assertEquals("", dto.getMaintenanceDepositsFormatted());
    }

    @Test
    @DisplayName("Offer Letter generation aborts with CustomException if linked Unit record cannot be retrieved")
    void testBuildOfferLetterDto_ThrowsExceptionWhenUnitRecordNotFound() {
        String dealId = "CADENCE-NO-UNIT";
        String targetRecordId = "6638590000147048031";

        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(targetRecordId);
        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of(
                "id", targetRecordId,
                "Deal_Name", "CADENCE-NO-UNIT"
        );

        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + targetRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));

        com.goodearth.postsales.common.exception.CustomException exception = assertThrows(
                com.goodearth.postsales.common.exception.CustomException.class,
                () -> offerLetterService.buildOfferLetterDto(dealId)
        );

        assertTrue(exception.getMessage().contains("Unable to retrieve linked Unit record from Zoho CRM"));
    }

    @Test
    @DisplayName("streamOfferLetterPdf delegates to pdfGenerator and returns stream DTO")
    void testStreamOfferLetterPdf() {
        String dealId = "CADENCE-A001";
        String targetRecordId = "6638590000147048029";
        String unitRecordId = "6638590000147099999";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(targetRecordId);
        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of(
                "id", targetRecordId,
                "Deal_Name", "CADENCE-A001",
                "Product_Name", Map.of("id", unitRecordId, "name", "CADENCE-A001")
        );
        Map<String, Object> crmUnit = Map.of("id", unitRecordId, "Product_Name", "CADENCE-A001");

        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + targetRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Units/" + unitRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmUnit)));

        byte[] fakePdfBytes = "%PDF-1.4 Fake PDF Content".getBytes();
        when(pdfGenerator.generatePdf(any(OfferLetterDto.class))).thenReturn(fakePdfBytes);

        KycDocumentStreamDto streamDto = offerLetterService.streamOfferLetterPdf(dealId, "ADMIN");

        assertNotNull(streamDto);
        assertEquals("Offer_Letter_CADENCE-A001.pdf", streamDto.getFileName());
        assertEquals("application/pdf", streamDto.getMimeType());
        assertArrayEquals(fakePdfBytes, streamDto.getContent());
    }

    @Test
    @DisplayName("streamOfferLetterPdf resolves 'motif16' Unit Name, fetches linked Unit, and generates PDF")
    void testStreamOfferLetterPdf_WithMotif16UnitName() {
        String identifier = "motif16";
        String targetRecordId = "6638590000147048099";
        String unitRecordId = "6638590000147099999";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(identifier)).thenReturn(targetRecordId);
        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of(
                "id", targetRecordId,
                "Deal_Name", "Deal - Motif 16",
                "Product_Name", Map.of("id", unitRecordId, "name", "motif16")
        );
        Map<String, Object> crmUnit = Map.of(
                "id", unitRecordId,
                "Product_Name", "motif16",
                "Project_Site", "Good Earth Motif"
        );

        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + targetRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Units/" + unitRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmUnit)));

        byte[] fakePdfBytes = "%PDF-1.4 Fake PDF Content for Motif 16".getBytes();
        when(pdfGenerator.generatePdf(any(OfferLetterDto.class))).thenReturn(fakePdfBytes);

        KycDocumentStreamDto streamDto = offerLetterService.streamOfferLetterPdf(identifier, "ADMIN");

        assertNotNull(streamDto);
        assertEquals("Offer_Letter_motif16.pdf", streamDto.getFileName());
        assertEquals("application/pdf", streamDto.getMimeType());
        assertArrayEquals(fakePdfBytes, streamDto.getContent());
    }

    @Test
    @DisplayName("CASE 1: 1 Applicant dynamically extracted and formatted")
    void testDynamicApplicants_1Applicant() {
        String dealId = "CADENCE-A001";
        String targetRecordId = "6638590000147048029";
        String unitRecordId = "6638590000147099999";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(targetRecordId);
        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of(
                "id", targetRecordId,
                "Product_Name", Map.of("id", unitRecordId, "name", "CADENCE-A001"),
                "Title_A", "Ms.",
                "First_Applicant", "Nishtha Bhatia"
        );
        Map<String, Object> crmUnit = Map.of("id", unitRecordId, "Product_Name", "CADENCE-A001");

        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + targetRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Units/" + unitRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmUnit)));

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
        String unitRecordId = "6638590000147099999";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(targetRecordId);
        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of(
                "id", targetRecordId,
                "Product_Name", Map.of("id", unitRecordId, "name", "CADENCE-A001"),
                "Title_A", "Ms.",
                "First_Applicant", "Nishtha Bhatia",
                "Title_C", "Mr.",
                "Second_Applicant", "Aman Uzuwaal"
        );
        Map<String, Object> crmUnit = Map.of("id", unitRecordId, "Product_Name", "CADENCE-A001");

        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + targetRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Units/" + unitRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmUnit)));

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
        String unitRecordId = "6638590000147099999";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(targetRecordId);
        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of(
                "id", targetRecordId,
                "Product_Name", Map.of("id", unitRecordId, "name", "CADENCE-A001"),
                "Title_A", "Ms.",
                "First_Applicant", "Nishtha Bhatia",
                "Title_C", "Mr.",
                "Second_Applicant", "Aman Uzuwaal",
                "Title_T", "Mr.",
                "Third_Applicant", "David Doe"
        );
        Map<String, Object> crmUnit = Map.of("id", unitRecordId, "Product_Name", "CADENCE-A001");

        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + targetRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Units/" + unitRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmUnit)));

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
        String unitRecordId = "6638590000147099999";
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
                "Product_Name", Map.of("id", unitRecordId, "name", "CADENCE-A001"),
                "Applicants", applicantsSubform
        );
        Map<String, Object> crmUnit = Map.of("id", unitRecordId, "Product_Name", "CADENCE-A001");

        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + targetRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Units/" + unitRecordId), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmUnit)));

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
