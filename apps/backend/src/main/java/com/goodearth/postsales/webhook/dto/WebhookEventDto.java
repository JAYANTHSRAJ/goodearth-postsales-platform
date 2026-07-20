package com.goodearth.postsales.webhook.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WebhookEventDto {
    private UUID id;
    private String eventId;
    private String provider;
    private String eventType;
    private String status;
    private int retryCount;
    private String errorMessage;
    private LocalDateTime processedAt;
    private Long processingDurationMs;
    private UUID correlationId;
    private LocalDateTime createdAt;
}
