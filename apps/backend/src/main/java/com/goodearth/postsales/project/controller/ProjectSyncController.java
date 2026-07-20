package com.goodearth.postsales.project.controller;

import com.goodearth.postsales.project.dto.ProjectDto;
import com.goodearth.postsales.project.dto.ProjectSyncResponse;
import com.goodearth.postsales.project.service.ProjectService;
import com.goodearth.postsales.project.service.ZohoProjectSyncService;
import com.goodearth.postsales.common.response.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
public class ProjectSyncController {

    private static final Logger log = LoggerFactory.getLogger(ProjectSyncController.class);

    private final com.goodearth.postsales.buyer.service.ZohoBuyerSyncService syncService;
    private final ProjectService projectService;

    public ProjectSyncController(com.goodearth.postsales.buyer.service.ZohoBuyerSyncService syncService, ProjectService projectService) {
        this.syncService = syncService;
        this.projectService = projectService;
    }

    @PostMapping("/sync")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> syncProjects() {
        long startTime = System.currentTimeMillis();
        java.util.Map<String, Object> response = syncService.syncBuyers();
        long duration = System.currentTimeMillis() - startTime;

        java.util.Map<String, Object> summary = (java.util.Map<String, Object>) response.get("summary");
        if (summary != null) {
            log.info("Endpoint: POST /api/v1/projects/sync, Execution Time: {}ms, Fetched: {}, Buyers Created: {}, Buyers Updated: {}, Buyers Skipped: {}, Projects Created: {}, Projects Updated: {}, Workflows Created: {}, Workflows Updated: {}",
                    duration, summary.get("dealsFetched"), summary.get("buyersCreated"), summary.get("buyersUpdated"), summary.get("buyersSkipped"), summary.get("projectsCreated"), summary.get("projectsUpdated"), summary.get("workflowsCreated"), summary.get("workflowsUpdated"));
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<List<ProjectDto>>> getAllProjects() {
        long startTime = System.currentTimeMillis();
        List<ProjectDto> response = projectService.getAllProjects();
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/projects, Execution Time: {}ms, Size: {}",
                duration, response.size());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto>> getProjectById(@PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        ProjectDto response = projectService.getProjectById(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/projects/{}, Execution Time: {}ms", id, duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<ProjectDto>> createProject(@RequestBody ProjectDto dto) {
        long startTime = System.currentTimeMillis();
        ProjectDto response = projectService.createProject(dto);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/projects, Execution Time: {}ms, Created ID: {}", duration, response.getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<ProjectDto>> updateProject(@PathVariable UUID id, @RequestBody ProjectDto dto) {
        long startTime = System.currentTimeMillis();
        ProjectDto response = projectService.updateProject(id, dto);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: PUT /api/v1/projects/{}, Execution Time: {}ms", id, duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<String>> deleteProject(@PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        projectService.deleteProject(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: DELETE /api/v1/projects/{}, Execution Time: {}ms", id, duration);

        return ResponseEntity.ok(new ApiResponse<>("Project deleted successfully."));
    }
}
