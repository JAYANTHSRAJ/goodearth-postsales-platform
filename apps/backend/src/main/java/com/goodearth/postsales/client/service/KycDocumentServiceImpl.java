package com.goodearth.postsales.client.service;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.client.dto.DocumentMetadataDto;
import com.goodearth.postsales.client.entity.DocumentVersion;
import com.goodearth.postsales.client.entity.KycApplication;
import com.goodearth.postsales.client.repository.DocumentVersionRepository;
import com.goodearth.postsales.client.repository.KycApplicationRepository;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class KycDocumentServiceImpl implements KycDocumentService {

    private static final Logger log = LoggerFactory.getLogger(KycDocumentServiceImpl.class);

    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png"
    );

    private final DocumentVersionRepository versionRepository;
    private final KycApplicationRepository kycRepository;
    private final WorkflowRepository workflowRepository;
    private final UserRepository userRepository;
    private final VirusScannerService virusScannerService;
    private final Path fileStorageLocation;

    public KycDocumentServiceImpl(
            DocumentVersionRepository versionRepository,
            KycApplicationRepository kycRepository,
            WorkflowRepository workflowRepository,
            UserRepository userRepository,
            VirusScannerService virusScannerService,
            @Value("${app.upload.dir:uploads/kyc}") String uploadDir) {
        this.versionRepository = versionRepository;
        this.kycRepository = kycRepository;
        this.workflowRepository = workflowRepository;
        this.userRepository = userRepository;
        this.virusScannerService = virusScannerService;

        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new CustomException("Could not create storage directory for uploaded files", HttpStatus.INTERNAL_SERVER_ERROR, ex);
        }
    }

    @Override
    @Transactional
    public DocumentMetadataDto uploadDocument(UUID userId, UUID workflowId, String applicantType, String documentType, MultipartFile file) {
        validateFile(file, documentType);

        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new CustomException("Workflow not found", HttpStatus.NOT_FOUND));

        KycApplication kyc = kycRepository.findByWorkflowId(workflowId).orElse(null);

        // Sanitize Applicant & Document Types
        String sanitizedAppType = sanitizeType(applicantType, "PRIMARY");
        String sanitizedDocType = sanitizeType(documentType, "ADDRESS_PROOF");

        // Versioning Strategy: Determine next version
        List<DocumentVersion> existingVersions = versionRepository
                .findByKycApplicationIdAndApplicantTypeAndDocumentTypeOrderByVersionDesc(
                        kyc != null ? kyc.getId() : null, sanitizedAppType, sanitizedDocType);

        int nextVersion = existingVersions.isEmpty() ? 1 : existingVersions.get(0).getVersion() + 1;

        // Standardized File Naming Standard
        String ext = getFileExtension(file.getOriginalFilename());
        String storedFilename = String.format("%s_%s_v%d_%s.%s",
                sanitizedAppType, sanitizedDocType, nextVersion, UUID.randomUUID().toString().substring(0, 8), ext);

        Path targetLocation = storePhysicalFile(workflowId, file, storedFilename);

        DocumentVersion version = new DocumentVersion();
        version.setKycApplication(kyc);
        version.setApplicantType(sanitizedAppType);
        version.setDocumentType(sanitizedDocType);
        version.setVersion(nextVersion);
        version.setFileName(file.getOriginalFilename());
        version.setFilePath(targetLocation.toString());
        version.setMimeType(file.getContentType());
        version.setFileSize(file.getSize());
        version.setDeleted(false);

        DocumentVersion saved = versionRepository.save(version);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public DocumentMetadataDto replaceDocument(UUID userId, UUID documentId, MultipartFile file) {
        DocumentVersion existing = versionRepository.findById(documentId)
                .orElseThrow(() -> new CustomException("Document not found", HttpStatus.NOT_FOUND));

        return uploadDocument(
                userId,
                existing.getKycApplication() != null && existing.getKycApplication().getWorkflow() != null
                        ? existing.getKycApplication().getWorkflow().getId()
                        : UUID.randomUUID(),
                existing.getApplicantType(),
                existing.getDocumentType(),
                file
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Resource downloadDocument(UUID userId, UUID documentId) {
        DocumentVersion version = versionRepository.findById(documentId)
                .orElseThrow(() -> new CustomException("Document not found", HttpStatus.NOT_FOUND));

        if (version.isDeleted()) {
            throw new CustomException("Document has been deleted", HttpStatus.GONE);
        }

        try {
            Path filePath = Paths.get(version.getFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new CustomException("File not found on storage disk", HttpStatus.NOT_FOUND);
            }
        } catch (MalformedURLException ex) {
            throw new CustomException("Invalid file path format", HttpStatus.BAD_REQUEST, ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentMetadataDto> listDocuments(UUID userId, UUID workflowId) {
        KycApplication kyc = kycRepository.findByWorkflowId(workflowId).orElse(null);
        if (kyc == null) return Collections.emptyList();

        List<DocumentVersion> versions = versionRepository.findByKycApplicationId(kyc.getId());
        return versions.stream()
                .filter(v -> !v.isDeleted())
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void softDeleteDocument(UUID userId, UUID documentId) {
        DocumentVersion version = versionRepository.findById(documentId)
                .orElseThrow(() -> new CustomException("Document not found", HttpStatus.NOT_FOUND));

        version.setDeleted(true);
        versionRepository.save(version);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentMetadataDto> getVersionHistory(UUID userId, UUID documentId) {
        DocumentVersion existing = versionRepository.findById(documentId)
                .orElseThrow(() -> new CustomException("Document not found", HttpStatus.NOT_FOUND));

        List<DocumentVersion> history = versionRepository.findByKycApplicationIdAndApplicantTypeAndDocumentTypeOrderByVersionDesc(
                existing.getKycApplication() != null ? existing.getKycApplication().getId() : null,
                existing.getApplicantType(),
                existing.getDocumentType()
        );

        return history.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private void validateFile(MultipartFile file, String documentType) {
        if (file == null || file.isEmpty()) {
            throw new CustomException("Uploaded file cannot be empty", HttpStatus.BAD_REQUEST);
        }

        // Path Traversal Security Protection
        String filename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new CustomException("Filename contains invalid path sequence: " + filename, HttpStatus.BAD_REQUEST);
        }

        // MIME Type Security Validation
        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            throw new CustomException("Invalid file format. Allowed formats: PDF, JPG, PNG", HttpStatus.BAD_REQUEST);
        }

        // File Size Security Validation (2MB for Aadhaar/Voter ID, 5MB for PAN/Address Proof)
        long maxSizeBytes = ("AADHAAR".equalsIgnoreCase(documentType) || "VOTER_ID".equalsIgnoreCase(documentType))
                ? 2 * 1024 * 1024
                : 5 * 1024 * 1024;

        if (file.getSize() > maxSizeBytes) {
            throw new CustomException("File size exceeds maximum allowed limit (" + (maxSizeBytes / (1024 * 1024)) + "MB)", HttpStatus.BAD_REQUEST);
        }

        // Virus Scanning Integration Check
        if (!virusScannerService.scanFile(file)) {
            throw new CustomException("File failed security virus scanning check", HttpStatus.BAD_REQUEST);
        }
    }

    private Path storePhysicalFile(UUID workflowId, MultipartFile file, String storedFilename) {
        try {
            Path workflowStorageDir = this.fileStorageLocation.resolve(workflowId.toString()).normalize();
            Files.createDirectories(workflowStorageDir);

            Path targetLocation = workflowStorageDir.resolve(storedFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return targetLocation;
        } catch (IOException ex) {
            throw new CustomException("Could not store file on server storage location", HttpStatus.INTERNAL_SERVER_ERROR, ex);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "pdf";
        int lastDot = filename.lastIndexOf('.');
        return (lastDot == -1) ? "pdf" : filename.substring(lastDot + 1);
    }

    private String sanitizeType(String input, String fallback) {
        if (input == null || input.trim().isEmpty()) return fallback;
        return input.trim().toUpperCase().replaceAll("[^A_Z0-9_]", "_");
    }

    private DocumentMetadataDto mapToDto(DocumentVersion v) {
        DocumentMetadataDto dto = new DocumentMetadataDto();
        dto.setId(v.getId());
        dto.setApplicantType(v.getApplicantType());
        dto.setDocumentType(v.getDocumentType());
        dto.setFileName(v.getFileName());
        dto.setFilePath(v.getFilePath());
        dto.setVersion(v.getVersion());
        dto.setMimeType(v.getMimeType());
        if (v.getFileSize() != null) {
            dto.setSizeBytes(v.getFileSize());
        }
        return dto;
    }
}
