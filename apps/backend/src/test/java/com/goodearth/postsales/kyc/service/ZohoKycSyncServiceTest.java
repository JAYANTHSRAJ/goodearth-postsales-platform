package com.goodearth.postsales.kyc.service;

import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.document.repository.DocumentVersionRepository;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import com.goodearth.postsales.kyc.repository.KycApplicationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.net.URI;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ZohoKycSyncServiceTest {

    @Mock
    private ZohoApiClient apiClient;

    @Mock
    private ZohoProperties properties;

    @Mock
    private KycAuditService auditService;

    @Mock
    private KycApplicationRepository kycApplicationRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentVersionRepository documentVersionRepository;

    private ZohoKycSyncServiceImpl zohoKycSyncService;

    @BeforeEach
    void setUp() {
        zohoKycSyncService = new ZohoKycSyncServiceImpl(
                apiClient,
                properties,
                auditService,
                kycApplicationRepository,
                documentRepository,
                documentVersionRepository
        );
    }

    @Test
    @DisplayName("Identifier Type 1: Numeric Zoho Deal ID passes through directly without external search")
    void testResolveDealRecordId_NumericDealId() {
        String numericDealId = "6638590000147048029";

        String resolvedId = zohoKycSyncService.resolveDealRecordIdByDealName(numericDealId);

        assertEquals("6638590000147048029", resolvedId);
    }

    @Test
    @DisplayName("Identifier Type 2: Deal Name resolves via Deal_Name search criteria")
    void testResolveDealRecordId_DealName() {
        String dealName = "Cadence-Plot-101";
        String expectedRecordId = "6638590000147048029";

        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of(
                "id", expectedRecordId,
                "Deal_Name", dealName
        );
        when(apiClient.get(any(URI.class), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));

        String resolvedId = zohoKycSyncService.resolveDealRecordIdByDealName(dealName);

        assertEquals(expectedRecordId, resolvedId);
    }

    @Test
    @DisplayName("Identifier Type 3: Booking ID resolves via Booking_ID search criteria")
    void testResolveDealRecordId_BookingId() {
        String bookingId = "BKG-2026-001";
        String expectedRecordId = "6638590000147048055";

        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of(
                "id", expectedRecordId,
                "Deal_Name", "Good Earth Deal 55",
                "Booking_ID", bookingId
        );
        when(apiClient.get(any(URI.class), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));

        String resolvedId = zohoKycSyncService.resolveDealRecordIdByDealName(bookingId);

        assertEquals(expectedRecordId, resolvedId);
    }

    @Test
    @DisplayName("Identifier Type 4: Unit Name (motif16) resolves via Product_Name lookup search criteria")
    void testResolveDealRecordId_UnitName_Motif16() {
        String unitName = "motif16";
        String expectedRecordId = "6638590000147048099";

        when(properties.getCrmApiUrl()).thenReturn("https://crmsandbox.zoho.in/crm/v2");

        Map<String, Object> crmDeal = Map.of(
                "id", expectedRecordId,
                "Deal_Name", "Customer Deal 99",
                "Product_Name", Map.of("id", "6638590000147099999", "name", "motif16")
        );
        when(apiClient.get(any(URI.class), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(crmDeal)));

        String resolvedId = zohoKycSyncService.resolveDealRecordIdByDealName(unitName);

        assertEquals(expectedRecordId, resolvedId);
    }
}
