package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.dto.DocumentMetadataDto;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface KycDocumentService {

    /**
     * Upload a new KYC document proof.
     */
    DocumentMetadataDto uploadDocument(UUID userId, UUID workflowId, String applicantType, String documentType, MultipartFile file);

    /**
     * Upload a replacement file creating an incremental version (v1 -> v2 -> v3). Never overwrites history.
     */
    DocumentMetadataDto replaceDocument(UUID userId, UUID documentId, MultipartFile file);

    /**
     * Securely stream file resource for download with authorization check.
     */
    Resource downloadDocument(UUID userId, UUID documentId);

    /**
     * List all active uploaded documents for a workflow.
     */
    List<DocumentMetadataDto> listDocuments(UUID userId, UUID workflowId);

    /**
     * Soft delete document record (preserves audit history and physical file).
     */
    void softDeleteDocument(UUID userId, UUID documentId);

    /**
     * Get complete version history for a document.
     */
    List<DocumentMetadataDto> getVersionHistory(UUID userId, UUID documentId);
}
