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

    long countByStatusIn(List<WebhookStatus> statuses);
    long countByStatus(WebhookStatus status);
    long countByStatusAndProcessedAtGreaterThanEqual(WebhookStatus status, LocalDateTime startOfDay);
    long countByStatusAndUpdatedAtGreaterThanEqual(WebhookStatus status, LocalDateTime startOfDay);

    default long countPendingQueue() {
        return countByStatusIn(List.of(WebhookStatus.RECEIVED, WebhookStatus.RETRYING));
    }

    default long countRetryQueue() {
        return countByStatus(WebhookStatus.RETRYING);
    }

    default long countProcessedToday(LocalDateTime startOfDay) {
        return countByStatusAndProcessedAtGreaterThanEqual(WebhookStatus.PROCESSED, startOfDay);
    }

    default long countFailedToday(LocalDateTime startOfDay) {
        return countByStatusAndUpdatedAtGreaterThanEqual(WebhookStatus.FAILED, startOfDay);
    }

    @Query("SELECT AVG(w.processingDurationMs) FROM WebhookEvent w WHERE w.status = com.goodearth.postsales.webhook.entity.WebhookStatus.PROCESSED")
    Double getAverageProcessingTimeMs();

    Optional<WebhookEvent> findFirstByStatusInOrderByCreatedAtAsc(List<WebhookStatus> statuses);
}
