package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.entity.ZohoSyncLog;

import java.util.List;
import java.util.UUID;

public interface ZohoCrmSyncService {

    /**
     * Enqueues a sync log entry for an executed KYC submission.
     */
    void enqueueKycSync(UUID kycApplicationId);

    /**
     * Executes asynchronous CRM synchronization for a specific KYC application.
     */
    ZohoSyncLog syncKycToZohoDeal(UUID kycApplicationId);

    /**
     * Background worker scheduled method to pick up PENDING sync logs and retry transient failures.
     */
    void processPendingSyncs();

    /**
     * Administrative trigger to manually retry a sync log entry.
     */
    ZohoSyncLog manualRetrySync(UUID syncLogId);

    /**
     * Fetch sync logs for monitoring.
     */
    List<ZohoSyncLog> getSyncLogs(UUID kycApplicationId);
}
