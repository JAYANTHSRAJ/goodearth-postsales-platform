package com.goodearth.postsales.webhook.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WebhookStatisticsDto {
    private long pendingQueueSize;
    private long retryQueueSize;
    private long processedToday;
    private long failedToday;
    private String schedulerStatus;
    private LocalDateTime oldestPendingWebhookCreatedAt;
    private double averageProcessingTimeMs;
}
