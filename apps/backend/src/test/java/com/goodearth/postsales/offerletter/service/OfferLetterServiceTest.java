package com.goodearth.postsales.offerletter.service;

import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import com.goodearth.postsales.kyc.dto.KycDocumentStreamDto;
import com.goodearth.postsales.kyc.service.ZohoKycSyncService;
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

    private OfferLetterServiceImpl offerLetterService;

    @BeforeEach
    void setUp() {
        offerLetterService = new OfferLetterServiceImpl(apiClient, properties, zohoKycSyncService);
        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");
    }

    @Test
    @DisplayName("getOfferLetterStatus returns generated=false when Generate_Milestone is false")
    void testGetOfferLetterStatus_WhenGenerateMilestoneIsFalse() {
        String dealId = "6638590000147048029";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(dealId);

        Map<String, Object> crmResponse = Map.of(
                "data", List.of(
                        Map.of("id", dealId, "Generate_Milestone", false)
                )
        );
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + dealId + "?fields=Generate_Milestone,Deal_Name"), eq(Map.class)))
                .thenReturn(crmResponse);

        OfferLetterStatusDto status = offerLetterService.getOfferLetterStatus(dealId);

        assertNotNull(status);
        assertFalse(status.isGenerated());
        assertEquals("Offer Letter has not been generated yet.", status.getMessage());
    }

    @Test
    @DisplayName("getOfferLetterStatus returns generated=true when Generate_Milestone is true")
    void testGetOfferLetterStatus_WhenGenerateMilestoneIsTrue() {
        String dealId = "6638590000147048029";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(dealId);

        Map<String, Object> crmResponse = Map.of(
                "data", List.of(
                        Map.of("id", dealId, "Generate_Milestone", true)
                )
        );
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + dealId + "?fields=Generate_Milestone,Deal_Name"), eq(Map.class)))
                .thenReturn(crmResponse);

        OfferLetterStatusDto status = offerLetterService.getOfferLetterStatus(dealId);

        assertNotNull(status);
        assertTrue(status.isGenerated());
        assertNotNull(status.getFileUrl());
        assertTrue(status.getFileUrl().contains(dealId));
    }

    @Test
    @DisplayName("streamOfferLetterPdf throws CustomException when Generate_Milestone is false")
    void testStreamOfferLetterPdf_ThrowsExceptionWhenNotGenerated() {
        String dealId = "6638590000147048029";
        when(zohoKycSyncService.resolveDealRecordIdByDealName(dealId)).thenReturn(dealId);

        Map<String, Object> crmResponse = Map.of(
                "data", List.of(
                        Map.of("id", dealId, "Generate_Milestone", false)
                )
        );
        when(apiClient.get(eq("https://crmsandbox.zoho.in/crm/v2/Deals/" + dealId + "?fields=Generate_Milestone,Deal_Name"), eq(Map.class)))
                .thenReturn(crmResponse);

        CustomException ex = assertThrows(CustomException.class, () ->
                offerLetterService.streamOfferLetterPdf(dealId, "ADMIN")
        );
        assertTrue(ex.getMessage().contains("Offer Letter has not been generated yet."));
    }
}
