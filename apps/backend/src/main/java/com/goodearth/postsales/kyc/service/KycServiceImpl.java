package com.goodearth.postsales.kyc.service;

import com.goodearth.postsales.document.dto.DocumentSlotDto;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.entity.DocumentStatus;
import com.goodearth.postsales.document.entity.DocumentVersion;
import com.goodearth.postsales.document.entity.DocumentVersionStatus;
import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.document.repository.DocumentVersionRepository;
import com.goodearth.postsales.kyc.dto.ApplicantDto;
import com.goodearth.postsales.kyc.dto.KycApproveRequestDto;
import com.goodearth.postsales.kyc.dto.KycApplicationResponseDto;
import com.goodearth.postsales.kyc.dto.KycAutosaveRequestDto;
import com.goodearth.postsales.kyc.dto.KycAutosaveResponseDto;
import com.goodearth.postsales.kyc.dto.KycDashboardItemDto;
import com.goodearth.postsales.kyc.dto.KycDashboardMetricsDto;
import com.goodearth.postsales.kyc.dto.KycDashboardSummaryResponseDto;
import com.goodearth.postsales.kyc.dto.KycDraftSaveRequestDto;
import com.goodearth.postsales.kyc.dto.KycProgressResponseDto;
import com.goodearth.postsales.kyc.dto.KycRejectRequestDto;
import com.goodearth.postsales.kyc.dto.KycRequestChangesRequestDto;
import com.goodearth.postsales.kyc.dto.KycReviewStartRequestDto;
import com.goodearth.postsales.kyc.dto.KycSubmitRequestDto;
import com.goodearth.postsales.kyc.dto.KycTimelineEventDto;
import com.goodearth.postsales.kyc.dto.KycTimelineResponseDto;
import com.goodearth.postsales.kyc.dto.RequestedChangeItemDto;
import com.goodearth.postsales.kyc.entity.ApplicantType;
import com.goodearth.postsales.kyc.entity.KycApplicant;
import com.goodearth.postsales.kyc.entity.KycApplication;
import com.goodearth.postsales.kyc.entity.KycApplicationStatus;
import com.goodearth.postsales.kyc.entity.KycAuditEventType;
import com.goodearth.postsales.kyc.entity.KycAuditLog;
import com.goodearth.postsales.kyc.exception.KycInvalidStateTransitionException;
import com.goodearth.postsales.kyc.exception.KycNotFoundException;
import com.goodearth.postsales.kyc.exception.KycValidationException;
import com.goodearth.postsales.kyc.mapper.KycApplicationMapper;
import com.goodearth.postsales.kyc.mapper.KycTimelineMapper;
import com.goodearth.postsales.kyc.repository.KycApplicantRepository;
import com.goodearth.postsales.kyc.repository.KycApplicationRepository;
import com.goodearth.postsales.kyc.repository.KycAuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class KycServiceImpl implements KycService {

    private final KycApplicationRepository kycApplicationRepository;
    private final KycApplicantRepository kycApplicantRepository;
    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final KycAuditLogRepository auditLogRepository;
    private final KycApplicationMapper kycApplicationMapper;
    private final KycTimelineMapper kycTimelineMapper;
    private final KycAuditService auditService;
    private final ZohoKycSyncService zohoKycSyncService;

    public KycServiceImpl(
            KycApplicationRepository kycApplicationRepository,
            KycApplicantRepository kycApplicantRepository,
            DocumentRepository documentRepository,
            DocumentVersionRepository documentVersionRepository,
            KycAuditLogRepository auditLogRepository,
            KycApplicationMapper kycApplicationMapper,
            KycTimelineMapper kycTimelineMapper,
            KycAuditService auditService,
            ZohoKycSyncService zohoKycSyncService) {
        this.kycApplicationRepository = kycApplicationRepository;
        this.kycApplicantRepository = kycApplicantRepository;
        this.documentRepository = documentRepository;
        this.documentVersionRepository = documentVersionRepository;
        this.auditLogRepository = auditLogRepository;
        this.kycApplicationMapper = kycApplicationMapper;
        this.kycTimelineMapper = kycTimelineMapper;
        this.auditService = auditService;
        this.zohoKycSyncService = zohoKycSyncService;
    }

    @Override
    @Transactional
    public KycApplicationResponseDto saveDraft(KycDraftSaveRequestDto dto, String actorId) {
        KycApplication application = getOrCreateKycApplication(dto.getBookingId());

        // State Machine Check: Cannot save draft if under review, approved, or rejected
        if (application.getStatus() != KycApplicationStatus.DRAFT && application.getStatus() != KycApplicationStatus.ACTION_REQUIRED) {
            throw new KycInvalidStateTransitionException(application.getStatus().name(), "Save Draft");
        }

        if (dto.getPrimaryApplicant() != null) {
            updateOrCreateApplicant(application, dto.getPrimaryApplicant(), ApplicantType.PRIMARY);
        }

        if (dto.getJointApplicants() != null) {
            for (ApplicantDto jointDto : dto.getJointApplicants()) {
                updateOrCreateApplicant(application, jointDto, jointDto.getApplicantType());
            }
        }

        int percentage = calculateCompletionPercentage(application);
        application.setCompletionPercentage(percentage);
        KycApplication savedApp = kycApplicationRepository.save(application);

        auditService.logEvent(savedApp, KycAuditEventType.DRAFT_SAVED, actorId, "CLIENT", "KYC draft saved", null);

        List<Document> documents = documentRepository.findByKycApplicationId(savedApp.getId());
        return kycApplicationMapper.toResponseDto(savedApp, documents);
    }

    @Override
    @Transactional
    public KycAutosaveResponseDto autosaveField(KycAutosaveRequestDto dto, String actorId) {
        KycApplication application = kycApplicationRepository.findByBookingId(dto.getBookingId())
                .orElseThrow(() -> new KycNotFoundException("Booking ID", dto.getBookingId()));

        if (application.getStatus() != KycApplicationStatus.DRAFT && application.getStatus() != KycApplicationStatus.ACTION_REQUIRED) {
            throw new KycInvalidStateTransitionException(application.getStatus().name(), "Autosave Field");
        }

        application.setUpdatedAt(LocalDateTime.now());
        kycApplicationRepository.save(application);

        return KycAutosaveResponseDto.builder()
                .kycApplicationId(application.getId())
                .fieldSaved(dto.getFieldPath())
                .lastSavedAt(LocalDateTime.now())
                .build();
    }

    @Override
    @Transactional
    public KycApplicationResponseDto getKycApplicationByBooking(String bookingId) {
        KycApplication application = getOrCreateKycApplication(bookingId);

        List<Document> documents = documentRepository.findByKycApplicationId(application.getId());
        return kycApplicationMapper.toResponseDto(application, documents);
    }

    private KycApplication getOrCreateKycApplication(String bookingId) {
        return kycApplicationRepository.findByBookingId(bookingId)
                .orElseGet(() -> {
                    KycApplication newApp = new KycApplication();
                    newApp.setBookingId(bookingId);
                    newApp.setStatus(KycApplicationStatus.DRAFT);
                    newApp.setCompletionPercentage(0);
                    return kycApplicationRepository.save(newApp);
                });
    }

    @Override
    @Transactional
    public KycApplicationResponseDto submitKyc(KycSubmitRequestDto dto, String actorId) {
        KycApplication application = kycApplicationRepository.findById(dto.getKycApplicationId())
                .orElseThrow(() -> new KycNotFoundException("KYC Application", dto.getKycApplicationId().toString()));

        // Allowed transitions: DRAFT -> SUBMITTED or ACTION_REQUIRED -> SUBMITTED
        if (application.getStatus() != KycApplicationStatus.DRAFT && application.getStatus() != KycApplicationStatus.ACTION_REQUIRED) {
            throw new KycInvalidStateTransitionException(application.getStatus().name(), "Submit KYC");
        }

        List<Document> documents = documentRepository.findByKycApplicationId(application.getId());
        long requiredUploadedCount = documents.stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsRequired()))
                .filter(d -> d.getVersions() != null && !d.getVersions().isEmpty())
                .count();

        if (requiredUploadedCount == 0 && !documents.isEmpty()) {
            throw new KycValidationException("Cannot submit KYC: Mandatory document uploads are incomplete.");
        }

        application.setStatus(KycApplicationStatus.SUBMITTED);
        application.setSubmittedAt(LocalDateTime.now());
        if (dto.getClientNotes() != null) {
            application.setClientNotes(dto.getClientNotes());
        }
        application.setCompletionPercentage(100);

        KycApplication savedApp = kycApplicationRepository.save(application);

        auditService.logEvent(savedApp, KycAuditEventType.KYC_SUBMITTED, actorId, "CLIENT", "KYC application submitted for verification", null);

        // Synchronize milestone with Zoho CRM
        zohoKycSyncService.syncKycStatusToCrm(savedApp, "KYC Submitted", "Homebuyer submitted complete KYC application.");

        return kycApplicationMapper.toResponseDto(savedApp, documents);
    }

    @Override
    @Transactional
    public KycApplicationResponseDto startReview(KycReviewStartRequestDto dto, String reviewerId) {
        KycApplication application = kycApplicationRepository.findById(dto.getKycApplicationId())
                .orElseThrow(() -> new KycNotFoundException("KYC Application", dto.getKycApplicationId().toString()));

        // Transition: SUBMITTED -> UNDER_REVIEW
        if (application.getStatus() != KycApplicationStatus.SUBMITTED) {
            throw new KycInvalidStateTransitionException(application.getStatus().name(), "Start Review");
        }

        application.setStatus(KycApplicationStatus.UNDER_REVIEW);
        application.setVerifiedBy(reviewerId);
        KycApplication savedApp = kycApplicationRepository.save(application);

        auditService.logEvent(savedApp, KycAuditEventType.REVIEW_STARTED, reviewerId, "CRM_EXECUTIVE", "KYC verification assigned and started", null);

        // Synchronize milestone with Zoho CRM
        zohoKycSyncService.syncKycStatusToCrm(savedApp, "Verification Started", "KYC review started by executive: " + reviewerId);

        List<Document> documents = documentRepository.findByKycApplicationId(savedApp.getId());
        return kycApplicationMapper.toResponseDto(savedApp, documents);
    }

    @Override
    @Transactional
    public KycApplicationResponseDto approveKyc(KycApproveRequestDto dto, String reviewerId) {
        KycApplication application = kycApplicationRepository.findById(dto.getKycApplicationId())
                .orElseThrow(() -> new KycNotFoundException("KYC Application", dto.getKycApplicationId().toString()));

        if (application.getStatus() != KycApplicationStatus.UNDER_REVIEW) {
            throw new KycInvalidStateTransitionException(application.getStatus().name(), "Approve KYC");
        }

        if ("SINGLE_DOCUMENT".equalsIgnoreCase(dto.getApprovalScope()) && dto.getDocumentId() != null) {
            Document doc = documentRepository.findById(dto.getDocumentId())
                    .orElseThrow(() -> new KycNotFoundException("Document", dto.getDocumentId().toString()));
            doc.setStatus(DocumentStatus.ACTIVE);
            documentRepository.save(doc);

            Optional<DocumentVersion> currVerOpt = documentVersionRepository.findByDocumentIdAndIsCurrentTrue(doc.getId());
            if (currVerOpt.isPresent()) {
                DocumentVersion ver = currVerOpt.get();
                ver.setStatus(DocumentVersionStatus.APPROVED);
                documentVersionRepository.save(ver);
            }

            auditService.logEvent(application, KycAuditEventType.DOCUMENT_APPROVED, reviewerId, "CRM_EXECUTIVE",
                    "Approved document: " + doc.getDocumentType(), dto.getComments());
        } else {
            // Full Application Approval
            application.setStatus(KycApplicationStatus.APPROVED);
            application.setVerifiedAt(LocalDateTime.now());
            application.setVerifiedBy(reviewerId);
            kycApplicationRepository.save(application);

            auditService.logEvent(application, KycAuditEventType.KYC_APPROVED, reviewerId, "CRM_EXECUTIVE",
                    "Full KYC Application approved", dto.getComments());

            // Synchronize milestone with Zoho CRM
            zohoKycSyncService.syncKycStatusToCrm(application, "KYC Approved", "Full KYC application verified and approved by CRM executive.");
        }

        List<Document> documents = documentRepository.findByKycApplicationId(application.getId());
        return kycApplicationMapper.toResponseDto(application, documents);
    }

    @Override
    @Transactional
    public KycApplicationResponseDto rejectKyc(KycRejectRequestDto dto, String reviewerId) {
        KycApplication application = kycApplicationRepository.findById(dto.getKycApplicationId())
                .orElseThrow(() -> new KycNotFoundException("KYC Application", dto.getKycApplicationId().toString()));

        if (application.getStatus() != KycApplicationStatus.UNDER_REVIEW) {
            throw new KycInvalidStateTransitionException(application.getStatus().name(), "Reject KYC");
        }

        if (dto.getDocumentId() != null) {
            Document doc = documentRepository.findById(dto.getDocumentId())
                    .orElseThrow(() -> new KycNotFoundException("Document", dto.getDocumentId().toString()));

            Optional<DocumentVersion> currVerOpt = documentVersionRepository.findByDocumentIdAndIsCurrentTrue(doc.getId());
            if (currVerOpt.isPresent()) {
                DocumentVersion ver = currVerOpt.get();
                ver.setStatus(DocumentVersionStatus.REJECTED);
                ver.setRejectionReasonCode(dto.getRejectionReasonCode());
                ver.setRejectionComments(dto.getComments());
                documentVersionRepository.save(ver);
            }
        }

        application.setStatus(KycApplicationStatus.ACTION_REQUIRED);
        KycApplication savedApp = kycApplicationRepository.save(application);

        auditService.logEvent(savedApp, KycAuditEventType.DOCUMENT_REJECTED, reviewerId, "CRM_EXECUTIVE",
                "Rejected document with code: " + dto.getRejectionReasonCode(), dto.getComments());

        // Synchronize milestone with Zoho CRM
        zohoKycSyncService.syncKycStatusToCrm(savedApp, "KYC Changes Requested", "Document rejected with reason: " + dto.getRejectionReasonCode());

        List<Document> documents = documentRepository.findByKycApplicationId(savedApp.getId());
        return kycApplicationMapper.toResponseDto(savedApp, documents);
    }

    @Override
    @Transactional
    public KycApplicationResponseDto requestChanges(KycRequestChangesRequestDto dto, String reviewerId) {
        KycApplication application = kycApplicationRepository.findById(dto.getKycApplicationId())
                .orElseThrow(() -> new KycNotFoundException("KYC Application", dto.getKycApplicationId().toString()));

        if (application.getStatus() != KycApplicationStatus.UNDER_REVIEW) {
            throw new KycInvalidStateTransitionException(application.getStatus().name(), "Request Changes");
        }

        if (dto.getRequestedChanges() != null) {
            for (RequestedChangeItemDto item : dto.getRequestedChanges()) {
                Document doc = documentRepository.findById(item.getDocumentId()).orElse(null);
                if (doc != null) {
                    Optional<DocumentVersion> currVerOpt = documentVersionRepository.findByDocumentIdAndIsCurrentTrue(doc.getId());
                    if (currVerOpt.isPresent()) {
                        DocumentVersion ver = currVerOpt.get();
                        ver.setStatus(DocumentVersionStatus.REJECTED);
                        ver.setRejectionReasonCode(item.getReasonCode());
                        ver.setRejectionComments(item.getInstructions());
                        documentVersionRepository.save(ver);
                    }
                }
            }
        }

        application.setStatus(KycApplicationStatus.ACTION_REQUIRED);
        KycApplication savedApp = kycApplicationRepository.save(application);

        auditService.logEvent(savedApp, KycAuditEventType.CHANGES_REQUESTED, reviewerId, "CRM_EXECUTIVE",
                "Requested changes on submitted KYC documents", dto.getGeneralNotes());

        // Synchronize milestone with Zoho CRM
        zohoKycSyncService.syncKycStatusToCrm(savedApp, "KYC Action Required", "Homebuyer requested to correct submitted document slots.");

        List<Document> documents = documentRepository.findByKycApplicationId(savedApp.getId());
        return kycApplicationMapper.toResponseDto(savedApp, documents);
    }

    @Override
    @Transactional(readOnly = true)
    public KycProgressResponseDto getKycProgress(String bookingId) {
        KycApplication application = kycApplicationRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new KycNotFoundException("Booking ID", bookingId));

        List<Document> documents = documentRepository.findByKycApplicationId(application.getId());

        int requiredCount = (int) documents.stream().filter(d -> Boolean.TRUE.equals(d.getIsRequired())).count();
        int uploadedCount = (int) documents.stream().filter(d -> d.getVersions() != null && !d.getVersions().isEmpty()).count();

        int approvedCount = 0;
        int rejectedCount = 0;
        int pendingReviewCount = 0;

        for (Document doc : documents) {
            DocumentVersion curr = null;
            if (doc.getVersions() != null) {
                curr = doc.getVersions().stream()
                        .filter(v -> Boolean.TRUE.equals(v.getIsCurrent()))
                        .findFirst()
                        .orElse(null);
            }
            if (curr != null) {
                DocumentVersionStatus st = curr.getStatus();
                if (st == DocumentVersionStatus.APPROVED) approvedCount++;
                else if (st == DocumentVersionStatus.REJECTED) rejectedCount++;
                else if (st == DocumentVersionStatus.SUBMITTED || st == DocumentVersionStatus.UNDER_REVIEW) pendingReviewCount++;
            }
        }

        List<DocumentSlotDto> slotDtos = documents.stream()
                .map(kycApplicationMapper::toSlotDto)
                .collect(Collectors.toList());

        return KycProgressResponseDto.builder()
                .bookingId(bookingId)
                .kycApplicationId(application.getId())
                .overallStatus(application.getStatus())
                .completionPercentage(application.getCompletionPercentage())
                .requiredSlotsCount(requiredCount)
                .uploadedSlotsCount(uploadedCount)
                .approvedSlotsCount(approvedCount)
                .rejectedSlotsCount(rejectedCount)
                .pendingReviewSlotsCount(pendingReviewCount)
                .slots(slotDtos)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public KycDashboardSummaryResponseDto getDashboardSummary(String projectId, KycApplicationStatus status, int page, int limit) {
        PageRequest pageRequest = PageRequest.of(Math.max(0, page - 1), Math.max(1, limit));
        Page<KycApplication> appPage;

        if (status != null) {
            appPage = kycApplicationRepository.findByStatus(status, pageRequest);
        } else {
            appPage = kycApplicationRepository.findAll(pageRequest);
        }

        List<KycDashboardItemDto> items = appPage.getContent().stream()
                .map(app -> KycDashboardItemDto.builder()
                        .kycApplicationId(app.getId())
                        .bookingRef(app.getBookingId())
                        .unitNumber("N/A")
                        .projectName(projectId != null ? projectId : "GoodEarth Project")
                        .primaryApplicantName(getPrimaryApplicantName(app))
                        .status(app.getStatus())
                        .submittedAt(app.getSubmittedAt())
                        .assignedReviewer(app.getVerifiedBy() != null ? app.getVerifiedBy() : "Unassigned")
                        .build())
                .collect(Collectors.toList());

        long pendingCount = kycApplicationRepository.countByStatus(KycApplicationStatus.SUBMITTED)
                + kycApplicationRepository.countByStatus(KycApplicationStatus.UNDER_REVIEW);
        long actionReqCount = kycApplicationRepository.countByStatus(KycApplicationStatus.ACTION_REQUIRED);
        long verifiedCount = kycApplicationRepository.countByStatus(KycApplicationStatus.APPROVED);

        KycDashboardMetricsDto metrics = KycDashboardMetricsDto.builder()
                .totalPendingReview(pendingCount)
                .totalActionRequired(actionReqCount)
                .totalVerifiedThisMonth(verifiedCount)
                .avgReviewTimeHours(3.5)
                .build();

        return KycDashboardSummaryResponseDto.builder()
                .metrics(metrics)
                .applications(items)
                .page(page)
                .limit(limit)
                .totalCount(appPage.getTotalElements())
                .totalPages(appPage.getTotalPages())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public KycTimelineResponseDto getTimeline(String bookingId) {
        KycApplication application = kycApplicationRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new KycNotFoundException("Booking ID", bookingId));

        List<KycAuditLog> auditLogs = auditLogRepository.findByKycApplicationIdOrderByCreatedAtDesc(application.getId());
        List<KycTimelineEventDto> events = auditLogs.stream()
                .map(kycTimelineMapper::toDto)
                .collect(Collectors.toList());

        return KycTimelineResponseDto.builder()
                .bookingId(bookingId)
                .kycApplicationId(application.getId())
                .events(events)
                .build();
    }

    private void updateOrCreateApplicant(KycApplication application, ApplicantDto dto, ApplicantType type) {
        KycApplicant applicant = kycApplicantRepository.findByKycApplicationIdAndApplicantType(application.getId(), type)
                .orElseGet(() -> {
                    KycApplicant newApp = new KycApplicant();
                    newApp.setKycApplication(application);
                    newApp.setApplicantType(type);
                    return newApp;
                });

        if (dto.getFullName() != null) applicant.setFullName(dto.getFullName());
        if (dto.getEmail() != null) applicant.setEmail(dto.getEmail());
        if (dto.getPhone() != null) applicant.setPhone(dto.getPhone());
        if (dto.getRelation() != null) applicant.setRelation(dto.getRelation());
        if (dto.getPanNumber() != null) applicant.setPanNumber(dto.getPanNumber().toUpperCase());
        if (dto.getAadhaarNumber() != null) applicant.setAadhaarNumber(dto.getAadhaarNumber());

        if (dto.getAddress() != null) {
            applicant.setAddressStreet(dto.getAddress().getStreet());
            applicant.setAddressCity(dto.getAddress().getCity());
            applicant.setAddressState(dto.getAddress().getState());
            applicant.setAddressPincode(dto.getAddress().getPincode());
            applicant.setAddressCountry(dto.getAddress().getCountry());
        }

        kycApplicantRepository.save(applicant);
    }

    private int calculateCompletionPercentage(KycApplication application) {
        int percentage = 20; // Base draft creation
        if (application.getApplicants() != null && !application.getApplicants().isEmpty()) {
            percentage += 40;
        }
        return Math.min(percentage, 100);
    }

    private String getPrimaryApplicantName(KycApplication app) {
        if (app.getApplicants() != null) {
            return app.getApplicants().stream()
                    .filter(a -> a.getApplicantType() == ApplicantType.PRIMARY)
                    .map(KycApplicant::getFullName)
                    .findFirst()
                    .orElse("Unknown Applicant");
        }
        return "Unknown Applicant";
    }
}
