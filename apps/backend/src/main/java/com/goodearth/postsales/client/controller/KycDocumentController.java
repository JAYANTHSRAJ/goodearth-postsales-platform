package com.goodearth.postsales.client.controller;

import com.goodearth.postsales.client.dto.DocumentMetadataDto;
import com.goodearth.postsales.client.service.KycDocumentService;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.security.user.CustomUserDetails;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/kyc/documents")
public class KycDocumentController {

    private final KycDocumentService documentService;

    public KycDocumentController(KycDocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentMetadataDto>> uploadDocument(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam UUID workflowId,
            @RequestParam String applicantType,
            @RequestParam String documentType,
            @RequestParam("file") MultipartFile file) {
        if (user == null) {
            throw new CustomException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        DocumentMetadataDto metadata = documentService.uploadDocument(user.getId(), workflowId, applicantType, documentType, file);
        return ResponseEntity.ok(new ApiResponse<>(metadata));
    }

    @PutMapping(value = "/{id}/replace", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentMetadataDto>> replaceDocument(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        if (user == null) {
            throw new CustomException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        DocumentMetadataDto metadata = documentService.replaceDocument(user.getId(), id, file);
        return ResponseEntity.ok(new ApiResponse<>(metadata));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id) {
        if (user == null) {
            throw new CustomException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        Resource resource = documentService.downloadDocument(user.getId(), id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentMetadataDto>>> listDocuments(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam UUID workflowId) {
        if (user == null) {
            throw new CustomException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        List<DocumentMetadataDto> documents = documentService.listDocuments(user.getId(), workflowId);
        return ResponseEntity.ok(new ApiResponse<>(documents));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteDocument(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id) {
        if (user == null) {
            throw new CustomException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        documentService.softDeleteDocument(user.getId(), id);
        return ResponseEntity.ok(new ApiResponse<>("Document deleted successfully (soft-delete preserved in audit history)"));
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<ApiResponse<List<DocumentMetadataDto>>> getVersionHistory(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable UUID id) {
        if (user == null) {
            throw new CustomException("Authentication required", HttpStatus.UNAUTHORIZED);
        }
        List<DocumentMetadataDto> history = documentService.getVersionHistory(user.getId(), id);
        return ResponseEntity.ok(new ApiResponse<>(history));
    }
}
