package com.goodearth.postsales.webhook.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.webhook.dto.WebhookEventDto;
import com.goodearth.postsales.webhook.dto.WebhookStatisticsDto;
import com.goodearth.postsales.webhook.service.WebhookService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/webhooks")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class WebhookAdminController {

    private static final Logger log = LoggerFactory.getLogger(WebhookAdminController.class);

    private final WebhookService service;

    public WebhookAdminController(WebhookService service) {
        this.service = service;
    }

    @GetMapping("/events")
    public ResponseEntity<ApiResponse<List<WebhookEventDto>>> listEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        long startTime = System.currentTimeMillis();
        List<WebhookEventDto> response = service.listEvents(page, size);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/webhooks/events, Status: 200, Duration: {}ms, Results: {}", duration, response.size());
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/events/{id}")
    public ResponseEntity<ApiResponse<WebhookEventDto>> getEventDetail(@PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        WebhookEventDto response = service.getEventDetail(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/webhooks/events/{}, Status: 200, Duration: {}ms, Correlation: {}", id, duration, response.getCorrelationId());
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/retry/{id}")
    public ResponseEntity<ApiResponse<String>> manualRetry(@PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        service.replayEvent(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/webhooks/retry/{}, Status: 200, Duration: {}ms", id, duration);
        return ResponseEntity.ok(new ApiResponse<>("Webhook manual retry triggered successfully."));
    }

    @PostMapping("/replay/{id}")
    public ResponseEntity<ApiResponse<String>> replayEvent(@PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        service.replayEvent(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/webhooks/replay/{}, Status: 200, Duration: {}ms", id, duration);
        return ResponseEntity.ok(new ApiResponse<>("Webhook replay triggered successfully."));
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<WebhookStatisticsDto>> getStatistics() {
        long startTime = System.currentTimeMillis();
        WebhookStatisticsDto response = service.getStatistics();
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/webhooks/statistics, Status: 200, Duration: {}ms", duration);
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<WebhookStatisticsDto>> getHealth() {
        long startTime = System.currentTimeMillis();
        WebhookStatisticsDto response = service.getStatistics();
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/webhooks/health, Status: 200, Duration: {}ms", duration);
        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}
