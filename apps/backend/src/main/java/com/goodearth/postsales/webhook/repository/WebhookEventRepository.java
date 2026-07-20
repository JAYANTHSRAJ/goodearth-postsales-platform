package com.goodearth.postsales.webhook.repository;

import com.goodearth.postsales.webhook.entity.WebhookEvent;
import com.goodearth.postsales.webhook.entity.WebhookStatus;
import com.goodearth.postsales.webhook.entity.WebhookProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebhookEventRepository extends JpaRepository<WebhookEvent, UUID> {
    Optional<WebhookEvent> findByProviderAndEventId(WebhookProvider provider, String eventId);
    Optional<WebhookEvent> findByPayloadHash(String payloadHash);
    List<WebhookEvent> findByStatusAndNextRetryAtBefore(WebhookStatus status, LocalDateTime dateTime);

    @Query("SELECT COUNT(w) FROM WebhookEvent w WHERE w.status = 'RECEIVED' OR w.status = 'RETRYING'")
    long countPendingQueue();

    @Query("SELECT COUNT(w) FROM WebhookEvent w WHERE w.status = 'RETRYING'")
    long countRetryQueue();

    @Query("SELECT COUNT(w) FROM WebhookEvent w WHERE w.status = 'PROCESSED' AND w.processedAt >= :startOfDay")
    long countProcessedToday(LocalDateTime startOfDay);

    @Query("SELECT COUNT(w) FROM WebhookEvent w WHERE w.status = 'FAILED' AND w.updatedAt >= :startOfDay")
    long countFailedToday(LocalDateTime startOfDay);

    @Query("SELECT AVG(w.processingDurationMs) FROM WebhookEvent w WHERE w.status = 'PROCESSED'")
    Double getAverageProcessingTimeMs();

    Optional<WebhookEvent> findFirstByStatusInOrderByCreatedAtAsc(List<WebhookStatus> statuses);
}
