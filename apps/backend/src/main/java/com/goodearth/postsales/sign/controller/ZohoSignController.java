package com.goodearth.postsales.sign.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.sign.dto.ZohoSignCreateRequest;
import com.goodearth.postsales.sign.dto.ZohoSignDto;
import com.goodearth.postsales.sign.service.ZohoSignService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping
public class ZohoSignController {

    private static final Logger log = LoggerFactory.getLogger(ZohoSignController.class);

    private final ZohoSignService signService;

    public ZohoSignController(ZohoSignService signService) {
        this.signService = signService;
    }

    @PostMapping("/api/v1/sign/requests")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'FINANCE')")
    public ResponseEntity<ApiResponse<ZohoSignDto>> createSignRequest(@Valid @RequestBody ZohoSignCreateRequest request) {
        long startTime = System.currentTimeMillis();
        ZohoSignDto response = signService.createSignRequest(request);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/sign/requests, Execution Time: {}ms, Request ID: {}", duration, response.getRequestId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/api/v1/sign/requests/{requestId}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'BUYER', 'CLIENT', 'DESIGN_STUDIO', 'FINANCE')")
    public ResponseEntity<ApiResponse<ZohoSignDto>> getSignRequestStatus(@PathVariable String requestId) {
        long startTime = System.currentTimeMillis();
        ZohoSignDto response = signService.getSignRequestStatus(requestId);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/sign/requests/{}/status, Execution Time: {}ms", requestId, duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/api/v1/sign/requests/booking/{dealIdOrBookingId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'BUYER', 'CLIENT', 'DESIGN_STUDIO', 'FINANCE')")
    public ResponseEntity<ApiResponse<ZohoSignDto>> getSignRequestForBooking(@PathVariable String dealIdOrBookingId) {
        long startTime = System.currentTimeMillis();
        ZohoSignDto response = signService.getSignRequestForBooking(dealIdOrBookingId);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/sign/requests/booking/{}, Execution Time: {}ms", dealIdOrBookingId, duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/api/v1/sign/requests/workflow/{workflowId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'BUYER', 'CLIENT', 'DESIGN_STUDIO', 'FINANCE')")
    public ResponseEntity<ApiResponse<List<ZohoSignDto>>> getSignRequestsForWorkflow(@PathVariable UUID workflowId) {
        long startTime = System.currentTimeMillis();
        List<ZohoSignDto> response = signService.getSignRequestsForWorkflow(workflowId);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/sign/requests/workflow/{}, Execution Time: {}ms, Count: {}", workflowId, duration, response.size());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/api/v1/sign/requests/{requestId}/download")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'BUYER', 'CLIENT', 'DESIGN_STUDIO', 'FINANCE')")
    public ResponseEntity<byte[]> downloadSignedDocument(@PathVariable String requestId) {
        long startTime = System.currentTimeMillis();
        byte[] pdfBytes = signService.downloadSignedDocument(requestId);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/sign/requests/{}/download, Execution Time: {}ms, Size: {} bytes", requestId, duration, pdfBytes.length);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Signed_Document_" + requestId + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @PostMapping("/api/v1/webhooks/zoho-sign")
    public ResponseEntity<ApiResponse<String>> handleSignWebhook(@RequestBody Map<String, Object> payload) {
        long startTime = System.currentTimeMillis();
        signService.handleSignWebhook(payload);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/webhooks/zoho-sign, Execution Time: {}ms", duration);

        return ResponseEntity.ok(new ApiResponse<>("Webhook processed successfully."));
    }
}
