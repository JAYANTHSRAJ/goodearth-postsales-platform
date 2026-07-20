package com.goodearth.postsales.webhook.listener;

import com.goodearth.postsales.webhook.event.ZohoWebhookEvents;
import com.goodearth.postsales.webhook.service.WebhookProcessor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class WebhookEventListener {

    private static final Logger log = LoggerFactory.getLogger(WebhookEventListener.class);

    private final WebhookProcessor processor;

    public WebhookEventListener(WebhookProcessor processor) {
        this.processor = processor;
    }

    @Async
    @EventListener
    public void handleWebhookReceived(ZohoWebhookEvents.WebhookReceivedEvent event) {
        log.info("Async WebhookReceivedEvent intercepted for ID: {}", event.webhookEventId());
        processor.processEvent(event.webhookEventId());
    }

    @Async
    @EventListener
    public void handleWebhookRetry(ZohoWebhookEvents.WebhookRetryEvent event) {
        log.info("Async WebhookRetryEvent intercepted for ID: {}", event.webhookEventId());
        processor.processEvent(event.webhookEventId());
    }
}
