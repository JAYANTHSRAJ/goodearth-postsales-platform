package com.goodearth.postsales.workflow.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.workflow.dto.WorkflowDto;
import com.goodearth.postsales.workflow.entity.WorkflowStatus;
import com.goodearth.postsales.workflow.service.WorkflowService;
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
@RequestMapping({"/api/v1/workflows", "/workflows"})
public class WorkflowController {

    private static final Logger log = LoggerFactory.getLogger(WorkflowController.class);

    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowDto>> createWorkflow(@RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        UUID buyerId = UUID.fromString(request.get("buyerId"));
        UUID projectId = UUID.fromString(request.get("projectId"));
        
        WorkflowDto response = workflowService.createWorkflow(buyerId, projectId);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/workflows, Execution Time: {}ms, Workflow ID: {}, Status: Created",
                duration, response.getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<WorkflowDto>> getWorkflow(@PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        WorkflowDto response = workflowService.getWorkflow(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/workflows/{}, Execution Time: {}ms, Workflow ID: {}",
                id, duration, response.getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<List<WorkflowDto>>> getAllWorkflows() {
        long startTime = System.currentTimeMillis();
        List<WorkflowDto> response = workflowService.getAllWorkflows();
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/workflows, Execution Time: {}ms, Fetched Count: {}",
                duration, response.size());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowDto>> updateWorkflowStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        WorkflowStatus status = WorkflowStatus.valueOf(request.get("status").toUpperCase());
        
        WorkflowDto response = workflowService.updateWorkflowStatus(id, status);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: PATCH /api/v1/workflows/{}/status, Execution Time: {}ms, Workflow ID: {}, Status Change: {}",
                id, duration, response.getId(), status);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}
