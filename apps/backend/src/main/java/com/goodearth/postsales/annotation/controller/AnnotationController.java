package com.goodearth.postsales.annotation.controller;

import com.goodearth.postsales.annotation.dto.AnnotationAttachmentDto;
import com.goodearth.postsales.annotation.dto.AnnotationCommentDto;
import com.goodearth.postsales.annotation.dto.AnnotationDetailDto;
import com.goodearth.postsales.annotation.service.AnnotationService;
import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.security.user.CustomUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class AnnotationController {

    private static final Logger log = LoggerFactory.getLogger(AnnotationController.class);

    private final AnnotationService service;

    public AnnotationController(AnnotationService service) {
        this.service = service;
    }

    private String getPrimaryRole(CustomUserDetails userDetails) {
        return userDetails.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .findFirst()
                .orElse("CLIENT");
    }

    @PostMapping("/annotations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'CLIENT')")
    public ResponseEntity<ApiResponse<AnnotationDetailDto>> createAnnotation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Object> request) {
        long startTime = System.currentTimeMillis();
        UUID workflowId = UUID.fromString((String) request.get("workflowId"));
        UUID documentId = UUID.fromString((String) request.get("documentId"));
        String workdriveFileId = (String) request.get("workdriveFileId");
        String annotationType = (String) request.get("annotationType");
        BigDecimal xCoordinate = new BigDecimal(request.get("xCoordinate").toString());
        BigDecimal yCoordinate = new BigDecimal(request.get("yCoordinate").toString());
        int pageNumber = request.get("pageNumber") != null ? Integer.parseInt(request.get("pageNumber").toString()) : 1;
        String color = (String) request.get("color");
        String title = (String) request.get("title");
        String description = (String) request.get("description");

        String role = getPrimaryRole(userDetails);
        AnnotationDetailDto response = service.createAnnotation(
                workflowId, documentId, workdriveFileId, userDetails.getId(), role,
                annotationType, xCoordinate, yCoordinate, pageNumber, color, title, description
        );
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/annotations, Execution Time: {}ms, User: {}, Annotation ID: {}",
                duration, userDetails.getUsername(), response.getAnnotation().getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PatchMapping("/annotations/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'CLIENT')")
    public ResponseEntity<ApiResponse<AnnotationDetailDto>> updateAnnotation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request) {
        long startTime = System.currentTimeMillis();
        String title = (String) request.get("title");
        String description = (String) request.get("description");
        BigDecimal xCoordinate = request.get("xCoordinate") != null ? new BigDecimal(request.get("xCoordinate").toString()) : null;
        BigDecimal yCoordinate = request.get("yCoordinate") != null ? new BigDecimal(request.get("yCoordinate").toString()) : null;
        int pageNumber = request.get("pageNumber") != null ? Integer.parseInt(request.get("pageNumber").toString()) : 0;
        String color = (String) request.get("color");

        AnnotationDetailDto response = service.updateAnnotation(id, title, description, xCoordinate, yCoordinate, pageNumber, color);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: PATCH /api/v1/annotations/{}, Execution Time: {}ms, User: {}",
                id, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @DeleteMapping("/annotations/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'CLIENT')")
    public ResponseEntity<ApiResponse<String>> deleteAnnotation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        service.deleteAnnotation(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: DELETE /api/v1/annotations/{}, Execution Time: {}ms, User: {}",
                id, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>("Annotation deleted successfully."));
    }

    @PostMapping("/annotations/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO')")
    public ResponseEntity<ApiResponse<AnnotationDetailDto>> approveAnnotation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request) {
        long startTime = System.currentTimeMillis();
        boolean spawnChangeRequest = request.get("spawnChangeRequest") != null 
                ? Boolean.parseBoolean(request.get("spawnChangeRequest").toString()) : false;
        String remarks = (String) request.get("remarks");

        AnnotationDetailDto response = service.approveAnnotation(id, userDetails.getId(), spawnChangeRequest, remarks);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/annotations/{}/approve, Execution Time: {}ms, User: {}",
                id, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/annotations/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO')")
    public ResponseEntity<ApiResponse<AnnotationDetailDto>> rejectAnnotation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        String remarks = request.get("remarks");

        AnnotationDetailDto response = service.rejectAnnotation(id, remarks);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/annotations/{}/reject, Execution Time: {}ms, User: {}",
                id, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/annotations/{id}/resolve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO')")
    public ResponseEntity<ApiResponse<AnnotationDetailDto>> resolveAnnotation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        String remarks = request.get("remarks");

        AnnotationDetailDto response = service.resolveAnnotation(id, remarks);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/annotations/{}/resolve, Execution Time: {}ms, User: {}",
                id, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/annotations/{id}/comments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'CLIENT')")
    public ResponseEntity<ApiResponse<AnnotationCommentDto>> addComment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        String comment = request.get("comment");
        String role = getPrimaryRole(userDetails);

        AnnotationCommentDto response = service.addComment(id, userDetails.getId(), role, comment);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/annotations/{}/comments, Execution Time: {}ms, User: {}",
                id, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/documents/{id}/annotations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'PROJECT_MANAGER', 'CLIENT')")
    public ResponseEntity<ApiResponse<List<AnnotationDetailDto>>> getDocumentAnnotations(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @RequestParam(required = false) String status) {
        long startTime = System.currentTimeMillis();
        List<AnnotationDetailDto> response = service.listAnnotationsByDocument(id, status);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/documents/{}/annotations, Execution Time: {}ms, User: {}",
                id, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/workflows/{id}/annotations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'PROJECT_MANAGER', 'CLIENT')")
    public ResponseEntity<ApiResponse<List<AnnotationDetailDto>>> getWorkflowAnnotations(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @RequestParam(required = false) String status) {
        long startTime = System.currentTimeMillis();
        List<AnnotationDetailDto> response = service.listAnnotationsByWorkflow(id, status);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/workflows/{}/annotations, Execution Time: {}ms, User: {}",
                id, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/annotations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<List<AnnotationDetailDto>>> getAllAnnotations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        long startTime = System.currentTimeMillis();
        List<AnnotationDetailDto> response = service.listAllAnnotations();
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/annotations, Execution Time: {}ms, User: {}",
                duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}
