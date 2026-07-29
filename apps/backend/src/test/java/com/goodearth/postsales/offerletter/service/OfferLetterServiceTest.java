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
}
