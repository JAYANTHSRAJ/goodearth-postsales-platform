package com.goodearth.postsales.kyc.service;

import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.entity.DocumentStatus;
import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.document.entity.DocumentVersion;
import com.goodearth.postsales.document.entity.DocumentVersionStatus;
import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.document.repository.DocumentVersionRepository;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import com.goodearth.postsales.kyc.entity.ApplicantType;
import com.goodearth.postsales.kyc.entity.KycApplication;
import com.goodearth.postsales.kyc.entity.KycApplicationStatus;
import com.goodearth.postsales.kyc.repository.KycApplicationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.util.MultiValueMap;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ZohoAttachmentSyncUnitTest {

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

    private ZohoKycSyncServiceImpl syncService;

    @BeforeEach
    void setUp() {
        syncService = new ZohoKycSyncServiceImpl(
                apiClient,
                properties,
                auditService,
                kycApplicationRepository,
                documentRepository,
                documentVersionRepository
        );
        when(properties.getCrmApiUrl()).thenReturn("https://www.zohoapis.com/crm/v2");
    }

    @Test
    @DisplayName("Verify attachment sync replaces previous CRM attachment for PAN v1 -> PAN v2")
    void testPanV1AndV2AttachmentSync_ReplacesPreviousCrmAttachment() {
        // Arrange
        String bookingId = "4854105000001234567";
        String dealRecordId = "4854105000001234567";

        KycApplication application = new KycApplication();
        application.setId(UUID.randomUUID());
        application.setBookingId(bookingId);
        application.setStatus(KycApplicationStatus.DRAFT);
        application.setZohoDealRecordId(dealRecordId);

        Document document = new Document();
        document.setId(UUID.randomUUID());
        document.setKycApplication(application);
        document.setApplicantType(ApplicantType.PRIMARY);
        document.setDocumentType(DocumentType.PAN_CARD);
        document.setStatus(DocumentStatus.ACTIVE);
        document.setVersions(new ArrayList<>());

        // --- Upload PAN v1 ---
        DocumentVersion version1 = new DocumentVersion();
        version1.setId(UUID.randomUUID());
        version1.setDocument(document);
        version1.setVersionNumber(1);
        version1.setFileName("pan_v1.pdf");
        version1.setMimeType("application/pdf");
        version1.setWorkDriveFileId("WD-FILE-V1");
        version1.setIsCurrent(true);
        version1.setStatus(DocumentVersionStatus.DRAFT);
        document.getVersions().add(version1);

        // Mock Zoho Attachment List API (empty initially)
        when(apiClient.get(eq("https://www.zohoapis.com/crm/v2/Deals/" + dealRecordId + "/Attachments"), eq(Map.class)))
                .thenReturn(Map.of("data", List.of()));

        // Mock Zoho Attachment Upload API response for v1
        Map<String, Object> uploadResponseV1 = Map.of(
                "data", List.of(
                        Map.of(
                                "code", "SUCCESS",
                                "details", Map.of("id", "ATT-PAN-V1", "file_name", "PRIMARY_PAN_CARD_v1_pan_v1.pdf")
                        )
                )
        );
        when(apiClient.postMultipart(eq("https://www.zohoapis.com/crm/v2/Deals/" + dealRecordId + "/Attachments"), any(MultiValueMap.class), eq(Map.class)))
                .thenReturn(uploadResponseV1);

        when(documentVersionRepository.save(any(DocumentVersion.class))).thenAnswer(i -> i.getArgument(0));
        when(documentRepository.save(any(Document.class))).thenAnswer(i -> i.getArgument(0));

        // Act 1: Sync PAN v1
        byte[] v1Content = "PAN v1 binary content".getBytes();
        boolean v1Synced = syncService.syncAttachmentToCrm(application, document, version1, "pan_v1.pdf", "application/pdf", v1Content);

        // Assert 1: PAN v1 synced to CRM successfully
        assertTrue(v1Synced);
        assertEquals("ATT-PAN-V1", version1.getCrmAttachmentId());
        assertEquals("SUCCESS", version1.getCrmAttachmentSyncStatus());
        assertEquals("ATT-PAN-V1", document.getCrmAttachmentId());

        // --- Upload PAN v2 ---
        version1.setIsCurrent(false);
        version1.setStatus(DocumentVersionStatus.SUPERSEDED);

        DocumentVersion version2 = new DocumentVersion();
        version2.setId(UUID.randomUUID());
        version2.setDocument(document);
        version2.setVersionNumber(2);
        version2.setFileName("pan_v2.pdf");
        version2.setMimeType("application/pdf");
        version2.setWorkDriveFileId("WD-FILE-V2");
        version2.setIsCurrent(true);
        version2.setStatus(DocumentVersionStatus.DRAFT);
        document.getVersions().add(version2);

        // Mock Zoho Attachment List API (contains ATT-PAN-V1)
        when(apiClient.get(eq("https://www.zohoapis.com/crm/v2/Deals/" + dealRecordId + "/Attachments"), eq(Map.class)))
                .thenReturn(Map.of("data", List.of(
                        Map.of("id", "ATT-PAN-V1", "File_Name", "PRIMARY_PAN_CARD_v1_pan_v1.pdf")
                )));

        // Mock Zoho Attachment Delete API
        doNothing().when(apiClient).delete("https://www.zohoapis.com/crm/v2/Deals/" + dealRecordId + "/Attachments/ATT-PAN-V1");

        // Mock Zoho Attachment Upload API response for v2
        Map<String, Object> uploadResponseV2 = Map.of(
                "data", List.of(
                        Map.of(
                                "code", "SUCCESS",
                                "details", Map.of("id", "ATT-PAN-V2", "file_name", "PRIMARY_PAN_CARD_v2_pan_v2.pdf")
                        )
                )
        );
        when(apiClient.postMultipart(eq("https://www.zohoapis.com/crm/v2/Deals/" + dealRecordId + "/Attachments"), any(MultiValueMap.class), eq(Map.class)))
                .thenReturn(uploadResponseV2);

        // Act 2: Sync PAN v2
        byte[] v2Content = "PAN v2 binary content".getBytes();
        boolean v2Synced = syncService.syncAttachmentToCrm(application, document, version2, "pan_v2.pdf", "application/pdf", v2Content);

        // Assert 2: PAN v2 replaces PAN v1 in CRM
        assertTrue(v2Synced);
        verify(apiClient, atLeastOnce()).delete("https://www.zohoapis.com/crm/v2/Deals/" + dealRecordId + "/Attachments/ATT-PAN-V1");
        assertEquals("ATT-PAN-V2", version2.getCrmAttachmentId());
        assertEquals("SUCCESS", version2.getCrmAttachmentSyncStatus());
        assertEquals("ATT-PAN-V2", document.getCrmAttachmentId());

        // Verify Requirement 11 checklist:
        // ✓ PostgreSQL contains both versions (v1 & v2 in document.getVersions())
        assertEquals(2, document.getVersions().size());
        assertEquals("WD-FILE-V1", document.getVersions().get(0).getWorkDriveFileId());
        assertEquals("WD-FILE-V2", document.getVersions().get(1).getWorkDriveFileId());

        // ✓ WorkDrive metadata retained for both
        assertFalse(document.getVersions().get(0).getIsCurrent());
        assertTrue(document.getVersions().get(1).getIsCurrent());

        // ✓ Zoho CRM Deal updated to latest attachment ATT-PAN-V2
        assertEquals("ATT-PAN-V2", document.getCrmAttachmentId());
    }
}
