package com.goodearth.postsales.projectupdate.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.projectupdate.dto.ProjectProgressDto;
import com.goodearth.postsales.projectupdate.dto.ProjectUpdateDto;
import com.goodearth.postsales.projectupdate.dto.ProjectUpdateMediaDto;
import com.goodearth.postsales.projectupdate.dto.ProjectUpdateSummaryDto;
import com.goodearth.postsales.projectupdate.service.ProjectUpdateService;
import com.goodearth.postsales.security.user.CustomUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/project-updates")
public class ProjectUpdateController {

    private static final Logger log = LoggerFactory.getLogger(ProjectUpdateController.class);

    private final ProjectUpdateService service;

    public ProjectUpdateController(ProjectUpdateService service) {
        this.service = service;
    }

    private boolean isClientRole(CustomUserDetails userDetails) {
        return userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_CLIENT"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<ProjectUpdateDto>> createUpdate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Object> request) {
        long startTime = System.currentTimeMillis();
        UUID workflowId = UUID.fromString((String) request.get("workflowId"));
        UUID stageId = UUID.fromString((String) request.get("stageId"));
        String title = (String) request.get("title");
        String description = (String) request.get("description");
        String updateType = (String) request.get("updateType");
        BigDecimal progressPercentage = request.get("progressPercentage") != null 
                ? new BigDecimal(request.get("progressPercentage").toString()) : BigDecimal.ZERO;
        String location = (String) request.get("location");

        ProjectUpdateDto response = service.createUpdate(workflowId, stageId, title, description, updateType, progressPercentage, location);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/project-updates, Execution Time: {}ms, User: {}, Update ID: {}",
                duration, userDetails.getUsername(), response.getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<ProjectUpdateDto>> editUpdate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request) {
        long startTime = System.currentTimeMillis();
        String title = (String) request.get("title");
        String description = (String) request.get("description");
        String updateType = (String) request.get("updateType");
        BigDecimal progressPercentage = request.get("progressPercentage") != null 
                ? new BigDecimal(request.get("progressPercentage").toString()) : BigDecimal.ZERO;
        String location = (String) request.get("location");

        ProjectUpdateDto response = service.editUpdate(id, title, description, updateType, progressPercentage, location);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: PATCH /api/v1/project-updates/{}, Execution Time: {}ms, User: {}",
                id, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteUpdate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        service.deleteUpdate(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: DELETE /api/v1/project-updates/{}, Execution Time: {}ms, User: {}",
                id, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>("Project update deleted successfully."));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<ProjectUpdateDto>> publishUpdate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        ProjectUpdateDto response = service.publishUpdate(id, userDetails.getUsername());
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/project-updates/{}/publish, Execution Time: {}ms, User: {}",
                id, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/{id}/hide")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<ProjectUpdateDto>> hideUpdate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        ProjectUpdateDto response = service.hideUpdate(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/project-updates/{}/hide, Execution Time: {}ms, User: {}",
                id, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/{workflowId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'PROJECT_MANAGER', 'CLIENT')")
    public ResponseEntity<ApiResponse<List<ProjectUpdateSummaryDto>>> getWorkflowUpdates(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID workflowId) {
        long startTime = System.currentTimeMillis();
        boolean clientOnly = isClientRole(userDetails);
        
        List<ProjectUpdateSummaryDto> response = service.listWorkflowUpdates(workflowId, clientOnly);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/project-updates/{}, Execution Time: {}ms, User: {}",
                workflowId, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/latest")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'PROJECT_MANAGER', 'CLIENT')")
    public ResponseEntity<ApiResponse<List<ProjectUpdateSummaryDto>>> getLatestUpdates(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "5") int limit) {
        long startTime = System.currentTimeMillis();
        List<ProjectUpdateSummaryDto> response = service.listLatestUpdates(limit);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/project-updates/latest, Execution Time: {}ms, User: {}",
                duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/detail/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'PROJECT_MANAGER', 'CLIENT')")
    public ResponseEntity<ApiResponse<ProjectUpdateSummaryDto>> getUpdateDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        ProjectUpdateSummaryDto response = service.getUpdateDetail(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/project-updates/detail/{}, Execution Time: {}ms, User: {}",
                id, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/{id}/media")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<ProjectUpdateMediaDto>> uploadMedia(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        String workdriveFileId = request.get("workdriveFileId");
        String mediaType = request.get("mediaType");

        ProjectUpdateMediaDto response = service.uploadMediaMetadata(id, workdriveFileId, mediaType, userDetails.getUsername());
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/project-updates/{}/media, Execution Time: {}ms, User: {}",
                id, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/{id}/media")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'PROJECT_MANAGER', 'CLIENT')")
    public ResponseEntity<ApiResponse<List<ProjectUpdateMediaDto>>> getUpdateMedia(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        List<ProjectUpdateMediaDto> response = service.getUpdateMedia(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/project-updates/{}/media, Execution Time: {}ms, User: {}",
                id, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/progress/{workflowId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'PROJECT_MANAGER', 'CLIENT')")
    public ResponseEntity<ApiResponse<ProjectProgressDto>> getProgress(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID workflowId) {
        long startTime = System.currentTimeMillis();
        ProjectProgressDto response = service.calculateProgress(workflowId);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/project-updates/progress/{}, Execution Time: {}ms, User: {}",
                workflowId, duration, userDetails.getUsername());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}
