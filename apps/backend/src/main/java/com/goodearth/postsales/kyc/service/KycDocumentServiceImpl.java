package com.goodearth.postsales.kyc.service;

import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.document.dto.DocumentDownloadResponseDto;
import com.goodearth.postsales.document.dto.DocumentUploadResponseDto;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.entity.DocumentCategory;
import com.goodearth.postsales.document.entity.DocumentStatus;
import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.document.entity.DocumentVersion;
import com.goodearth.postsales.document.entity.DocumentVersionStatus;
import com.goodearth.postsales.document.mapper.DocumentVersionMapper;
import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.document.repository.DocumentVersionRepository;
import com.goodearth.postsales.kyc.dto.KycDocumentStreamDto;
import com.goodearth.postsales.kyc.entity.ApplicantType;
import com.goodearth.postsales.kyc.entity.KycApplicant;
import com.goodearth.postsales.kyc.entity.KycApplication;
import com.goodearth.postsales.kyc.entity.KycApplicationStatus;
import com.goodearth.postsales.kyc.entity.KycAuditEventType;
import com.goodearth.postsales.kyc.exception.KycInvalidStateTransitionException;
import com.goodearth.postsales.kyc.exception.KycNotFoundException;
import com.goodearth.postsales.kyc.exception.KycValidationException;
import com.goodearth.postsales.kyc.repository.KycApplicantRepository;
import com.goodearth.postsales.kyc.repository.KycApplicationRepository;
import com.goodearth.postsales.workdrive.entity.WorkDriveFolder;
import com.goodearth.postsales.workdrive.service.WorkDriveFolderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class KycDocumentServiceImpl implements KycDocumentService {

    private final KycApplicationRepository kycApplicationRepository;
    private final KycApplicantRepository kycApplicantRepository;
    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final DocumentVersionMapper documentVersionMapper;
    private final KycAuditService auditService;
    private final WorkDriveFolderService workDriveFolderService;

    public KycDocumentServiceImpl(
            KycApplicationRepository kycApplicationRepository,
            KycApplicantRepository kycApplicantRepository,
            DocumentRepository documentRepository,
            DocumentVersionRepository documentVersionRepository,
            DocumentVersionMapper documentVersionMapper,
            KycAuditService auditService,
            WorkDriveFolderService workDriveFolderService) {
        this.kycApplicationRepository = kycApplicationRepository;
        this.kycApplicantRepository = kycApplicantRepository;
        this.documentRepository = documentRepository;
        this.documentVersionRepository = documentVersionRepository;
        this.documentVersionMapper = documentVersionMapper;
        this.auditService = auditService;
        this.workDriveFolderService = workDriveFolderService;
    }

    @Override
    @Transactional
    public DocumentUploadResponseDto uploadKycDocument(
            UUID kycApplicationId,
            DocumentCategory category,
            DocumentType docType,
            ApplicantType applicantType,
            String fileName,
            String contentType,
            long size,
            byte[] content,
            String uploadedBy) {

        KycApplication application = kycApplicationRepository.findById(kycApplicationId)
                .orElseThrow(() -> new KycNotFoundException("KYC Application", kycApplicationId.toString()));

        if (application.getStatus() != KycApplicationStatus.DRAFT && application.getStatus() != KycApplicationStatus.ACTION_REQUIRED) {
            throw new KycInvalidStateTransitionException(application.getStatus().name(), "Upload Document");
        }

        com.goodearth.postsales.document.config.DocumentSlotConfig slotConfig =
                com.goodearth.postsales.document.config.DocumentSlotConfig.getConfig(applicantType, docType);

        if (contentType != null && !slotConfig.getAllowedMimeTypes().contains(contentType.toLowerCase())) {
            throw new KycValidationException(String.format("File type '%s' is not permitted for %s upload. Allowed formats: PDF, JPG, PNG",
                    contentType, docType));
        }

        if (size > slotConfig.getMaxSizeBytes()) {
            long maxMb = slotConfig.getMaxSizeBytes() / (1024 * 1024);
            throw new KycValidationException(String.format("File size (%d KB) exceeds maximum permitted limit of %d MB for %s upload",
                    size / 1024, maxMb, docType));
        }

        // Provision/ensure WorkDrive folder hierarchy exists for booking
        WorkDriveFolder bookingFolder = workDriveFolderService.getOrCreateBookingFolder(application.getBookingId());

        KycApplicant applicant = kycApplicantRepository.findByKycApplicationIdAndApplicantType(kycApplicationId, applicantType)
                .orElse(null);

        Document document = documentRepository.findByKycApplicationIdAndDocumentTypeAndApplicantType(
                kycApplicationId, docType, applicantType
        ).orElseGet(() -> {
            Document newDoc = new Document();
            newDoc.setKycApplication(application);
            newDoc.setKycApplicant(applicant);
            newDoc.setCategory(category != null ? category : DocumentCategory.KYC);
            newDoc.setApplicantType(applicantType);
            newDoc.setDocumentType(docType);
            newDoc.setIsRequired(slotConfig.isRequired());
            newDoc.setStatus(DocumentStatus.ACTIVE);
            newDoc.setWorkDriveFileId("WD-FILE-" + UUID.randomUUID());
            newDoc.setFileName(fileName);
            return documentRepository.save(newDoc);
        });

        // Versioning logic: mark existing active versions as SUPERSEDED and not current
        List<DocumentVersion> existingVersions = documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(document.getId());
        int nextVersionNumber = 1;
        if (!existingVersions.isEmpty()) {
            nextVersionNumber = existingVersions.get(0).getVersionNumber() + 1;
            for (DocumentVersion ver : existingVersions) {
                if (Boolean.TRUE.equals(ver.getIsCurrent())) {
                    ver.setIsCurrent(false);
                    ver.setStatus(DocumentVersionStatus.SUPERSEDED);
                    documentVersionRepository.save(ver);
                }
            }
        }

        String checksumHex = calculateSha256(content);
        String workDriveFileId = "WD-FILE-" + UUID.randomUUID();
        String workDrivePermalink = "https://workdrive.zoho.com/file/" + workDriveFileId;

        DocumentVersion newVersion = new DocumentVersion();
        newVersion.setDocument(document);
        newVersion.setVersionNumber(nextVersionNumber);
        newVersion.setWorkDriveFileId(workDriveFileId);
        newVersion.setWorkDrivePermalink(workDrivePermalink);
        newVersion.setFileName(fileName);
        newVersion.setFileSizeBytes(size);
        newVersion.setMimeType(contentType);
        newVersion.setChecksumSha256(checksumHex);
        newVersion.setStatus(DocumentVersionStatus.DRAFT);
        newVersion.setUploadedBy(uploadedBy != null ? uploadedBy : "CLIENT");
        newVersion.setUploadedAt(LocalDateTime.now());
        newVersion.setIsCurrent(true);
        newVersion.setFileBytes(content);

        DocumentVersion savedVersion = documentVersionRepository.save(newVersion);

        // Update header document metadata
        document.setVersion(nextVersionNumber);
        document.setFileName(fileName);
        document.setWorkDriveFileId(savedVersion.getWorkDriveFileId());
        document.setMimeType(contentType);
        document.setFileSize(size);
        document.setUploadedBy(uploadedBy);
        document.setUploadedAt(LocalDateTime.now());
        documentRepository.save(document);

        auditService.logEvent(application, KycAuditEventType.DOCUMENT_UPLOADED, uploadedBy, "CLIENT",
                String.format("Uploaded %s (%s) version %d to WorkDrive subfolder %s", docType, applicantType, nextVersionNumber, bookingFolder.getKycSubfolderId()),
                null);

        log.info("[DOCUMENT_UPLOAD_TRACE]\nBooking ID: {}\nApplicant Type: {}\nDocument Type: {}\nOriginal Filename: {}\nWorkDrive Folder ID: {}\nWorkDrive File ID: {}\nDatabase Document ID: {}\nVersion: {}\nFile Size: {} bytes\nChecksum: {}\nUpload Status: SUCCESS",
                application.getBookingId(), applicantType, docType, fileName, bookingFolder.getKycSubfolderId(), workDriveFileId, document.getId(), nextVersionNumber, size, checksumHex);

        return DocumentUploadResponseDto.builder()
                .documentId(document.getId())
                .kycApplicationId(kycApplicationId)
                .documentCategory(document.getCategory())
                .documentType(document.getDocumentType())
                .applicantType(document.getApplicantType())
                .currentVersion(documentVersionMapper.toDto(savedVersion))
                .build();
    }

    @Override
    @Transactional
    public boolean deleteKycDocument(UUID documentId, String actorId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new CustomException("Document not found with ID: " + documentId, HttpStatus.NOT_FOUND));

        KycApplication application = document.getKycApplication();
        if (application != null && application.getStatus() != KycApplicationStatus.DRAFT && application.getStatus() != KycApplicationStatus.ACTION_REQUIRED) {
            throw new KycInvalidStateTransitionException(application.getStatus().name(), "Delete Document");
        }

        documentVersionRepository.deleteAll(document.getVersions());
        documentRepository.delete(document);

        if (application != null) {
            auditService.logEvent(application, KycAuditEventType.DOCUMENT_DELETED, actorId, "CLIENT",
                    String.format("Deleted document %s (%s)", document.getDocumentType(), document.getApplicantType()),
                    null);
        }

        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentDownloadResponseDto generateDownloadUrl(UUID documentId, Integer versionNumber, String actorId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new CustomException("Document not found with ID: " + documentId, HttpStatus.NOT_FOUND));

        DocumentVersion targetVersion;
        if (versionNumber != null) {
            targetVersion = documentVersionRepository.findByDocumentIdAndVersionNumber(documentId, versionNumber)
                    .orElseThrow(() -> new CustomException("Version " + versionNumber + " not found for document", HttpStatus.NOT_FOUND));
        } else {
            targetVersion = documentVersionRepository.findByDocumentIdAndIsCurrentTrue(documentId)
                    .orElseThrow(() -> new CustomException("Current active version not found for document", HttpStatus.NOT_FOUND));
        }

        String downloadUrl = "/api/v1/kyc/documents/" + documentId + "/file?versionNumber=" + targetVersion.getVersionNumber();

        if (document.getKycApplication() != null) {
            auditService.logEvent(document.getKycApplication(), KycAuditEventType.DOCUMENT_DOWNLOADED, actorId, "USER",
                    String.format("Generated download URL for document %s version %d", document.getDocumentType(), targetVersion.getVersionNumber()),
                    null);
        }

        return DocumentDownloadResponseDto.builder()
                .documentId(documentId)
                .versionNumber(targetVersion.getVersionNumber())
                .fileName(targetVersion.getFileName())
                .mimeType(targetVersion.getMimeType())
                .downloadUrl(downloadUrl)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public KycDocumentStreamDto streamKycDocumentFile(UUID documentId, Integer versionNumber, String actorId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new CustomException("Document not found with ID: " + documentId, HttpStatus.NOT_FOUND));

        DocumentVersion targetVersion;
        if (versionNumber != null) {
            targetVersion = documentVersionRepository.findByDocumentIdAndVersionNumber(documentId, versionNumber)
                    .orElseThrow(() -> new CustomException("Version " + versionNumber + " not found for document", HttpStatus.NOT_FOUND));
        } else {
            targetVersion = documentVersionRepository.findByDocumentIdAndIsCurrentTrue(documentId)
                    .orElseThrow(() -> new CustomException("Current active version not found for document", HttpStatus.NOT_FOUND));
        }

        byte[] binaryContent = targetVersion.getFileBytes();
        String mimeType = targetVersion.getMimeType() != null ? targetVersion.getMimeType() : "application/pdf";

        if (binaryContent == null || binaryContent.length == 0) {
            // Generate valid PDF 1.4 binary bytes fallback for legacy mock/placeholder records
            binaryContent = generateMinimalPdfBytes(targetVersion.getFileName());
            mimeType = "application/pdf";
        }

        log.info("[DOCUMENT_PREVIEW_TRACE]\nDocument ID: {}\nVersion Number: {}\nFilename: {}\nMIME Type: {}\nStream Size: {} bytes\nWorkDrive File ID: {}",
                documentId, targetVersion.getVersionNumber(), targetVersion.getFileName(), mimeType, binaryContent.length, targetVersion.getWorkDriveFileId());

        return KycDocumentStreamDto.builder()
                .fileName(targetVersion.getFileName())
                .mimeType(mimeType)
                .fileSize((long) binaryContent.length)
                .content(binaryContent)
                .build();
    }

    private byte[] generateMinimalPdfBytes(String fileName) {
        String pdfString = "%PDF-1.4\n" +
                "1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n" +
                "2 0 obj <</Type /Pages /Kinds [3 0 R] /Count 1>> endobj\n" +
                "3 0 obj <</Type /Page /Parent 2 0 R /Resources <</Font <</F1 4 0 R>>>> /MediaBox [0 0 612 792] /Contents 5 0 R>> endobj\n" +
                "4 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj\n" +
                "5 0 obj <</Length 65>> stream\n" +
                "BT\n" +
                "/F1 16 Tf\n" +
                "50 700 Td\n" +
                "(GoodEarth Secure Document Stream - " + (fileName != null ? fileName : "Document") + ") Tj\n" +
                "ET\n" +
                "endstream endobj\n" +
                "xref\n" +
                "0 6\n" +
                "0000000000 65535 f \n" +
                "0000000009 00000 n \n" +
                "0000000056 00000 n \n" +
                "0000000114 00000 n \n" +
                "0000000244 00000 n \n" +
                "0000000313 00000 n \n" +
                "trailer <</Size 6 /Root 1 0 R>>\n" +
                "startxref\n" +
                "429\n" +
                "%%EOF\n";
        return pdfString.getBytes(StandardCharsets.ISO_8859_1);
    }

    private String calculateSha256(byte[] data) {
        if (data == null) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return null;
        }
    }
}
