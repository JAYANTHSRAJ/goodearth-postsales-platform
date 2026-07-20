package com.goodearth.postsales.webhook.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodearth.postsales.finance.entity.FinancialQuote;
import com.goodearth.postsales.finance.entity.QuoteStatus;
import com.goodearth.postsales.finance.entity.PaymentSchedule;
import com.goodearth.postsales.finance.entity.InvoiceStatus;
import com.goodearth.postsales.finance.repository.FinancialQuoteRepository;
import com.goodearth.postsales.finance.repository.PaymentScheduleRepository;
import com.goodearth.postsales.notification.event.NotificationEvents;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
public class ZohoBooksSyncProcessor {

    private static final Logger log = LoggerFactory.getLogger(ZohoBooksSyncProcessor.class);

    private final FinancialQuoteRepository quoteRepository;
    private final PaymentScheduleRepository scheduleRepository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    public ZohoBooksSyncProcessor(
            FinancialQuoteRepository quoteRepository,
            PaymentScheduleRepository scheduleRepository,
            ObjectMapper objectMapper,
            ApplicationEventPublisher eventPublisher) {
        this.quoteRepository = quoteRepository;
        this.scheduleRepository = scheduleRepository;
        this.objectMapper = objectMapper;
        this.eventPublisher = eventPublisher;
    }

    public void process(String eventType, String payload, UUID correlationId) throws Exception {
        log.info("[CorrelationId: {}] Processing Zoho Books webhook event of type: {}", correlationId, eventType);
        Map<String, Object> data = objectMapper.readValue(payload, new TypeReference<Map<String, Object>>() {});

        if ("estimates".equalsIgnoreCase(eventType)) {
            syncEstimate(data, correlationId);
        } else if ("invoices".equalsIgnoreCase(eventType)) {
            syncInvoice(data, correlationId);
        } else if ("payments".equalsIgnoreCase(eventType)) {
            syncPayment(data, correlationId);
        } else {
            log.warn("[CorrelationId: {}] Unknown Books event type: {}", correlationId, eventType);
        }
    }

    private void syncEstimate(Map<String, Object> data, UUID correlationId) {
        String quoteIdStr = (String) data.get("Estimate_Id");
        if (quoteIdStr == null || quoteIdStr.isBlank()) {
            log.warn("[CorrelationId: {}] Missing Estimate_Id field.", correlationId);
            return;
        }

        try {
            UUID quoteId = UUID.fromString(quoteIdStr);
            Optional<FinancialQuote> opt = quoteRepository.findById(quoteId);
            if (opt.isPresent()) {
                FinancialQuote quote = opt.get();
                String status = (String) data.get("Status");
                if ("accepted".equalsIgnoreCase(status)) {
                    quote.setStatus(QuoteStatus.ACCEPTED);
                } else if ("declined".equalsIgnoreCase(status) || "rejected".equalsIgnoreCase(status)) {
                    quote.setStatus(QuoteStatus.DECLINED);
                }
                quoteRepository.save(quote);
                log.info("[CorrelationId: {}] Synced estimate {} status to: {}", correlationId, quoteId, quote.getStatus());
            }
        } catch (IllegalArgumentException e) {
            log.warn("[CorrelationId: {}] Invalid Estimate_Id format: {}", correlationId, quoteIdStr);
        }
    }

    private void syncInvoice(Map<String, Object> data, UUID correlationId) {
        String invoiceIdStr = (String) data.get("Invoice_Id");
        if (invoiceIdStr == null || invoiceIdStr.isBlank()) {
            log.warn("[CorrelationId: {}] Missing Invoice_Id field.", correlationId);
            return;
        }

        try {
            UUID invoiceId = UUID.fromString(invoiceIdStr);
            Optional<PaymentSchedule> opt = scheduleRepository.findById(invoiceId);
            if (opt.isPresent()) {
                PaymentSchedule schedule = opt.get();
                String status = (String) data.get("Status");
                if ("paid".equalsIgnoreCase(status)) {
                    schedule.setStatus(InvoiceStatus.PAID);
                } else if ("sent".equalsIgnoreCase(status) || "overdue".equalsIgnoreCase(status)) {
                    schedule.setStatus(InvoiceStatus.SENT);
                }
                scheduleRepository.save(schedule);
                log.info("[CorrelationId: {}] Synced invoice {} status to: {}", correlationId, invoiceId, schedule.getStatus());
            }
        } catch (IllegalArgumentException e) {
            log.warn("[CorrelationId: {}] Invalid Invoice_Id format: {}", correlationId, invoiceIdStr);
        }
    }

    private void syncPayment(Map<String, Object> data, UUID correlationId) {
        String paymentIdStr = (String) data.get("Payment_Id");
        String invoiceIdStr = (String) data.get("Invoice_Id");
        if (paymentIdStr == null || invoiceIdStr == null) {
            log.warn("[CorrelationId: {}] Missing payment/invoice identifier details.", correlationId);
            return;
        }

        try {
            UUID invoiceId = UUID.fromString(invoiceIdStr);
            Optional<PaymentSchedule> opt = scheduleRepository.findById(invoiceId);
            if (opt.isPresent()) {
                PaymentSchedule schedule = opt.get();
                schedule.setStatus(InvoiceStatus.PAID);
                scheduleRepository.save(schedule);

                BigDecimal amount = data.get("Amount") != null 
                        ? new BigDecimal(data.get("Amount").toString()) : schedule.getAmount();

                String email = schedule.getWorkflow().getBuyer().getEmail();
                String customerName = schedule.getWorkflow().getBuyer().getFullName();
                String projectName = schedule.getWorkflow().getProject().getProjectName();

                // Publish Spring Event
                eventPublisher.publishEvent(new NotificationEvents.PaymentReceivedEvent(
                        schedule.getWorkflow().getId(),
                        UUID.fromString(paymentIdStr),
                        amount,
                        customerName,
                        email,
                        projectName
                ));
                log.info("[CorrelationId: {}] Published PaymentReceivedEvent for amount: {}", correlationId, amount);
            }
        } catch (IllegalArgumentException e) {
            log.warn("[CorrelationId: {}] Error parsing UUIDs during Books payment sync.", correlationId);
        }
    }
}
