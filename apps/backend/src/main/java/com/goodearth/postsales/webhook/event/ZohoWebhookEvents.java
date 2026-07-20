package com.goodearth.postsales.webhook.event;

import java.util.UUID;

public final class ZohoWebhookEvents {

    private ZohoWebhookEvents() {}

    public static record WebhookReceivedEvent(
            UUID webhookEventId
    ) {}

    public static record WebhookRetryEvent(
            UUID webhookEventId
    ) {}
}
