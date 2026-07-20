package com.goodearth.postsales.webhook.service;

import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.webhook.dto.WebhookEventDto;
import com.goodearth.postsales.webhook.dto.WebhookStatisticsDto;
import com.goodearth.postsales.webhook.entity.WebhookEvent;
import com.goodearth.postsales.webhook.entity.WebhookProvider;
import com.goodearth.postsales.webhook.entity.WebhookStatus;
import com.goodearth.postsales.webhook.event.ZohoWebhookEvents;
import com.goodearth.postsales.webhook.mapper.WebhookEventMapper;
import com.goodearth.postsales.webhook.repository.WebhookEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WebhookServiceImpl implements WebhookService {

    private static final Logger log = LoggerFactory.getLogger(WebhookServiceImpl.class);

    private final WebhookEventRepository repository;
    private final WebhookEventMapper mapper;
    private final ApplicationEventPublisher eventPublisher;

    public WebhookServiceImpl(
            WebhookEventRepository repository,
            WebhookEventMapper mapper,
            ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.mapper = mapper;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional(readOnly = true)
    public List<WebhookEventDto> listEvents(int page, int size) {
        return repository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WebhookEventDto getEventDetail(UUID id) {
        WebhookEvent event = repository.findById(id)
                .orElseThrow(() -> new CustomException("Webhook event not found", HttpStatus.NOT_FOUND));
        return mapper.toDto(event);
    }

    @Override
    @Transactional
    public void replayEvent(UUID id) {
        WebhookEvent event = repository.findById(id)
                .orElseThrow(() -> new CustomException("Webhook event not found", HttpStatus.NOT_FOUND));

        event.setStatus(WebhookStatus.RECEIVED);
        event.setRetryCount(0);
        event.setErrorMessage(null);
        event.setProcessedAt(null);
        event.setProcessingDurationMs(null);
        
        WebhookEvent saved = repository.save(event);
        log.info("Replaying Webhook Event. Provider: {}, ID: {}", saved.getProvider(), saved.getId());

        // Publish Spring Event to trigger async reprocessing
        eventPublisher.publishEvent(new ZohoWebhookEvents.WebhookReceivedEvent(saved.getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public WebhookStatisticsDto getStatistics() {
        long pending = repository.countPendingQueue();
        long retry = repository.countRetryQueue();
        
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long processedToday = repository.countProcessedToday(startOfDay);
        long failedToday = repository.countFailedToday(startOfDay);

        Double avgTime = repository.getAverageProcessingTimeMs();
        double averageProcessingTimeMs = avgTime != null ? avgTime : 0.0;

        Optional<WebhookEvent> oldest = repository.findFirstByStatusInOrderByCreatedAtAsc(
                Arrays.asList(WebhookStatus.RECEIVED, WebhookStatus.RETRYING)
        );
        LocalDateTime oldestPendingCreatedAt = oldest.map(WebhookEvent::getCreatedAt).orElse(null);

        return new WebhookStatisticsDto(
                pending,
                retry,
                processedToday,
                failedToday,
                "ACTIVE",
                oldestPendingCreatedAt,
                averageProcessingTimeMs
        );
    }

    @Override
    @Transactional
    public WebhookEvent saveReceivedEvent(String eventId, String provider, String eventType, String rawPayload) {
        WebhookProvider webhookProvider = WebhookProvider.valueOf(provider.toUpperCase());

        // 1. Idempotency check: by provider + event_id
        Optional<WebhookEvent> existingOpt = repository.findByProviderAndEventId(webhookProvider, eventId);
        if (existingOpt.isPresent()) {
            log.info("Duplicate event ignored by Provider/EventId idempotency check. Provider: {}, Event ID: {}", provider, eventId);
            return existingOpt.get();
        }

        // 2. Hash payload and check if duplicate
        String hash = hashPayload(rawPayload);
        Optional<WebhookEvent> hashOpt = repository.findByPayloadHash(hash);
        if (hashOpt.isPresent()) {
            log.info("Duplicate event ignored by Payload Hash idempotency check. Provider: {}, Hash: {}", provider, hash);
            return hashOpt.get();
        }

        // 3. Save fresh event
        WebhookEvent event = new WebhookEvent();
        event.setEventId(eventId);
        event.setProvider(webhookProvider);
        event.setEventType(eventType);
        event.setPayloadHash(hash);
        event.setPayload(rawPayload);
        event.setStatus(WebhookStatus.RECEIVED);

        WebhookEvent saved = repository.save(event);
        log.info("Saved fresh webhook event. Provider: {}, Event ID: {}, Correlation ID: {}", 
                provider, eventId, saved.getCorrelationId());

        return saved;
    }

    private String hashPayload(String payload) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedHash.length);
            for (byte b : encodedHash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }
}
