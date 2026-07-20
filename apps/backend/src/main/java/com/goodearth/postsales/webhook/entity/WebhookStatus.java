package com.goodearth.postsales.webhook.entity;

public enum WebhookStatus {
    RECEIVED,
    PROCESSING,
    PROCESSED,
    RETRYING,
    FAILED,
    SKIPPED
}
