package com.goodearth.postsales.document.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.document.dto.DocumentDto;
import com.goodearth.postsales.document.entity.DocumentStatus;
import com.goodearth.postsales.document.service.DocumentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1", ""})
public class DocumentController {

    private static final Logger log = LoggerFactory.getLogger(DocumentController.class);

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping("/documents")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<DocumentDto>> createDocument(@RequestBody DocumentDto requestDto) {
        long startTime = System.currentTimeMillis();
        DocumentDto response = documentService.createDocument(requestDto);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/documents, Execution Time: {}ms, Document ID: {}, Workflow ID: {}",
                duration, response.getId(), response.getWorkflowId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/documents")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<List<DocumentDto>>> listDocuments() {
        long startTime = System.currentTimeMillis();
        List<DocumentDto> response = documentService.listDocuments();
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/documents, Execution Time: {}ms, Document ID: N/A, Workflow ID: N/A", duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/documents/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    public ResponseEntity<ApiResponse<DocumentDto>> getDocument(@PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        DocumentDto response = documentService.getDocument(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/documents/{}, Execution Time: {}ms, Document ID: {}, Workflow ID: {}",
                id, duration, response.getId(), response.getWorkflowId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/workflows/{workflowId}/documents")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    public ResponseEntity<ApiResponse<List<DocumentDto>>> getDocumentsByWorkflow(@PathVariable UUID workflowId) {
        long startTime = System.currentTimeMillis();
        List<DocumentDto> response = documentService.getDocumentsByWorkflow(workflowId);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/workflows/{}/documents, Execution Time: {}ms, Document ID: N/A, Workflow ID: {}",
                workflowId, duration, workflowId);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PatchMapping("/documents/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<DocumentDto>> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        DocumentStatus status = DocumentStatus.valueOf(request.get("status").toUpperCase());
        
        DocumentDto response = documentService.updateStatus(id, status);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: PATCH /api/v1/documents/{}/status, Execution Time: {}ms, Document ID: {}, Workflow ID: {}",
                id, duration, response.getId(), response.getWorkflowId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}
