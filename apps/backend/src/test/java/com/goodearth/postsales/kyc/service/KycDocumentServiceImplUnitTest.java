package com.goodearth.postsales.kyc.service;

import com.goodearth.postsales.document.dto.DocumentUploadResponseDto;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.entity.DocumentCategory;
import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.document.entity.DocumentVersion;
import com.goodearth.postsales.document.mapper.DocumentVersionMapper;
import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.document.repository.DocumentVersionRepository;
import com.goodearth.postsales.kyc.entity.ApplicantType;
import com.goodearth.postsales.kyc.entity.KycApplication;
import com.goodearth.postsales.kyc.entity.KycApplicationStatus;
import com.goodearth.postsales.kyc.repository.KycApplicantRepository;
import com.goodearth.postsales.kyc.repository.KycApplicationRepository;
import com.goodearth.postsales.workdrive.entity.WorkDriveFolder;
import com.goodearth.postsales.workdrive.service.WorkDriveFolderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class KycDocumentServiceImplUnitTest {

    @Mock
    private KycApplicationRepository kycApplicationRepository;
    @Mock
    private KycApplicantRepository kycApplicantRepository;
    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private DocumentVersionRepository documentVersionRepository;
    @Mock
    private DocumentVersionMapper documentVersionMapper;
    @Mock
    private KycAuditService auditService;
    @Mock
    private WorkDriveFolderService workDriveFolderService;
    @Mock
    private ZohoKycSyncService zohoKycSyncService;
    @Mock
    private com.goodearth.postsales.integration.zoho.ZohoApiClient zohoApiClient;

    @InjectMocks
    private KycDocumentServiceImpl kycDocumentService;

    private UUID appId;
    private KycApplication application;
    private WorkDriveFolder bookingFolder;

    @BeforeEach
    public void setUp() {
        appId = UUID.randomUUID();
        application = new KycApplication();
        application.setId(appId);
        application.setBookingId("BOOKING-101");
        application.setStatus(KycApplicationStatus.DRAFT);

        bookingFolder = new WorkDriveFolder();
        bookingFolder.setBookingId("BOOKING-101");
        bookingFolder.setKycSubfolderId("WD-KYC-101");
    }

    @Test
    public void testUploadKycDocument_Success() {
        when(kycApplicationRepository.findById(appId)).thenReturn(Optional.of(application));
        when(workDriveFolderService.getOrCreateBookingFolder("BOOKING-101")).thenReturn(bookingFolder);
        when(kycApplicantRepository.findByKycApplicationIdAndApplicantType(appId, ApplicantType.PRIMARY)).thenReturn(Optional.empty());

        when(documentRepository.findByKycApplicationIdAndDocumentTypeAndApplicantType(appId, DocumentType.AADHAAR_CARD, ApplicantType.PRIMARY))
                .thenReturn(Optional.empty());

        Document mockDoc = new Document();
        mockDoc.setId(UUID.randomUUID());
        mockDoc.setCategory(DocumentCategory.KYC);
        mockDoc.setDocumentType(DocumentType.AADHAAR_CARD);
        mockDoc.setApplicantType(ApplicantType.PRIMARY);

        when(documentRepository.save(any(Document.class))).thenReturn(mockDoc);
        when(documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(mockDoc.getId())).thenReturn(Collections.emptyList());

        DocumentVersion mockVersion = new DocumentVersion();
        mockVersion.setId(UUID.randomUUID());
        mockVersion.setVersionNumber(1);

        when(documentVersionRepository.saveAndFlush(any(DocumentVersion.class))).thenReturn(mockVersion);

        byte[] content = "dummy pdf bytes".getBytes();
        DocumentUploadResponseDto result = kycDocumentService.uploadKycDocument(
                appId,
                DocumentCategory.KYC,
                DocumentType.AADHAAR_CARD,
                ApplicantType.PRIMARY,
                "test.pdf",
                "application/pdf",
                content.length,
                content,
                "test-user"
        );

        assertNotNull(result);
        assertEquals(mockDoc.getId(), result.getDocumentId());
        verify(zohoKycSyncService, times(1)).syncDocumentToCrm(any(), any(), any(), any(), any(), eq("UPLOADED"));
    }
}
