package com.goodearth.postsales.webhook.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodearth.postsales.finance.entity.PaymentReceipt;
import com.goodearth.postsales.finance.entity.PaymentStatus;
import com.goodearth.postsales.finance.repository.PaymentReceiptRepository;
import com.goodearth.postsales.notification.event.NotificationEvents;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import com.goodearth.postsales.common.exception.CustomException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
public class RazorpayWebhookProcessor {

    private static final Logger log = LoggerFactory.getLogger(RazorpayWebhookProcessor.class);

    private final PaymentReceiptRepository receiptRepository;
    private final WorkflowRepository workflowRepository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    public RazorpayWebhookProcessor(
            PaymentReceiptRepository receiptRepository,
            WorkflowRepository workflowRepository,
            ObjectMapper objectMapper,
            ApplicationEventPublisher eventPublisher) {
        this.receiptRepository = receiptRepository;
        this.workflowRepository = workflowRepository;
        this.objectMapper = objectMapper;
        this.eventPublisher = eventPublisher;
    }

    public void process(String eventType, String payload, UUID correlationId) throws Exception {
        log.info("[CorrelationId: {}] Processing Razorpay webhook event of type: {}", correlationId, eventType);
        Map<String, Object> data = objectMapper.readValue(payload, new TypeReference<Map<String, Object>>() {});

        if ("payment.captured".equalsIgnoreCase(eventType)) {
            processPaymentCaptured(data, correlationId);
        } else {
            log.warn("[CorrelationId: {}] Unknown Razorpay event type: {}", correlationId, eventType);
        }
    }

    @SuppressWarnings("unchecked")
    private void processPaymentCaptured(Map<String, Object> data, UUID correlationId) {
        Map<String, Object> payload = (Map<String, Object>) data.get("payload");
        if (payload == null) {
            log.warn("[CorrelationId: {}] Missing payload in Razorpay webhook.", correlationId);
            return;
        }

        Map<String, Object> paymentObj = (Map<String, Object>) payload.get("payment");
        if (paymentObj == null) {
            log.warn("[CorrelationId: {}] Missing payment object in payload.", correlationId);
            return;
        }

        Map<String, Object> entity = (Map<String, Object>) paymentObj.get("entity");
        if (entity == null) {
            log.warn("[CorrelationId: {}] Missing entity details in payment.", correlationId);
            return;
        }

        String paymentId = (String) entity.get("id");
        Object amountObj = entity.get("amount"); // Amount in paise
        String description = (String) entity.get("description");

        Map<String, Object> notes = (Map<String, Object>) entity.get("notes");
        if (notes == null) {
            log.warn("[CorrelationId: {}] Missing notes in payment entity.", correlationId);
            return;
        }

        String workflowIdStr = (String) notes.get("workflow_id");
        if (workflowIdStr == null || workflowIdStr.isBlank()) {
            log.warn("[CorrelationId: {}] Missing workflow_id in notes.", correlationId);
            return;
        }

        try {
            UUID workflowId = UUID.fromString(workflowIdStr);
            Workflow workflow = workflowRepository.findById(workflowId)
                    .orElseThrow(() -> new CustomException("Workflow not found.", HttpStatus.NOT_FOUND));

            BigDecimal amountPaise = new BigDecimal(amountObj.toString());
            BigDecimal amountInRupees = amountPaise.divide(new BigDecimal("100.00"), 2, RoundingMode.HALF_UP);

            // Avoid double processing
            Optional<PaymentReceipt> existingOpt = receiptRepository.findByZohoPaymentId(paymentId);
            if (existingOpt.isPresent()) {
                log.info("[CorrelationId: {}] PaymentReceipt for payment ID: {} already exists. Skipping.", correlationId, paymentId);
                return;
            }

            PaymentReceipt receipt = new PaymentReceipt();
            receipt.setWorkflow(workflow);
            receipt.setZohoPaymentId(paymentId);
            receipt.setAmount(amountInRupees);
            receipt.setStatus(PaymentStatus.SUCCESS);
            receipt.setPaidDate(LocalDateTime.now());
            receipt.setRemarks(description != null ? description : "Razorpay online payment captured.");
            receiptRepository.save(receipt);

            log.info("[CorrelationId: {}] Created payment receipt for Razorpay payment ID: {}, amount: {}", correlationId, paymentId, amountInRupees);

            // Publish Notification Event
            String email = workflow.getBuyer().getEmail();
            String customerName = workflow.getBuyer().getFullName();
            String projectName = workflow.getProject().getProjectName();

            eventPublisher.publishEvent(new NotificationEvents.PaymentReceivedEvent(
                    workflow.getId(),
                    UUID.randomUUID(), // Simulated payment reference uuid
                    amountInRupees,
                    customerName,
                    email,
                    projectName
            ));

        } catch (IllegalArgumentException e) {
            log.warn("[CorrelationId: {}] Invalid workflow_id format in notes: {}", correlationId, workflowIdStr);
        }
    }
}
