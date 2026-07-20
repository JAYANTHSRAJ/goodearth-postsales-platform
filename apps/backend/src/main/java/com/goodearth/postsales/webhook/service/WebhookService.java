package com.goodearth.postsales.webhook.service;

import com.goodearth.postsales.webhook.dto.WebhookEventDto;
import com.goodearth.postsales.webhook.dto.WebhookStatisticsDto;
import com.goodearth.postsales.webhook.entity.WebhookEvent;

import java.util.List;
import java.util.UUID;

public interface WebhookService {
    List<WebhookEventDto> listEvents(int page, int size);
    WebhookEventDto getEventDetail(UUID id);
    void replayEvent(UUID id);
    WebhookStatisticsDto getStatistics();
    WebhookEvent saveReceivedEvent(String eventId, String provider, String eventType, String rawPayload);
}
