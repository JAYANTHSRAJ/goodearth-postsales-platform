package com.goodearth.postsales.changerequest.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.changerequest.dto.ChangeRequestDto;
import com.goodearth.postsales.changerequest.dto.ChangeRequestHistoryDto;
import com.goodearth.postsales.changerequest.entity.Priority;
import com.goodearth.postsales.changerequest.entity.ReviewDecision;
import com.goodearth.postsales.changerequest.service.ChangeRequestService;
import com.goodearth.postsales.changerequest.service.HistoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/change-requests", "/change-requests"})
public class ChangeRequestController {

    private static final Logger log = LoggerFactory.getLogger(ChangeRequestController.class);

    private final ChangeRequestService service;
    private final HistoryService historyService;

    public ChangeRequestController(ChangeRequestService service, HistoryService historyService) {
        this.service = service;
        this.historyService = historyService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT')")
    public ResponseEntity<ApiResponse<ChangeRequestDto>> createRequest(@RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        UUID workflowId = UUID.fromString(request.get("workflowId"));
        UUID documentId = UUID.fromString(request.get("documentId"));
        String annotationId = request.get("annotationId");
        String requestedBy = request.get("requestedBy");
        Priority priority = request.get("priority") != null ? Priority.valueOf(request.get("priority").toUpperCase()) : Priority.MEDIUM;
        String remarks = request.get("remarks");

        ChangeRequestDto response = service.createRequest(workflowId, documentId, annotationId, requestedBy, priority, remarks);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/change-requests, Execution Time: {}ms, Change Request ID: {}",
                duration, response.getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<ChangeRequestDto>> assignRequest(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        String assignee = request.get("assignee");
        String remarks = request.get("remarks");
        String actor = request.get("actor");

        ChangeRequestDto response = service.assignRequest(id, assignee, remarks, actor);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/change-requests/{}/assign, Execution Time: {}ms, Change Request ID: {}",
                id, duration, response.getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO')")
    public ResponseEntity<ApiResponse<ChangeRequestDto>> reviewRequest(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        ReviewDecision decision = ReviewDecision.valueOf(request.get("decision").toUpperCase());
        String remarks = request.get("remarks");
        String actor = request.get("actor");

        ChangeRequestDto response;
        if (decision == ReviewDecision.ACCEPTED) {
            response = service.approveRequest(id, remarks, actor);
        } else if (decision == ReviewDecision.REJECTED) {
            response = service.rejectRequest(id, remarks, actor);
        } else {
            response = service.needClarification(id, remarks, actor);
        }
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/change-requests/{}/review, Execution Time: {}ms, Change Request ID: {}",
                id, duration, response.getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/{id}/revised-drawing")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DESIGN_STUDIO')")
    public ResponseEntity<ApiResponse<ChangeRequestDto>> uploadRevisedDrawing(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request) {
        long startTime = System.currentTimeMillis();
        String workDriveFileId = (String) request.get("workDriveFileId");
        BigDecimal estimatedCost = new BigDecimal(request.get("estimatedCost").toString());
        LocalDateTime completionDate = LocalDateTime.parse(request.get("estimatedCompletionDate").toString());
        String remarks = (String) request.get("remarks");
        String actor = (String) request.get("actor");

        ChangeRequestDto response = service.uploadRevisedDrawing(id, workDriveFileId, estimatedCost, completionDate, remarks, actor);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/change-requests/{}/revised-drawing, Execution Time: {}ms, Change Request ID: {}",
                id, duration, response.getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/{id}/confirm-price")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<ChangeRequestDto>> confirmFinancePrice(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        String remarks = request.get("remarks");
        String actor = request.get("actor");

        ChangeRequestDto response = service.confirmFinancePrice(id, remarks, actor);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/change-requests/{}/confirm-price, Execution Time: {}ms, Change Request ID: {}",
                id, duration, response.getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<ChangeRequestDto>> publishQuotation(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        String remarks = request.get("remarks");
        String actor = request.get("actor");

        ChangeRequestDto response = service.publishQuotation(id, remarks, actor);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/change-requests/{}/publish, Execution Time: {}ms, Change Request ID: {}",
                id, duration, response.getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/{id}/quotation")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLIENT')")
    public ResponseEntity<ApiResponse<ChangeRequestDto>> processQuotation(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        String decision = request.get("decision");
        String remarks = request.get("remarks");
        String actor = request.get("actor");

        ChangeRequestDto response;
        if ("ACCEPT".equalsIgnoreCase(decision)) {
            response = service.approveQuotation(id, remarks, actor);
        } else {
            response = service.rejectQuotation(id, remarks, actor);
        }
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/change-requests/{}/quotation, Execution Time: {}ms, Change Request ID: {}",
                id, duration, response.getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'CLIENT')")
    public ResponseEntity<ApiResponse<ChangeRequestDto>> getRequest(@PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        ChangeRequestDto response = service.getRequest(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/change-requests/{}, Execution Time: {}ms, Change Request ID: {}",
                id, duration, response.getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'CLIENT')")
    public ResponseEntity<ApiResponse<List<ChangeRequestHistoryDto>>> getRequestHistory(@PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        List<ChangeRequestHistoryDto> response = historyService.getHistory(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/change-requests/{}/history, Execution Time: {}ms, Change Request ID: {}",
                id, duration, id);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'FINANCE')")
    public ResponseEntity<ApiResponse<List<ChangeRequestDto>>> listRequests() {
        long startTime = System.currentTimeMillis();
        List<ChangeRequestDto> response = service.listRequests();
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/change-requests, Execution Time: {}ms, Change Request ID: N/A", duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}
