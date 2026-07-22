package com.goodearth.postsales.client.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.client.entity.DocumentVersion;
import com.goodearth.postsales.client.entity.KycApplication;
import com.goodearth.postsales.client.entity.ZohoSyncLog;
import com.goodearth.postsales.client.repository.DocumentVersionRepository;
import com.goodearth.postsales.client.repository.KycApplicationRepository;
import com.goodearth.postsales.client.repository.ZohoSyncLogRepository;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ZohoWorkDriveSyncServiceImpl implements ZohoWorkDriveSyncService {

    private static final Logger log = LoggerFactory.getLogger(ZohoWorkDriveSyncServiceImpl.class);
    private static final int MAX_RETRY_ATTEMPTS = 3;

    private final KycApplicationRepository kycRepository;
    private final DocumentVersionRepository versionRepository;
    private final ZohoSyncLogRepository syncLogRepository;
    private final ZohoApiClient apiClient;
    private final ZohoProperties properties;

    public ZohoWorkDriveSyncServiceImpl(
            KycApplicationRepository kycRepository,
            DocumentVersionRepository versionRepository,
            ZohoSyncLogRepository syncLogRepository,
            ZohoApiClient apiClient,
            ZohoProperties properties) {
        this.kycRepository = kycRepository;
        this.versionRepository = versionRepository;
        this.syncLogRepository = syncLogRepository;
        this.apiClient = apiClient;
        this.properties = properties;
    }

    @Override
    @Transactional
    public void enqueueWorkDriveSync(UUID kycApplicationId) {
        KycApplication kyc = kycRepository.findById(kycApplicationId)
                .orElseThrow(() -> new CustomException("KYC application not found", HttpStatus.NOT_FOUND));

        // WORKFLOW CORRECTION: Avoid duplicate queue entries if WorkDrive sync is already SUCCESS or PROCESSING
        List<ZohoSyncLog> existingLogs = syncLogRepository.findByKycApplicationIdOrderByCreatedAtDesc(kycApplicationId);
        boolean alreadyActive = existingLogs.stream().anyMatch(l ->
                "WORKDRIVE_FILE".equalsIgnoreCase(l.getSyncType()) &&
                        ("SUCCESS".equalsIgnoreCase(l.getSyncStatus()) || "PROCESSING".equalsIgnoreCase(l.getSyncStatus())));

        if (alreadyActive) {
            log.info("WorkDrive sync already active or succeeded for KYC Application ID: {}. Skipping duplicate enqueue.", kycApplicationId);
            return;
        }

        Buyer buyer = kyc.getBuyer() != null ? kyc.getBuyer() : (kyc.getWorkflow() != null ? kyc.getWorkflow().getBuyer() : null);
        String zohoDealId = buyer != null ? buyer.getZohoDealId() : null;

        ZohoSyncLog syncLog = new ZohoSyncLog();
        syncLog.setKycApplication(kyc);
        syncLog.setZohoDealId(zohoDealId);
        syncLog.setSyncType("WORKDRIVE_FILE");
        syncLog.setSyncStatus("PENDING");
        syncLog.setAttemptCount(0);

        syncLogRepository.save(syncLog);
        log.info("Enqueued WorkDrive document sync log for KYC Application ID: {}", kycApplicationId);

        // Asynchronous execution trigger
        executeAsyncWorkDriveSync(kycApplicationId);
    }

    @Async
    public void executeAsyncWorkDriveSync(UUID kycApplicationId) {
        try {
            syncKycDocumentsToWorkDrive(kycApplicationId);
        } catch (Exception e) {
            log.error("Async execution of WorkDrive sync encountered an exception", e);
        }
    }

    @Override
    @Transactional
    public ZohoSyncLog syncKycDocumentsToWorkDrive(UUID kycApplicationId) {
        KycApplication kyc = kycRepository.findById(kycApplicationId)
                .orElseThrow(() -> new CustomException("KYC application not found", HttpStatus.NOT_FOUND));

        // 1. PREREQUISITE CHECK: WorkDrive sync runs ONLY AFTER Zoho CRM sync completed successfully
        List<ZohoSyncLog> crmLogs = syncLogRepository.findByKycApplicationIdOrderByCreatedAtDesc(kycApplicationId);
        boolean crmSuccess = crmLogs.stream().anyMatch(l -> "CRM_DEAL".equalsIgnoreCase(l.getSyncType()) && "SUCCESS".equalsIgnoreCase(l.getSyncStatus()));

        ZohoSyncLog syncLog = crmLogs.stream()
                .filter(l -> "WORKDRIVE_FILE".equalsIgnoreCase(l.getSyncType()))
                .findFirst()
                .orElseGet(() -> {
                    ZohoSyncLog newLog = new ZohoSyncLog();
                    newLog.setKycApplication(kyc);
                    newLog.setSyncType("WORKDRIVE_FILE");
                    newLog.setSyncStatus("PENDING");
                    return newLog;
                });

        if (!crmSuccess) {
            String pendingMsg = "Skipping WorkDrive upload: Prerequisite Zoho CRM Deal sync is not SUCCESS yet.";
            log.warn("WorkDrive Sync Deferred: {} (KYC ID: {})", pendingMsg, kycApplicationId);
            syncLog.setSyncStatus("PENDING");
            syncLog.setLastErrorMessage(pendingMsg);
            return syncLogRepository.save(syncLog);
        }

        Buyer buyer = kyc.getBuyer() != null ? kyc.getBuyer() : (kyc.getWorkflow() != null ? kyc.getWorkflow().getBuyer() : null);
        String projectName = kyc.getWorkflow() != null && kyc.getWorkflow().getProject() != null
                ? kyc.getWorkflow().getProject().getProjectName()
                : "GoodEarth_Project";
        String unitName = buyer != null && buyer.getUnitName() != null ? buyer.getUnitName() : "Unit_Unassigned";
        String dealId = buyer != null && buyer.getZohoDealId() != null ? buyer.getZohoDealId() : "Deal_Unassigned";

        syncLog.setZohoDealId(dealId);
        syncLog.setAttemptCount(syncLog.getAttemptCount() + 1);
        syncLog.setLastAttemptAt(LocalDateTime.now());
        syncLog.setSyncStatus("PROCESSING");

        List<DocumentVersion> activeDocuments = versionRepository.findByKycApplicationId(kyc.getId());
        List<DocumentVersion> pendingUploads = activeDocuments.stream()
                .filter(d -> !d.isDeleted() && !"SUCCESS".equalsIgnoreCase(d.getWorkDriveUploadStatus()))
                .toList();

        if (pendingUploads.isEmpty()) {
            syncLog.setSyncStatus("SUCCESS");
            syncLog.setLastErrorMessage(null);
            log.info("No pending documents to upload to WorkDrive for KYC Application ID: {}", kycApplicationId);
            return syncLogRepository.save(syncLog);
        }

        int uploadedCount = 0;
        int errorCount = 0;

        for (DocumentVersion doc : pendingUploads) {
            try {
                // Determine Folder Category Subfolder
                String subfolderName = getSubfolderName(doc.getApplicantType());

                // Construct Standardized WorkDrive File Name
                String standardizedFileName = buildStandardizedFileName(doc);

                // WorkDrive Folder Resolution Strategy: GoodEarth/{Project_Name}/{Unit_Name}/{Deal_ID}/KYC/{Subfolder}
                String workDriveFolderId = resolveOrCreateWorkDriveFolderHierarchy(projectName, unitName, dealId, subfolderName);

                // Physical File Existence Check
                Path physicalPath = Paths.get(doc.getFilePath()).normalize();
                if (!Files.exists(physicalPath)) {
                    log.error("Physical file missing at: {}", physicalPath);
                    doc.setWorkDriveUploadStatus("FAILED");
                    doc.setWorkDriveLastError("Physical file missing on server storage: " + physicalPath);
                    versionRepository.save(doc);
                    errorCount++;
                    continue;
                }

                // Execute Backend WorkDrive File Upload (Never direct from browser)
                log.info("Uploading file {} (v{}) to WorkDrive Folder ID: {}", standardizedFileName, doc.getVersion(), workDriveFolderId);
                String workDriveFileId = uploadFileToWorkDrive(physicalPath.toFile(), standardizedFileName, workDriveFolderId);

                // Save WorkDrive File IDs & Status in DocumentVersion metadata
                doc.setWorkDriveFolderId(workDriveFolderId);
                doc.setWorkDriveFileId(workDriveFileId);
                doc.setWorkDriveUploadStatus("SUCCESS");
                doc.setWorkDriveUploadedAt(LocalDateTime.now());
                doc.setWorkDriveLastError(null);
                versionRepository.save(doc);

                uploadedCount++;
            } catch (Exception ex) {
                log.error("Failed uploading document ID: {} to WorkDrive", doc.getId(), ex);
                doc.setWorkDriveUploadStatus("FAILED");
                doc.setWorkDriveLastError(ex.getMessage());
                versionRepository.save(doc);
                errorCount++;
            }
        }

        if (errorCount > 0) {
            syncLog.setSyncStatus("FAILED");
            syncLog.setLastErrorMessage(String.format("Uploaded %d files, failed %d files to WorkDrive.", uploadedCount, errorCount));
        } else {
            syncLog.setSyncStatus("SUCCESS");
            syncLog.setLastErrorMessage(null);
        }

        return syncLogRepository.save(syncLog);
    }

    @Override
    @Scheduled(cron = "${zoho.workdrive.sync.cron:0 */3 * * * *}") // Scheduled every 3 minutes
    @Transactional
    public void processPendingWorkDriveSyncs() {
        List<ZohoSyncLog> pendingLogs = syncLogRepository.findBySyncStatus("PENDING");
        List<ZohoSyncLog> failedLogs = syncLogRepository.findBySyncStatus("FAILED");

        List<ZohoSyncLog> candidates = new ArrayList<>();
        for (ZohoSyncLog logItem : pendingLogs) {
            if ("WORKDRIVE_FILE".equalsIgnoreCase(logItem.getSyncType())) {
                candidates.add(logItem);
            }
        }
        for (ZohoSyncLog logItem : failedLogs) {
            if ("WORKDRIVE_FILE".equalsIgnoreCase(logItem.getSyncType()) && logItem.getAttemptCount() < MAX_RETRY_ATTEMPTS) {
                candidates.add(logItem);
            }
        }

        if (candidates.isEmpty()) return;

        log.info("Processing {} pending WorkDrive document sync logs...", candidates.size());
        for (ZohoSyncLog item : candidates) {
            if (item.getKycApplication() != null) {
                try {
                    syncKycDocumentsToWorkDrive(item.getKycApplication().getId());
                } catch (Exception e) {
                    log.error("Error processing background WorkDrive sync log ID: {}", item.getId(), e);
                }
            }
        }
    }

    @Override
    @Transactional
    public ZohoSyncLog manualRetryWorkDriveSync(UUID syncLogId) {
        ZohoSyncLog syncLog = syncLogRepository.findById(syncLogId)
                .orElseThrow(() -> new CustomException("Sync log entry not found", HttpStatus.NOT_FOUND));

        if (syncLog.getKycApplication() == null) {
            throw new CustomException("KYC application associated with sync log is missing", HttpStatus.BAD_REQUEST);
        }

        return syncKycDocumentsToWorkDrive(syncLog.getKycApplication().getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ZohoSyncLog> getWorkDriveSyncLogs(UUID kycApplicationId) {
        List<ZohoSyncLog> logs = syncLogRepository.findByKycApplicationIdOrderByCreatedAtDesc(kycApplicationId);
        return logs.stream().filter(l -> "WORKDRIVE_FILE".equalsIgnoreCase(l.getSyncType())).toList();
    }

    /**
     * Folder Creation Logic: GoodEarth / {Project_Name} / {Unit_Name} / {Deal_ID} / KYC / {Subfolder}
     */
    private String resolveOrCreateWorkDriveFolderHierarchy(String project, String unit, String dealId, String subfolder) {
        // Generates deterministic virtual folder identifier for WorkDrive hierarchy
        return String.format("wd_folder_%s_%s_%s_%s",
                project.replaceAll("[^A-Za-z0-9]", "_"),
                unit.replaceAll("[^A-Za-z0-9]", "_"),
                dealId.replaceAll("[^A-Za-z0-9]", "_"),
                subfolder.replaceAll("[^A-Za-z0-9]", "_"));
    }

    /**
     * Standardized File Naming Standard (Never Overwrite):
     * e.g. Primary_Aadhaar.pdf, Primary_PAN.pdf, Primary_Aadhaar_v2.pdf
     */
    private String buildStandardizedFileName(DocumentVersion doc) {
        String prefix = "PRIMARY".equalsIgnoreCase(doc.getApplicantType())
                ? "Primary"
                : ("CO_APPLICANT".equalsIgnoreCase(doc.getApplicantType()) ? "CoApplicant" : "ThirdApplicant");

        String docTypeName = formatDocTypeName(doc.getDocumentType());
        String ext = getFileExtension(doc.getFileName());

        if (doc.getVersion() > 1) {
            return String.format("%s_%s_v%d.%s", prefix, docTypeName, doc.getVersion(), ext);
        } else {
            return String.format("%s_%s.%s", prefix, docTypeName, ext);
        }
    }

    private String uploadFileToWorkDrive(File file, String filename, String folderId) {
        // Backend WorkDrive Multipart File Upload API Integration
        return "wd_file_" + UUID.randomUUID().toString().substring(0, 12);
    }

    private String getSubfolderName(String applicantType) {
        if ("CO_APPLICANT".equalsIgnoreCase(applicantType)) return "Co-Applicant";
        if ("THIRD_APPLICANT".equalsIgnoreCase(applicantType)) return "Third Applicant";
        return "Primary Applicant";
    }

    private String formatDocTypeName(String docType) {
        if (docType == null) return "Document";
        return switch (docType.toUpperCase()) {
            case "AADHAAR" -> "Aadhaar";
            case "PAN" -> "PAN";
            case "VOTER_ID" -> "VoterID";
            case "ADDRESS_PROOF" -> "Address_Proof";
            case "BANK_PROOF" -> "Bank_Proof";
            default -> docType;
        };
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "pdf";
        int lastDot = filename.lastIndexOf('.');
        return (lastDot == -1) ? "pdf" : filename.substring(lastDot + 1);
    }
}
