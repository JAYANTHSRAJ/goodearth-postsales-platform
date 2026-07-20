package com.goodearth.postsales.webhook.service;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.common.enumeration.UserRole;
import com.goodearth.postsales.notification.entity.Notification;
import com.goodearth.postsales.notification.entity.NotificationCategory;
import com.goodearth.postsales.notification.entity.NotificationPriority;
import com.goodearth.postsales.notification.entity.NotificationType;
import com.goodearth.postsales.notification.service.NotificationService;
import com.goodearth.postsales.webhook.entity.WebhookEvent;
import com.goodearth.postsales.webhook.entity.WebhookStatus;
import com.goodearth.postsales.webhook.repository.WebhookEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class WebhookProcessorImpl implements WebhookProcessor {

    private static final Logger log = LoggerFactory.getLogger(WebhookProcessorImpl.class);

    private final WebhookEventRepository repository;
    private final ZohoCrmSyncProcessor crmProcessor;
    private final ZohoBooksSyncProcessor booksProcessor;
    private final ZohoWorkDriveSyncProcessor workdriveProcessor;
    private final RazorpayWebhookProcessor razorpayProcessor;
    private final NotificationService notificationService;

    public WebhookProcessorImpl(
            WebhookEventRepository repository,
            ZohoCrmSyncProcessor crmProcessor,
            ZohoBooksSyncProcessor booksProcessor,
            ZohoWorkDriveSyncProcessor workdriveProcessor,
            RazorpayWebhookProcessor razorpayProcessor,
            NotificationService notificationService) {
        this.repository = repository;
        this.crmProcessor = crmProcessor;
        this.booksProcessor = booksProcessor;
        this.workdriveProcessor = workdriveProcessor;
        this.razorpayProcessor = razorpayProcessor;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public void processEvent(UUID id) {
        WebhookEvent event = repository.findById(id).orElse(null);
        if (event == null) {
            log.warn("WebhookEvent not found for ID: {}", id);
            return;
        }

        // Multi-instance concurrency protection
        if (event.getStatus() == WebhookStatus.PROCESSED || event.getStatus() == WebhookStatus.PROCESSING) {
            log.info("[CorrelationId: {}] Event is already in status: {}. Skipping.", event.getCorrelationId(), event.getStatus());
            return;
        }

        long startTime = System.currentTimeMillis();
        UUID correlationId = event.getCorrelationId();

        try {
            // Transition state to PROCESSING (optimistic locking @Version validation happens here)
            event.setStatus(WebhookStatus.PROCESSING);
            event = repository.saveAndFlush(event);
        } catch (ObjectOptimisticLockingFailureException e) {
            log.warn("[CorrelationId: {}] Concurrency race condition detected. Webhook ID: {} is being processed by another node.", correlationId, id);
            return;
        }

        log.info("[CorrelationId: {}] Starting async processing of Zoho webhook. Provider: {}, Event: {}", 
                correlationId, event.getProvider(), event.getEventType());

        try {
            switch (event.getProvider()) {
                case ZOHO_CRM:
                    crmProcessor.process(event.getEventType(), event.getPayload(), correlationId);
                    break;
                case ZOHO_BOOKS:
                    booksProcessor.process(event.getEventType(), event.getPayload(), correlationId);
                    break;
                case ZOHO_WORKDRIVE:
                    workdriveProcessor.process(event.getEventType(), event.getPayload(), correlationId);
                    break;
                case RAZORPAY:
                    razorpayProcessor.process(event.getEventType(), event.getPayload(), correlationId);
                    break;
            }

            long duration = System.currentTimeMillis() - startTime;
            event.setStatus(WebhookStatus.PROCESSED);
            event.setProcessedAt(LocalDateTime.now());
            event.setProcessingDurationMs(duration);
            event.setErrorMessage(null);
            repository.save(event);

            log.info("[CorrelationId: {}] Successfully processed Zoho webhook in {}ms. Provider: {}, Event ID: {}", 
                    correlationId, duration, event.getProvider(), event.getEventId());

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            int nextRetryCount = event.getRetryCount() + 1;
            event.setRetryCount(nextRetryCount);
            event.setProcessingDurationMs(duration);
            event.setErrorMessage(e.getMessage());

            if (nextRetryCount < 5) {
                event.setStatus(WebhookStatus.RETRYING);
                // Exponential backoff: 2^retry_count * 30 seconds
                long secondsToWait = (long) Math.pow(2, nextRetryCount) * 30;
                event.setNextRetryAt(LocalDateTime.now().plusSeconds(secondsToWait));
                repository.save(event);

                log.error("[CorrelationId: {}] Webhook processing failed. Scheduled for retry {} in {}s. Error: {}", 
                        correlationId, nextRetryCount, secondsToWait, e.getMessage());
            } else {
                event.setStatus(WebhookStatus.FAILED);
                event.setNextRetryAt(null);
                repository.save(event);

                log.error("[CorrelationId: {}] Webhook processing retries exhausted. Marking as FAILED. Error: {}", 
                        correlationId, e.getMessage());

                // Generate system alert notice for SUPER_ADMIN
                try {
                    Notification notif = new Notification();
                    notif.setTargetRole(UserRole.SUPER_ADMIN.name());
                    notif.setTitle("Webhook Processing Failure Alert");
                    notif.setMessage("Webhook event ID: " + event.getEventId() + " (Provider: " + event.getProvider() + ") failed processing after 5 attempts.");
                    notif.setNotificationType(NotificationType.SYSTEM);
                    notif.setNotificationCategory(NotificationCategory.ACTION_REQUIRED);
                    notif.setPriority(NotificationPriority.CRITICAL);
                    notif.setIcon("warning");
                    notif.setReferenceType("WEBHOOK");
                    notif.setReferenceId(event.getId());
                    notif.setTargetUrl("/admin/webhooks");
                    notificationService.createAndSendNotification(notif);
                } catch (Exception ex) {
                    log.error("Failed to post Admin Webhook Notification failure alert", ex);
                }
            }
        }
    }
}
