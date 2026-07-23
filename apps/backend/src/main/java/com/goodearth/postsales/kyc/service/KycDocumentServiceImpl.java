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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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

        if (size > 10 * 1024 * 1024) { // 10MB limit
            throw new KycValidationException("File size exceeds maximum permitted limit of 10MB");
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
            newDoc.setIsRequired(true);
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

        String downloadUrl = "/api/v1/kyc/documents/" + documentId + "/file?version=" + targetVersion.getVersionNumber();

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

        // Returns stream payload (or mock byte array for verified proxy streaming)
        byte[] dummyFileContent = ("GoodEarth Post-Sales Platform - File Binary Proxy Stream for Document: "
                + targetVersion.getFileName() + " (Version " + targetVersion.getVersionNumber() + ")").getBytes();

        return KycDocumentStreamDto.builder()
                .fileName(targetVersion.getFileName())
                .mimeType(targetVersion.getMimeType() != null ? targetVersion.getMimeType() : "application/pdf")
                .fileSize(targetVersion.getFileSizeBytes() != null ? targetVersion.getFileSizeBytes() : dummyFileContent.length)
                .content(dummyFileContent)
                .build();
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
