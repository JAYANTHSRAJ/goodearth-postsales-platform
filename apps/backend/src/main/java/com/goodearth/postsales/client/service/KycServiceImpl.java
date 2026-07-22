package com.goodearth.postsales.client.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.client.dto.*;
import com.goodearth.postsales.client.entity.*;
import com.goodearth.postsales.client.repository.*;
import com.goodearth.postsales.client.validation.KycValidator;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class KycServiceImpl implements KycService {

    private static final Logger log = LoggerFactory.getLogger(KycServiceImpl.class);

    private final KycApplicationRepository kycRepository;
    private final KycAuditLogRepository auditLogRepository;
    private final KycModificationRequestRepository modificationRequestRepository;
    private final UserRepository userRepository;
    private final BuyerRepository buyerRepository;
    private final WorkflowRepository workflowRepository;
    private final KycValidator kycValidator;
    private final ZohoCrmSyncService zohoCrmSyncService;
    private final ObjectMapper objectMapper;

    public KycServiceImpl(
            KycApplicationRepository kycRepository,
            KycAuditLogRepository auditLogRepository,
            KycModificationRequestRepository modificationRequestRepository,
            UserRepository userRepository,
            BuyerRepository buyerRepository,
            WorkflowRepository workflowRepository,
            KycValidator kycValidator,
            ZohoCrmSyncService zohoCrmSyncService,
            ObjectMapper objectMapper) {
        this.kycRepository = kycRepository;
        this.auditLogRepository = auditLogRepository;
        this.modificationRequestRepository = modificationRequestRepository;
        this.userRepository = userRepository;
        this.buyerRepository = buyerRepository;
        this.workflowRepository = workflowRepository;
        this.kycValidator = kycValidator;
        this.zohoCrmSyncService = zohoCrmSyncService;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public KycDraftDto saveDraft(UUID userId, KycDraftDto draftDto) {
        if (draftDto.getWorkflowId() == null) {
            throw new CustomException("Workflow ID is required to save a draft", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Workflow workflow = workflowRepository.findById(draftDto.getWorkflowId())
                .orElseThrow(() -> new CustomException("Workflow not found", HttpStatus.NOT_FOUND));

        KycApplication kyc = kycRepository.findByWorkflowId(workflow.getId())
                .orElseGet(() -> {
                    KycApplication newKyc = new KycApplication();
                    newKyc.setUser(user);
                    newKyc.setWorkflow(workflow);
                    if (workflow.getBuyer() != null) {
                        newKyc.setBuyer(workflow.getBuyer());
                    }
                    newKyc.setStatus("DRAFT");
                    return newKyc;
                });

        if (kyc.isLocked() && !"MODIFICATION_REQUESTED".equals(kyc.getStatus())) {
            throw new CustomException("KYC application is locked for editing", HttpStatus.FORBIDDEN);
        }

        try {
            String jsonStr = objectMapper.writeValueAsString(draftDto);
            kyc.setDraftData(jsonStr);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize KYC draft payload", e);
            throw new CustomException("Failed to process draft data payload", HttpStatus.BAD_REQUEST, e);
        }

        KycApplication saved = kycRepository.save(kyc);
        recordAudit(saved, user, "SAVE_DRAFT", kyc.getStatus(), kyc.getStatus(), saved.getDraftData());

        draftDto.setId(saved.getId());
        return draftDto;
    }

    @Override
    @Transactional
    public KycReviewSummaryDto submitKyc(UUID userId, SubmitKycRequestDto submitDto) {
        kycValidator.validateSubmitPayload(submitDto.getForm());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Workflow workflow = workflowRepository.findById(submitDto.getWorkflowId())
                .orElseThrow(() -> new CustomException("Workflow not found", HttpStatus.NOT_FOUND));

        KycApplication kyc = kycRepository.findByWorkflowId(workflow.getId())
                .orElseGet(() -> {
                    KycApplication newKyc = new KycApplication();
                    newKyc.setUser(user);
                    newKyc.setWorkflow(workflow);
                    if (workflow.getBuyer() != null) {
                        newKyc.setBuyer(workflow.getBuyer());
                    }
                    return newKyc;
                });

        String previousStatus = kyc.getStatus();
        kyc.setStatus("SUBMITTED");
        kyc.setLocked(true);
        kyc.setSubmittedAt(LocalDateTime.now());

        try {
            kyc.setDraftData(objectMapper.writeValueAsString(submitDto.getForm()));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize submit payload", e);
        }

        KycApplication saved = kycRepository.save(kyc);
        recordAudit(saved, user, "SUBMIT_KYC", previousStatus, "SUBMITTED", saved.getDraftData());

        // Trigger Phase 5 Asynchronous Background Zoho CRM Sync
        try {
            zohoCrmSyncService.enqueueKycSync(saved.getId());
        } catch (Exception e) {
            log.error("Failed to enqueue Zoho CRM sync for KYC Application ID: {}", saved.getId(), e);
        }

        return buildReviewSummary(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public KycReviewSummaryDto getKycByWorkflowId(UUID userId, UUID workflowId) {
        KycApplication kyc = kycRepository.findByWorkflowId(workflowId)
                .orElseThrow(() -> new CustomException("KYC application not found for this property unit", HttpStatus.NOT_FOUND));
        return buildReviewSummary(kyc);
    }

    @Override
    @Transactional(readOnly = true)
    public KycReviewSummaryDto getKycById(UUID userId, UUID kycId) {
        KycApplication kyc = kycRepository.findById(kycId)
                .orElseThrow(() -> new CustomException("KYC application not found", HttpStatus.NOT_FOUND));
        return buildReviewSummary(kyc);
    }

    @Override
    @Transactional(readOnly = true)
    public KycStatusResponseDto getKycStatus(UUID workflowId) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new CustomException("Workflow not found", HttpStatus.NOT_FOUND));

        KycStatusResponseDto statusDto = new KycStatusResponseDto();
        statusDto.setWorkflowId(workflowId);
        if (workflow.getBuyer() != null) {
            statusDto.setUnitName(workflow.getBuyer().getUnitName());
        }

        Optional<KycApplication> kycOpt = kycRepository.findByWorkflowId(workflowId);
        if (kycOpt.isPresent()) {
            KycApplication kyc = kycOpt.get();
            statusDto.setKycApplicationId(kyc.getId());
            statusDto.setStatus(kyc.getStatus());
            statusDto.setLocked(kyc.isLocked());
            statusDto.setVerified(kyc.isVerified());
            statusDto.setSubmittedAt(kyc.getSubmittedAt());
        } else {
            statusDto.setStatus("NOT_STARTED");
            statusDto.setLocked(false);
            statusDto.setVerified(false);
        }

        return statusDto;
    }

    @Override
    @Transactional
    public KycReviewSummaryDto adminReview(UUID adminUserId, UUID kycId, AdminReviewRequestDto reviewDto) {
        User adminUser = userRepository.findById(adminUserId)
                .orElseThrow(() -> new CustomException("Admin user not found", HttpStatus.NOT_FOUND));

        KycApplication kyc = kycRepository.findById(kycId)
                .orElseThrow(() -> new CustomException("KYC application not found", HttpStatus.NOT_FOUND));

        String previousStatus = kyc.getStatus();
        String action = reviewDto.getAction().toUpperCase();

        switch (action) {
            case "APPROVED":
                kyc.setStatus("APPROVED");
                kyc.setVerified(true);
                kyc.setLocked(true);
                break;
            case "REJECTED":
                kyc.setStatus("REJECTED");
                kyc.setVerified(false);
                kyc.setLocked(false);
                break;
            case "MODIFICATION_REQUESTED":
                kyc.setStatus("MODIFICATION_REQUESTED");
                kyc.setVerified(false);
                kyc.setLocked(false);
                break;
            default:
                throw new CustomException("Invalid review action. Must be APPROVED, REJECTED, or MODIFICATION_REQUESTED", HttpStatus.BAD_REQUEST);
        }

        kyc.setReviewedAt(LocalDateTime.now());
        KycApplication saved = kycRepository.save(kyc);

        recordAudit(saved, adminUser, "ADMIN_REVIEW_" + action, previousStatus, kyc.getStatus(), reviewDto.getComments());

        return buildReviewSummary(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<KycAuditLogDto> getAuditLogs(UUID kycId) {
        List<KycAuditLog> logs = auditLogRepository.findByKycApplicationIdOrderByCreatedAtDesc(kycId);
        return logs.stream().map(logItem -> {
            KycAuditLogDto dto = new KycAuditLogDto();
            dto.setId(logItem.getId());
            dto.setKycApplicationId(logItem.getKycApplication().getId());
            dto.setAction(logItem.getAction());
            dto.setPreviousStatus(logItem.getPreviousStatus());
            dto.setNewStatus(logItem.getNewStatus());
            if (logItem.getPerformedByUser() != null) {
                dto.setPerformedByUserEmail(logItem.getPerformedByUser().getEmail());
            }
            dto.setCreatedAt(logItem.getCreatedAt());
            return dto;
        }).collect(Collectors.toList());
    }

    // ==========================================
    // CLIENT PORTAL ADAPTER METHODS
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public KycApplicationDto getKycApplication(String username, UUID workflowId) {
        User user = userRepository.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Optional<KycApplication> kycOpt = workflowId != null
                ? kycRepository.findByWorkflowId(workflowId)
                : kycRepository.findFirstByUserIdOrderByCreatedAtDesc(user.getId());

        KycApplicationDto dto = new KycApplicationDto();
        if (kycOpt.isPresent()) {
            KycApplication kyc = kycOpt.get();
            dto.setId(kyc.getId());
            if (kyc.getBuyer() != null) {
                dto.setBuyerId(kyc.getBuyer().getId());
                dto.setUnitName(kyc.getBuyer().getUnitName());
            } else if (kyc.getWorkflow() != null && kyc.getWorkflow().getBuyer() != null) {
                dto.setUnitName(kyc.getWorkflow().getBuyer().getUnitName());
            }
            dto.setStatus(kyc.getStatus());
            dto.setDraftData(kyc.getDraftData());
            dto.setLocked(kyc.isLocked());
            dto.setVerified(kyc.isVerified());
            dto.setSubmittedAt(kyc.getSubmittedAt());
            dto.setReviewedAt(kyc.getReviewedAt());
        } else {
            dto.setStatus("NOT_STARTED");
        }
        return dto;
    }

    @Override
    @Transactional
    public KycApplicationDto saveKycDraft(String username, UUID workflowId, String draftDataJson) {
        User user = userRepository.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Workflow workflow = workflowId != null ? workflowRepository.findById(workflowId).orElse(null) : null;

        KycApplication kyc = (workflow != null ? kycRepository.findByWorkflowId(workflow.getId()) : Optional.<KycApplication>empty())
                .orElseGet(() -> {
                    KycApplication newKyc = new KycApplication();
                    newKyc.setUser(user);
                    if (workflow != null) {
                        newKyc.setWorkflow(workflow);
                        if (workflow.getBuyer() != null) {
                            newKyc.setBuyer(workflow.getBuyer());
                        }
                    }
                    newKyc.setStatus("DRAFT");
                    return newKyc;
                });

        kyc.setDraftData(draftDataJson);
        KycApplication saved = kycRepository.save(kyc);

        KycApplicationDto dto = new KycApplicationDto();
        dto.setId(saved.getId());
        dto.setStatus(saved.getStatus());
        dto.setDraftData(saved.getDraftData());
        return dto;
    }

    @Override
    @Transactional
    public KycApplicationDto submitKycApplication(String username, UUID workflowId, String formPayloadJson) {
        User user = userRepository.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Workflow workflow = workflowId != null ? workflowRepository.findById(workflowId).orElse(null) : null;

        KycApplication kyc = (workflow != null ? kycRepository.findByWorkflowId(workflow.getId()) : Optional.<KycApplication>empty())
                .orElseGet(() -> {
                    KycApplication newKyc = new KycApplication();
                    newKyc.setUser(user);
                    if (workflow != null) {
                        newKyc.setWorkflow(workflow);
                        if (workflow.getBuyer() != null) {
                            newKyc.setBuyer(workflow.getBuyer());
                        }
                    }
                    return newKyc;
                });

        kyc.setStatus("SUBMITTED");
        kyc.setLocked(true);
        kyc.setSubmittedAt(LocalDateTime.now());
        kyc.setDraftData(formPayloadJson);

        KycApplication saved = kycRepository.save(kyc);
        try {
            zohoCrmSyncService.enqueueKycSync(saved.getId());
        } catch (Exception e) {
            log.error("Failed to enqueue Zoho CRM sync", e);
        }

        KycApplicationDto dto = new KycApplicationDto();
        dto.setId(saved.getId());
        dto.setStatus(saved.getStatus());
        dto.setLocked(true);
        dto.setSubmittedAt(saved.getSubmittedAt());
        return dto;
    }

    @Override
    @Transactional
    public KycApplicationDto reuseKycApplication(String username, UUID targetWorkflowId, UUID sourceKycId) {
        User user = userRepository.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Workflow targetWorkflow = workflowRepository.findById(targetWorkflowId)
                .orElseThrow(() -> new CustomException("Target workflow not found", HttpStatus.NOT_FOUND));

        KycApplication sourceKyc = kycRepository.findById(sourceKycId)
                .orElseThrow(() -> new CustomException("Source KYC application not found", HttpStatus.NOT_FOUND));

        KycApplication newKyc = new KycApplication();
        newKyc.setUser(user);
        newKyc.setWorkflow(targetWorkflow);
        if (targetWorkflow.getBuyer() != null) {
            newKyc.setBuyer(targetWorkflow.getBuyer());
        }
        newKyc.setStatus(sourceKyc.getStatus());
        newKyc.setDraftData(sourceKyc.getDraftData());
        newKyc.setVerified(sourceKyc.isVerified());
        newKyc.setLocked(sourceKyc.isLocked());
        newKyc.setSubmittedAt(LocalDateTime.now());

        KycApplication saved = kycRepository.save(newKyc);

        KycApplicationDto dto = new KycApplicationDto();
        dto.setId(saved.getId());
        dto.setStatus(saved.getStatus());
        dto.setVerified(saved.isVerified());
        return dto;
    }

    @Override
    @Transactional
    public KycModificationRequestDto requestKycModification(String username, UUID workflowId, String reason) {
        User user = userRepository.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new CustomException("Workflow not found", HttpStatus.NOT_FOUND));

        KycApplication kyc = kycRepository.findByWorkflowId(workflow.getId())
                .orElseThrow(() -> new CustomException("KYC application not found", HttpStatus.NOT_FOUND));

        kyc.setStatus("MODIFICATION_REQUESTED");
        kyc.setLocked(false);
        kycRepository.save(kyc);

        KycModificationRequest req = new KycModificationRequest();
        req.setUser(user);
        if (workflow.getBuyer() != null) {
            req.setBuyer(workflow.getBuyer());
        }
        req.setReason(reason);
        req.setStatus("PENDING");

        KycModificationRequest savedReq = modificationRequestRepository.save(req);

        KycModificationRequestDto dto = new KycModificationRequestDto();
        dto.setId(savedReq.getId());
        dto.setReason(savedReq.getReason());
        dto.setStatus(savedReq.getStatus());
        return dto;
    }

    private void recordAudit(KycApplication kyc, User user, String action, String prevStatus, String newStatus, String snapshot) {
        KycAuditLog audit = new KycAuditLog();
        audit.setKycApplication(kyc);
        audit.setPerformedByUser(user);
        audit.setAction(action);
        audit.setPreviousStatus(prevStatus);
        audit.setNewStatus(newStatus);
        audit.setSnapshotData(snapshot);
        auditLogRepository.save(audit);
    }

    private KycReviewSummaryDto buildReviewSummary(KycApplication kyc) {
        KycReviewSummaryDto summary = new KycReviewSummaryDto();
        summary.setId(kyc.getId());
        if (kyc.getWorkflow() != null && kyc.getWorkflow().getBuyer() != null) {
            summary.setUnitName(kyc.getWorkflow().getBuyer().getUnitName());
        } else if (kyc.getBuyer() != null) {
            summary.setUnitName(kyc.getBuyer().getUnitName());
        }
        summary.setStatus(kyc.getStatus());
        summary.setLocked(kyc.isLocked());
        summary.setVerified(kyc.isVerified());
        summary.setVersion(kyc.getVersion());
        summary.setSubmittedAt(kyc.getSubmittedAt());
        summary.setReviewedAt(kyc.getReviewedAt());

        if (kyc.getDraftData() != null && !kyc.getDraftData().trim().isEmpty()) {
            try {
                KycDraftDto formData = objectMapper.readValue(kyc.getDraftData(), KycDraftDto.class);
                summary.setFormData(formData);
            } catch (JsonProcessingException e) {
                log.error("Failed to parse KYC draft data JSON", e);
            }
        }

        summary.setDocuments(new ArrayList<>());
        return summary;
    }
}
