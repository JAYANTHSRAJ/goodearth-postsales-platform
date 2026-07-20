package com.goodearth.postsales.buyer.scheduler;

import com.goodearth.postsales.buyer.service.ZohoBuyerSyncService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@ConditionalOnProperty(name = "zoho.sync.enabled", havingValue = "true", matchIfMissing = true)
public class ZohoBuyerSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(ZohoBuyerSyncScheduler.class);

    private final ZohoBuyerSyncService syncService;

    public ZohoBuyerSyncScheduler(ZohoBuyerSyncService syncService) {
        this.syncService = syncService;
    }

    @Scheduled(cron = "${zoho.sync.cron:0 */15 * * * *}")
    public void scheduleSync() {
        log.info("Starting scheduled Zoho buyer synchronization...");
        try {
            Map<String, Object> result = syncService.syncBuyers();
            
            @SuppressWarnings("unchecked")
            Map<String, Object> summary = (Map<String, Object>) result.get("summary");
            if (summary != null) {
                log.info("Fetched {} deals", summary.get("dealsFetched"));
                log.info("Created {} buyers", summary.get("buyersCreated"));
                log.info("Updated {} buyers", summary.get("buyersUpdated"));
            }
            log.info("Zoho synchronization completed successfully.");
        } catch (Exception e) {
            log.error("Error occurred during scheduled Zoho buyer synchronization. Will retry during next scheduled run.", e);
        }
    }
}
