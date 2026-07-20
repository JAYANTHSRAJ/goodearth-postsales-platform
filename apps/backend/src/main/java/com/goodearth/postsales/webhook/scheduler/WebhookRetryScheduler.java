package com.goodearth.postsales.webhook.scheduler;

import com.goodearth.postsales.webhook.entity.WebhookEvent;
import com.goodearth.postsales.webhook.entity.WebhookStatus;
import com.goodearth.postsales.webhook.event.ZohoWebhookEvents;
import com.goodearth.postsales.webhook.repository.WebhookEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class WebhookRetryScheduler {

    private static final Logger log = LoggerFactory.getLogger(WebhookRetryScheduler.class);

    private final WebhookEventRepository repository;
    private final ApplicationEventPublisher eventPublisher;

    public WebhookRetryScheduler(
            WebhookEventRepository repository,
            ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
    }

    // Runs every 1 minute to check for events scheduled for retry
    @Scheduled(cron = "0 */1 * * * *")
    public void retryFailedWebhooks() {
        LocalDateTime now = LocalDateTime.now();
        List<WebhookEvent> retryEvents = repository.findByStatusAndNextRetryAtBefore(WebhookStatus.RETRYING, now);

        if (!retryEvents.isEmpty()) {
            log.info("Found {} failed webhook events scheduled for retry.", retryEvents.size());
            for (WebhookEvent event : retryEvents) {
                // Scheduler only publishes retry events
                eventPublisher.publishEvent(new ZohoWebhookEvents.WebhookRetryEvent(event.getId()));
            }
        }
    }
}
