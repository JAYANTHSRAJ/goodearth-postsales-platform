package com.goodearth.postsales.webhook.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.webhook.entity.WebhookEvent;
import com.goodearth.postsales.webhook.entity.WebhookStatus;
import com.goodearth.postsales.webhook.event.ZohoWebhookEvents;
import com.goodearth.postsales.webhook.security.WebhookSignatureVerifier;
import com.goodearth.postsales.webhook.service.WebhookService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.goodearth.postsales.integration.service.ZohoDealsOnboardingService;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/webhooks")
public class WebhookReceiverController {

    private static final Logger log = LoggerFactory.getLogger(WebhookReceiverController.class);

    private final WebhookSignatureVerifier signatureVerifier;
    private final WebhookService service;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    private final ZohoDealsOnboardingService onboardingService;

    @Value("${zoho.webhook.crm-secret}")
    private String crmSecret;

    @Value("${zoho.webhook.books-secret}")
    private String booksSecret;

    @Value("${zoho.webhook.workdrive-secret}")
    private String workdriveSecret;

    @Value("${razorpay.webhook.secret}")
    private String razorpaySecret;


    public WebhookReceiverController(
            WebhookSignatureVerifier signatureVerifier,
            WebhookService service,
            ApplicationEventPublisher eventPublisher,
            ObjectMapper objectMapper,
            ZohoDealsOnboardingService onboardingService) {
        this.signatureVerifier = signatureVerifier;
        this.service = service;
        this.eventPublisher = eventPublisher;
        this.objectMapper = objectMapper;
        this.onboardingService = onboardingService;
    }

    @PostMapping("/zoho-crm")
    public ResponseEntity<ApiResponse<String>> receiveCrmWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Zoho-Signature", required = false) String signature,
            @RequestHeader(value = "X-Zoho-Timestamp", required = false) String timestamp,
            @RequestHeader(value = "X-Zoho-Event-Id", required = false) String eventIdHeader,
            @RequestHeader(value = "X-Zoho-Event-Type", required = false) String eventTypeHeader) {
        
        if (!signatureVerifier.verifySignature(payload, signature, crmSecret, timestamp)) {
            throw new com.goodearth.postsales.common.exception.CustomException("Invalid signature.", HttpStatus.UNAUTHORIZED);
        }

        String eventId = resolveEventId(payload, eventIdHeader);
        String eventType = resolveEventType(payload, eventTypeHeader, "contacts");

        WebhookEvent event = service.saveReceivedEvent(eventId, "ZOHO_CRM", eventType, payload);
        
        if (event.getStatus() == WebhookStatus.RECEIVED) {
            // Trigger async processing
            eventPublisher.publishEvent(new ZohoWebhookEvents.WebhookReceivedEvent(event.getId()));
        }

        return ResponseEntity.ok(new ApiResponse<>("Webhook accepted."));
    }

    @PostMapping("/zoho-books")
    public ResponseEntity<ApiResponse<String>> receiveBooksWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Zoho-Signature", required = false) String signature,
            @RequestHeader(value = "X-Zoho-Timestamp", required = false) String timestamp,
            @RequestHeader(value = "X-Zoho-Event-Id", required = false) String eventIdHeader,
            @RequestHeader(value = "X-Zoho-Event-Type", required = false) String eventTypeHeader) {
        
        if (!signatureVerifier.verifySignature(payload, signature, booksSecret, timestamp)) {
            throw new com.goodearth.postsales.common.exception.CustomException("Invalid signature.", HttpStatus.UNAUTHORIZED);
        }

        String eventId = resolveEventId(payload, eventIdHeader);
        String eventType = resolveEventType(payload, eventTypeHeader, "invoices");

        WebhookEvent event = service.saveReceivedEvent(eventId, "ZOHO_BOOKS", eventType, payload);

        if (event.getStatus() == WebhookStatus.RECEIVED) {
            eventPublisher.publishEvent(new ZohoWebhookEvents.WebhookReceivedEvent(event.getId()));
        }

        return ResponseEntity.ok(new ApiResponse<>("Webhook accepted."));
    }

    @PostMapping("/zoho-workdrive")
    public ResponseEntity<ApiResponse<String>> receiveWorkDriveWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Zoho-Signature", required = false) String signature,
            @RequestHeader(value = "X-Zoho-Timestamp", required = false) String timestamp,
            @RequestHeader(value = "X-Zoho-Event-Id", required = false) String eventIdHeader,
            @RequestHeader(value = "X-Zoho-Event-Type", required = false) String eventTypeHeader) {
        
        if (!signatureVerifier.verifySignature(payload, signature, workdriveSecret, timestamp)) {
            throw new com.goodearth.postsales.common.exception.CustomException("Invalid signature.", HttpStatus.UNAUTHORIZED);
        }

        String eventId = resolveEventId(payload, eventIdHeader);
        String eventType = resolveEventType(payload, eventTypeHeader, "file_uploaded");

        WebhookEvent event = service.saveReceivedEvent(eventId, "ZOHO_WORKDRIVE", eventType, payload);

        if (event.getStatus() == WebhookStatus.RECEIVED) {
            eventPublisher.publishEvent(new ZohoWebhookEvents.WebhookReceivedEvent(event.getId()));
        }

        return ResponseEntity.ok(new ApiResponse<>("Webhook accepted."));
    }

    @PostMapping("/razorpay")
    public ResponseEntity<ApiResponse<String>> receiveRazorpayWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestHeader(value = "X-Razorpay-Event-Id", required = false) String eventIdHeader,
            @RequestHeader(value = "X-Razorpay-Event-Type", required = false) String eventTypeHeader) {
        
        if (!signatureVerifier.verifySignature(payload, signature, razorpaySecret, null)) {
            throw new com.goodearth.postsales.common.exception.CustomException("Invalid signature.", HttpStatus.UNAUTHORIZED);
        }

        String eventId = resolveEventId(payload, eventIdHeader);
        String eventType = resolveEventType(payload, eventTypeHeader, "payment.captured");

        WebhookEvent event = service.saveReceivedEvent(eventId, "RAZORPAY", eventType, payload);

        if (event.getStatus() == WebhookStatus.RECEIVED) {
            eventPublisher.publishEvent(new ZohoWebhookEvents.WebhookReceivedEvent(event.getId()));
        }

        return ResponseEntity.ok(new ApiResponse<>("Webhook accepted."));
    }

    private String resolveEventId(String payload, String header) {
        if (header != null && !header.isBlank()) return header;
        try {
            Map<String, Object> data = objectMapper.readValue(payload, new TypeReference<Map<String, Object>>() {});
            if (data.containsKey("Event_Id")) return data.get("Event_Id").toString();
            if (data.containsKey("event_id")) return data.get("event_id").toString();
            if (data.containsKey("id")) return data.get("id").toString();
        } catch (Exception e) {
            // Log parse failures softly
        }
        return UUID.randomUUID().toString();
    }

    private String resolveEventType(String payload, String header, String defaultType) {
        if (header != null && !header.isBlank()) return header;
        try {
            Map<String, Object> data = objectMapper.readValue(payload, new TypeReference<Map<String, Object>>() {});
            if (data.containsKey("Event_Type")) return data.get("Event_Type").toString();
            if (data.containsKey("event_type")) return data.get("event_type").toString();
            if (data.containsKey("type")) return data.get("type").toString();
        } catch (Exception e) {
            // Log parse failures softly
        }
        return defaultType;
    }

    @PostMapping("/zoho/deals")
    public ResponseEntity<?> receiveZohoDealsWebhook(@RequestBody Map<String, Object> payload) {
        log.info("Received Zoho CRM Deals webhook. Payload: {}", payload);
        
        // Extract Deal ID for logging
        String dealId = null;
        if (payload != null) {
            if (payload.get("id") != null) {
                dealId = payload.get("id").toString();
            } else if (payload.get("dealId") != null) {
                dealId = payload.get("dealId").toString();
            } else if (payload.get("deal_id") != null) {
                dealId = payload.get("deal_id").toString();
            } else if (payload.get("Deal_Id") != null) {
                dealId = payload.get("Deal_Id").toString();
            }
        }
        
        try {
            onboardingService.processDealWebhook(payload);
            return ResponseEntity.ok(new ApiResponse<>("Zoho Deal Webhook processed successfully."));
        } catch (Exception e) {
            String responseBody = "N/A";
            int httpStatus = 500;
            String requestUrl = "N/A";
            String requestHeaders = "N/A";
            
            Throwable cause = e;
            while (cause != null) {
                if (cause instanceof org.springframework.web.client.RestClientResponseException) {
                    org.springframework.web.client.RestClientResponseException rre = (org.springframework.web.client.RestClientResponseException) cause;
                    responseBody = rre.getResponseBodyAsString();
                    httpStatus = rre.getStatusCode().value();
                    break;
                }
                cause = cause.getCause();
            }
            
            // Check if it's a token/authentication error
            if (e.getMessage() != null && e.getMessage().contains("Failed to retrieve access token")) {
                httpStatus = 401; // Unauthorized
                requestUrl = onboardingService.getProperties().getAccountsUrl() + "/oauth/v2/token";
                requestHeaders = "Content-Type: application/x-www-form-urlencoded";
                // extract response body if stored in message
                if (e.getMessage().contains("Complete response body: ")) {
                    responseBody = e.getMessage().substring(e.getMessage().indexOf("Complete response body: ") + "Complete response body: ".length());
                }
            } else if (dealId != null) {
                requestUrl = onboardingService.getProperties().getCrmApiUrl() + "/Deals/" + dealId;
                requestHeaders = "Authorization: Bearer [cachedToken]";
            }
            
            // Log required details
            log.error("Zoho API Request Failed!");
            log.error("Deal ID: {}", dealId != null ? dealId : "N/A");
            log.error("Request URL: {}", requestUrl);
            log.error("Request Headers: {}", requestHeaders);
            log.error("HTTP Status: {}", httpStatus);
            log.error("Response Body: {}", responseBody);
            log.error("Exception Class: {}", e.getClass().getName());
            log.error("Exception message: {}", e.getMessage());
            log.error("Exception stack trace:", e);
            
            HttpStatus status = HttpStatus.resolve(httpStatus);
            if (status == null) {
                status = HttpStatus.INTERNAL_SERVER_ERROR;
            }
            
            String errorMsg = "Zoho webhook processing failed: " + e.getMessage();
            if (!"N/A".equals(responseBody)) {
                errorMsg += " | Details: " + responseBody;
            }
            
            com.goodearth.postsales.common.exception.ErrorResponse errorResponse = 
                new com.goodearth.postsales.common.exception.ErrorResponse(
                    status.value(),
                    status.getReasonPhrase(),
                    errorMsg
                );
            
            return ResponseEntity.status(status).body(errorResponse);
        }
    }
}
