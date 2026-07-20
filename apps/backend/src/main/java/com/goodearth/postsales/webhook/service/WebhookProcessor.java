package com.goodearth.postsales.webhook.service;

import java.util.UUID;

public interface WebhookProcessor {
    void processEvent(UUID webhookEventId);
}
