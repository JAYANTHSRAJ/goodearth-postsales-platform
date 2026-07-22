package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.entity.ZohoSyncLog;

import java.util.List;
import java.util.UUID;

public interface ZohoWorkDriveSyncService {

    /**
     * Enqueues a WorkDrive document sync job for a submitted KYC application.
     */
    void enqueueWorkDriveSync(UUID kycApplicationId);

    /**
     * Executes WorkDrive folder hierarchy creation and document uploading ONLY IF CRM sync was successful.
     */
    ZohoSyncLog syncKycDocumentsToWorkDrive(UUID kycApplicationId);

    /**
     * Scheduled background worker to process pending WorkDrive sync jobs.
     */
    void processPendingWorkDriveSyncs();

    /**
     * Manual administrative retry trigger for WorkDrive sync logs.
     */
    ZohoSyncLog manualRetryWorkDriveSync(UUID syncLogId);

    /**
     * List WorkDrive sync logs for a KYC application.
     */
    List<ZohoSyncLog> getWorkDriveSyncLogs(UUID kycApplicationId);
}
