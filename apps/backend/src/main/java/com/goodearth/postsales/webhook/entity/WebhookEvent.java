package com.goodearth.postsales.webhook.entity;

import com.goodearth.postsales.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "webhook_events", uniqueConstraints = {
    @UniqueConstraint(name = "uq_webhook_provider_event", columnNames = {"provider", "event_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class WebhookEvent extends BaseEntity {

    @Column(name = "event_id", nullable = false)
    private String eventId;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 50)
    private WebhookProvider provider;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "payload_hash", nullable = false, length = 64)
    private String payloadHash;

    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private WebhookStatus status = WebhookStatus.RECEIVED;

    @Column(name = "retry_count", nullable = false)
    private int retryCount = 0;

    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "processing_duration_ms")
    private Long processingDurationMs;

    @Column(name = "correlation_id", nullable = false)
    private UUID correlationId = UUID.randomUUID();

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;
}
