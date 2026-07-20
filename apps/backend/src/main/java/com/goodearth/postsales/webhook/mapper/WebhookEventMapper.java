package com.goodearth.postsales.webhook.mapper;

import com.goodearth.postsales.webhook.dto.WebhookEventDto;
import com.goodearth.postsales.webhook.entity.WebhookEvent;
import org.springframework.stereotype.Component;

@Component
public class WebhookEventMapper {

    public WebhookEventDto toDto(WebhookEvent entity) {
        if (entity == null) {
            return null;
        }

        WebhookEventDto dto = new WebhookEventDto();
        dto.setId(entity.getId());
        dto.setEventId(entity.getEventId());
        dto.setProvider(entity.getProvider().name());
        dto.setEventType(entity.getEventType());
        dto.setStatus(entity.getStatus().name());
        dto.setRetryCount(entity.getRetryCount());
        dto.setErrorMessage(entity.getErrorMessage());
        dto.setProcessedAt(entity.getProcessedAt());
        dto.setProcessingDurationMs(entity.getProcessingDurationMs());
        dto.setCorrelationId(entity.getCorrelationId());
        dto.setCreatedAt(entity.getCreatedAt());

        return dto;
    }
}
