package com.goodearth.postsales.client.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.client.dto.KycDraftDto;
import com.goodearth.postsales.client.entity.KycApplication;
import com.goodearth.postsales.client.entity.ZohoSyncLog;
import com.goodearth.postsales.client.repository.KycApplicationRepository;
import com.goodearth.postsales.client.repository.ZohoSyncLogRepository;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ZohoCrmSyncServiceImpl implements ZohoCrmSyncService {

    private static final Logger log = LoggerFactory.getLogger(ZohoCrmSyncServiceImpl.class);
    private static final int MAX_RETRY_ATTEMPTS = 3;

    private final KycApplicationRepository kycRepository;
    private final ZohoSyncLogRepository syncLogRepository;
    private final ZohoApiClient apiClient;
    private final ZohoProperties properties;
    private final ZohoWorkDriveSyncService workDriveSyncService;
    private final ObjectMapper objectMapper;

    public ZohoCrmSyncServiceImpl(
            KycApplicationRepository kycRepository,
            ZohoSyncLogRepository syncLogRepository,
            ZohoApiClient apiClient,
            ZohoProperties properties,
            @Lazy ZohoWorkDriveSyncService workDriveSyncService,
            ObjectMapper objectMapper) {
        this.kycRepository = kycRepository;
        this.syncLogRepository = syncLogRepository;
        this.apiClient = apiClient;
        this.properties = properties;
        this.workDriveSyncService = workDriveSyncService;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void enqueueKycSync(UUID kycApplicationId) {
        KycApplication kyc = kycRepository.findById(kycApplicationId)
                .orElseThrow(() -> new CustomException("KYC application not found", HttpStatus.NOT_FOUND));

        Buyer buyer = kyc.getBuyer() != null ? kyc.getBuyer() : (kyc.getWorkflow() != null ? kyc.getWorkflow().getBuyer() : null);
        String zohoDealId = buyer != null ? buyer.getZohoDealId() : null;

        ZohoSyncLog syncLog = new ZohoSyncLog();
        syncLog.setKycApplication(kyc);
        syncLog.setZohoDealId(zohoDealId);
        syncLog.setSyncType("CRM_DEAL");
        syncLog.setSyncStatus("PENDING");
        syncLog.setAttemptCount(0);
        syncLog.setPayload(kyc.getDraftData());

        syncLogRepository.save(syncLog);
        log.info("Enqueued KYC sync log for KYC Application ID: {}, Zoho Deal ID: {}", kycApplicationId, zohoDealId);

        // Async execution trigger
        executeAsyncSync(kycApplicationId);
    }

    @Async
    public void executeAsyncSync(UUID kycApplicationId) {
        try {
            syncKycToZohoDeal(kycApplicationId);
        } catch (Exception e) {
            log.error("Async execution of KYC Zoho sync encountered an exception", e);
        }
    }

    @Override
    @Transactional
    public ZohoSyncLog syncKycToZohoDeal(UUID kycApplicationId) {
        KycApplication kyc = kycRepository.findById(kycApplicationId)
                .orElseThrow(() -> new CustomException("KYC application not found", HttpStatus.NOT_FOUND));

        ZohoSyncLog syncLog = syncLogRepository.findFirstByKycApplicationIdOrderByCreatedAtDesc(kycApplicationId)
                .orElseGet(() -> {
                    ZohoSyncLog newLog = new ZohoSyncLog();
                    newLog.setKycApplication(kyc);
                    newLog.setSyncType("CRM_DEAL");
                    newLog.setSyncStatus("PENDING");
                    return newLog;
                });

        Buyer buyer = kyc.getBuyer() != null ? kyc.getBuyer() : (kyc.getWorkflow() != null ? kyc.getWorkflow().getBuyer() : null);
        String zohoDealId = buyer != null ? buyer.getZohoDealId() : null;

        syncLog.setZohoDealId(zohoDealId);
        syncLog.setAttemptCount(syncLog.getAttemptCount() + 1);
        syncLog.setLastAttemptAt(LocalDateTime.now());
        syncLog.setSyncStatus("PROCESSING");

        // CRITICAL SPEC REQUIREMENT: If zoho_deal_id is missing, mark as FAILED and NEVER attempt to create a Deal
        if (zohoDealId == null || zohoDealId.trim().isEmpty()) {
            String errMsg = "Missing zoho_deal_id on buyer entity; Deal creation disabled by spec.";
            log.error("KYC Sync Aborted: {} (KYC ID: {})", errMsg, kycApplicationId);
            syncLog.setSyncStatus("FAILED");
            syncLog.setLastErrorMessage(errMsg);
            return syncLogRepository.save(syncLog);
        }

        // Map KYC Data to Zoho Deal Payload
        Map<String, Object> dealFieldsMap = buildZohoDealPayloadMap(kyc);

        try {
            String requestJson = objectMapper.writeValueAsString(Collections.singletonMap("data", Collections.singletonList(dealFieldsMap)));
            syncLog.setPayload(requestJson);

            log.info("Executing PUT /crm/v3/Deals/{} for KYC Application ID: {}", zohoDealId, kycApplicationId);

            // Call Zoho CRM PUT API: PUT /crm/v3/Deals/{zoho_deal_id}
            String url = properties.getCrmApiUrl() + "/crm/v3/Deals/" + zohoDealId;
            String responseBody = apiClient.put(url, Collections.singletonMap("data", Collections.singletonList(dealFieldsMap)), String.class);

            syncLog.setResponseSnapshot(responseBody);
            syncLog.setSyncStatus("SUCCESS");
            syncLog.setLastErrorMessage(null);
            log.info("Successfully synchronized KYC details to Zoho Deal ID: {}", zohoDealId);

            // WORKFLOW CORRECTION: Upon CRM SUCCESS, trigger WorkDrive document sync enqueue!
            try {
                workDriveSyncService.enqueueWorkDriveSync(kycApplicationId);
            } catch (Exception e) {
                log.error("Failed to enqueue WorkDrive sync after CRM SUCCESS for KYC ID: {}", kycApplicationId, e);
            }

        } catch (Exception ex) {
            log.error("Failed to update Zoho Deal ID: {}", zohoDealId, ex);
            syncLog.setSyncStatus("FAILED");
            syncLog.setLastErrorMessage(ex.getMessage());
        }

        return syncLogRepository.save(syncLog);
    }

    @Override
    @Scheduled(cron = "${zoho.kyc.sync.cron:0 */2 * * * *}") // Scheduled every 2 minutes
    @Transactional
    public void processPendingSyncs() {
        List<ZohoSyncLog> pendingLogs = syncLogRepository.findBySyncStatus("PENDING");
        List<ZohoSyncLog> failedLogs = syncLogRepository.findBySyncStatus("FAILED");

        List<ZohoSyncLog> candidates = new ArrayList<>();
        candidates.addAll(pendingLogs);

        // Include transient failure retries (attemptCount < MAX_RETRY_ATTEMPTS)
        for (ZohoSyncLog failed : failedLogs) {
            if (failed.getAttemptCount() < MAX_RETRY_ATTEMPTS && failed.getZohoDealId() != null) {
                candidates.add(failed);
            }
        }

        if (candidates.isEmpty()) return;

        log.info("Processing {} pending/retryable KYC sync logs...", candidates.size());
        for (ZohoSyncLog logItem : candidates) {
            if (logItem.getKycApplication() != null) {
                try {
                    syncKycToZohoDeal(logItem.getKycApplication().getId());
                } catch (Exception e) {
                    log.error("Failed executing background retry for Sync Log ID: {}", logItem.getId(), e);
                }
            }
        }
    }

    @Override
    @Transactional
    public ZohoSyncLog manualRetrySync(UUID syncLogId) {
        ZohoSyncLog syncLog = syncLogRepository.findById(syncLogId)
                .orElseThrow(() -> new CustomException("Sync log entry not found", HttpStatus.NOT_FOUND));

        if (syncLog.getKycApplication() == null) {
            throw new CustomException("KYC application associated with sync log is missing", HttpStatus.BAD_REQUEST);
        }

        return syncKycToZohoDeal(syncLog.getKycApplication().getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ZohoSyncLog> getSyncLogs(UUID kycApplicationId) {
        return syncLogRepository.findByKycApplicationIdOrderByCreatedAtDesc(kycApplicationId);
    }

    /**
     * Map supported KYC fields to approved Zoho CRM Deal API Field Names
     */
    private Map<String, Object> buildZohoDealPayloadMap(KycApplication kyc) {
        Map<String, Object> fields = new HashMap<>();

        if (kyc.getDraftData() != null && !kyc.getDraftData().trim().isEmpty()) {
            try {
                KycDraftDto form = objectMapper.readValue(kyc.getDraftData(), KycDraftDto.class);

                // Primary Applicant Mapping
                if (form.getPrimaryApplicant() != null) {
                    var p = form.getPrimaryApplicant();
                    if (p.getFirstName() != null) fields.put("First_Name", p.getFirstName());
                    if (p.getLastName() != null) fields.put("Last_Name", p.getLastName());
                    if (p.getEmail() != null) fields.put("Email", p.getEmail());
                    if (p.getPhoneNumber() != null) fields.put("Phone", p.getPhoneNumber());
                    if (p.getDob() != null) fields.put("Date_of_Birth", p.getDob());
                    if (p.getOccupation() != null) fields.put("Occupation", p.getOccupation());
                    if (p.getPanNo() != null) fields.put("PAN_Number", p.getPanNo());
                    if (p.getAadhaarNo() != null) fields.put("Aadhaar_Number", p.getAadhaarNo());

                    if (p.getAddress() != null) {
                        var addr = p.getAddress();
                        if (addr.getAddressLine1() != null) fields.put("Address", addr.getAddressLine1());
                        if (addr.getCity() != null) fields.put("City", addr.getCity());
                        if (addr.getState() != null) fields.put("State", addr.getState());
                        if (addr.getCountry() != null) fields.put("Country", addr.getCountry());
                        if (addr.getPostalCode() != null) fields.put("Postal_Code", addr.getPostalCode());
                    }
                }

                // Co-Applicant Mapping
                if ("Yes".equalsIgnoreCase(form.getHasCoApplicant()) && form.getCoApplicant() != null) {
                    var co = form.getCoApplicant();
                    if (co.getFirstName() != null) fields.put("Co_Applicant_First_Name", co.getFirstName());
                    if (co.getLastName() != null) fields.put("Co_Applicant_Last_Name", co.getLastName());
                    if (co.getEmail() != null) fields.put("Co_Applicant_Email", co.getEmail());
                    if (co.getPhoneNumber() != null) fields.put("Co_Applicant_Phone", co.getPhoneNumber());
                    if (co.getPanNo() != null) fields.put("Co_Applicant_PAN", co.getPanNo());
                    if (co.getAadhaarNo() != null) fields.put("Co_Applicant_Aadhaar", co.getAadhaarNo());
                }

                // Third Applicant Mapping
                if ("Yes".equalsIgnoreCase(form.getHasThirdApplicant()) && form.getThirdApplicant() != null) {
                    var th = form.getThirdApplicant();
                    if (th.getFirstName() != null) fields.put("Third_Applicant_First_Name", th.getFirstName());
                    if (th.getLastName() != null) fields.put("Third_Applicant_Last_Name", th.getLastName());
                    if (th.getEmail() != null) fields.put("Third_Applicant_Email", th.getEmail());
                    if (th.getPhoneNumber() != null) fields.put("Third_Applicant_Phone", th.getPhoneNumber());
                }

                // Loan & Banking Details
                if (form.getHomeLoanRequired() != null) fields.put("Home_Loan_Required", form.getHomeLoanRequired());
                if (form.getBankName() != null) fields.put("Bank_Name", form.getBankName());
                if (form.getBankAccountNumber() != null) fields.put("Bank_Account_Number", form.getBankAccountNumber());
                if (form.getBankIfsc() != null) fields.put("Bank_IFSC", form.getBankIfsc());

            } catch (JsonProcessingException e) {
                log.error("Failed to parse KYC draft data for Zoho CRM payload mapping", e);
            }
        }

        return fields;
    }
}
