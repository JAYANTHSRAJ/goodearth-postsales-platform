package com.goodearth.postsales.kyc.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.document.dto.DocumentDownloadResponseDto;
import com.goodearth.postsales.document.dto.DocumentUploadResponseDto;
import com.goodearth.postsales.document.entity.DocumentCategory;
import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.kyc.dto.KycDocumentStreamDto;
import com.goodearth.postsales.kyc.entity.ApplicantType;
import com.goodearth.postsales.kyc.service.KycDocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/kyc/documents", "/kyc/documents"})
@Tag(name = "KYC Document Operations", description = "APIs for multipart document uploads, versioned downloads, and draft file deletions")
public class KycDocumentController {

    private static final Logger log = LoggerFactory.getLogger(KycDocumentController.class);

    private final KycDocumentService kycDocumentService;

    public KycDocumentController(KycDocumentService kycDocumentService) {
        this.kycDocumentService = kycDocumentService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Upload document file for a KYC slot", description = "Uploads file binary, increments version, provisions WorkDrive folder, and updates active document slot")
    public ResponseEntity<ApiResponse<DocumentUploadResponseDto>> uploadDocument(
            @RequestParam("kycApplicationId") UUID kycApplicationId,
            @RequestParam("documentCategory") DocumentCategory documentCategory,
            @RequestParam("documentType") DocumentType documentType,
            @RequestParam("applicantType") ApplicantType applicantType,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {

        long startTime = System.currentTimeMillis();
        String uploadedBy = authentication != null ? authentication.getName() : "CLIENT";

        DocumentUploadResponseDto response = kycDocumentService.uploadKycDocument(
                kycApplicationId,
                documentCategory,
                documentType,
                applicantType,
                file.getOriginalFilename(),
                file.getContentType(),
                file.getSize(),
                file.getBytes(),
                uploadedBy
        );

        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: POST /api/v1/kyc/documents/upload, Execution Time: {}ms, Document ID: {}", duration, response.getDocumentId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @DeleteMapping("/{documentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Soft-delete a draft uploaded file", description = "Deletes draft uploaded document version when KYC is in DRAFT state")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteDocument(
            @PathVariable UUID documentId,
            Authentication authentication) {

        long startTime = System.currentTimeMillis();
        String actorId = authentication != null ? authentication.getName() : "CLIENT";

        boolean deleted = kycDocumentService.deleteKycDocument(documentId, actorId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: DELETE /api/v1/kyc/documents/{}, Execution Time: {}ms", documentId, duration);

        Map<String, Object> result = new HashMap<>();
        result.put("documentId", documentId);
        result.put("deleted", deleted);
        result.put("message", "Draft document version successfully deleted.");

        return ResponseEntity.ok(new ApiResponse<>(result));
    }

    @GetMapping("/{documentId}/download")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Get short-lived secure download URL", description = "Generates temporary signed download URL for current or specified document version")
    public ResponseEntity<ApiResponse<DocumentDownloadResponseDto>> downloadDocument(
            @PathVariable UUID documentId,
            @RequestParam(required = false) Integer versionNumber,
            Authentication authentication) {

        long startTime = System.currentTimeMillis();
        String actorId = authentication != null ? authentication.getName() : "CLIENT";

        DocumentDownloadResponseDto response = kycDocumentService.generateDownloadUrl(documentId, versionNumber, actorId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: GET /api/v1/kyc/documents/{}/download, Execution Time: {}ms, Version: {}", documentId, duration, versionNumber);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/{documentId}/file")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    @Operation(summary = "Stream document file binary directly", description = "Streams document file content from WorkDrive without exposing raw WorkDrive file links")
    public ResponseEntity<byte[]> streamFile(
            @PathVariable UUID documentId,
            @RequestParam(required = false) Integer versionNumber,
            Authentication authentication) {

        long startTime = System.currentTimeMillis();
        String actorId = authentication != null ? authentication.getName() : "CLIENT";

        KycDocumentStreamDto streamDto = kycDocumentService.streamKycDocumentFile(documentId, versionNumber, actorId);
        long duration = System.currentTimeMillis() - startTime;
        log.info("Endpoint: GET /api/v1/kyc/documents/{}/file, Execution Time: {}ms, File: {}", documentId, duration, streamDto.getFileName());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + streamDto.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(streamDto.getMimeType()))
                .contentLength(streamDto.getFileSize())
                .body(streamDto.getContent());
    }
}
