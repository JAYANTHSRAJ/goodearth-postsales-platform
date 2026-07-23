package com.goodearth.postsales.kyc.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
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
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class KycServiceImpl implements KycService {

    private static final Logger log = LoggerFactory.getLogger(KycServiceImpl.class);

    private final KycApplicationRepository kycApplicationRepository;
    private final KycApplicantRepository kycApplicantRepository;
    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final KycAuditLogRepository auditLogRepository;
    private final KycApplicationMapper kycApplicationMapper;
    private final KycTimelineMapper kycTimelineMapper;
    private final KycAuditService auditService;
    private final ZohoKycSyncService zohoKycSyncService;
    private final BuyerRepository buyerRepository;
    private final WorkflowRepository workflowRepository;

    public KycServiceImpl(
            KycApplicationRepository kycApplicationRepository,
            KycApplicantRepository kycApplicantRepository,
            DocumentRepository documentRepository,
            DocumentVersionRepository documentVersionRepository,
            KycAuditLogRepository auditLogRepository,
            KycApplicationMapper kycApplicationMapper,
            KycTimelineMapper kycTimelineMapper,
            KycAuditService auditService,
            ZohoKycSyncService zohoKycSyncService,
            BuyerRepository buyerRepository,
            WorkflowRepository workflowRepository) {
        this.kycApplicationRepository = kycApplicationRepository;
        this.kycApplicantRepository = kycApplicantRepository;
        this.documentRepository = documentRepository;
        this.documentVersionRepository = documentVersionRepository;
        this.auditLogRepository = auditLogRepository;
        this.kycApplicationMapper = kycApplicationMapper;
        this.kycTimelineMapper = kycTimelineMapper;
        this.auditService = auditService;
        this.zohoKycSyncService = zohoKycSyncService;
        this.buyerRepository = buyerRepository;
        this.workflowRepository = workflowRepository;
    }

    @Override
    @Transactional
    public KycApplicationResponseDto saveDraft(KycDraftSaveRequestDto dto, String actorId) {
        KycApplication application = getOrCreateKycApplication(dto.getBookingId());

        // State Machine Check: Cannot save draft if under review, approved, or rejected
        if (application.getStatus() != KycApplicationStatus.DRAFT && application.getStatus() != KycApplicationStatus.ACTION_REQUIRED) {
            throw new KycInvalidStateTransitionException(application.getStatus().name(), "Save Draft");
        }

        if (dto.getApplicationDate() != null) application.setApplicationDate(dto.getApplicationDate());
        if (dto.getConsideringHomeLoan() != null) application.setConsideringHomeLoan(dto.getConsideringHomeLoan());
        if (dto.getHasCoApplicant() != null) application.setHasCoApplicant(dto.getHasCoApplicant());
        if (dto.getHasThirdApplicant() != null) application.setHasThirdApplicant(dto.getHasThirdApplicant());

        if (dto.getPrimaryApplicant() != null) {
            updateOrCreateApplicant(application, dto.getPrimaryApplicant(), ApplicantType.PRIMARY);
        }

        if (dto.getJointApplicants() != null) {
            for (ApplicantDto jointDto : dto.getJointApplicants()) {
                if (jointDto.getApplicantType() != null) {
                    updateOrCreateApplicant(application, jointDto, jointDto.getApplicantType());
                }
            }
        }

        int percentage = calculateCompletionPercentage(application);
        application.setCompletionPercentage(percentage);
        KycApplication savedApp = kycApplicationRepository.save(application);

        auditService.logEvent(savedApp, KycAuditEventType.DRAFT_SAVED, actorId, "CLIENT", "KYC draft saved", null);

        // Sync Deal fields and milestone to Zoho CRM
        zohoKycSyncService.syncKycDealFieldsToCrm(savedApp);

        List<Document> documents = documentRepository.findByKycApplicationId(savedApp.getId());
        return kycApplicationMapper.toResponseDto(savedApp, documents);
    }

    @Override
    @Transactional
    public KycApplicationResponseDto submitApplicantInfo(com.goodearth.postsales.kyc.dto.ApplicantInfoSubmitRequestDto dto, String actorId) {
        if (dto == null) {
            throw new IllegalArgumentException("Request DTO is required for applicant info submission");
        }

        String rawBookingId = dto.getBookingId() != null ? dto.getBookingId().trim() : "";
        String targetDealName = dto.getZohoDealName() != null ? dto.getZohoDealName().trim() : rawBookingId;
        String targetDealId = dto.getZohoDealId() != null ? dto.getZohoDealId().trim() : null;

        Buyer resolvedBuyer = null;
        Workflow resolvedWorkflow = null;

        if (actorId != null && !actorId.trim().isEmpty()) {
            List<Buyer> buyers = buyerRepository.findAllByEmailIgnoreCase(actorId.trim());
            if (!buyers.isEmpty()) {
                resolvedBuyer = buyers.get(0);
                if (targetDealId == null || targetDealId.isEmpty()) {
                    targetDealId = resolvedBuyer.getZohoDealId();
                }
                Optional<Workflow> wfOpt = workflowRepository.findFirstByBuyerId(resolvedBuyer.getId());
                if (wfOpt.isPresent()) {
                    resolvedWorkflow = wfOpt.get();
                    if (resolvedWorkflow.getProject() != null) {
                        targetDealName = resolvedWorkflow.getProject().getProjectName();
                        if (targetDealId == null || targetDealId.isEmpty()) {
                            targetDealId = resolvedWorkflow.getProject().getZohoDealId();
                        }
                    }
                }
            }
        }

        log.info("[TRACE_IDENTIFIER]\nStage: Applicant API -> KycServiceImpl.submitApplicantInfo()\nActor (Email): {}\nBuyer ID: {}\nWorkflow ID: {}\nUnit Name: {}\nBooking Reference: {}\nDeal Name: {}\nZoho Deal Record ID: {}",
                actorId,
                resolvedBuyer != null ? resolvedBuyer.getId() : "N/A",
                resolvedWorkflow != null ? resolvedWorkflow.getId() : "N/A",
                resolvedBuyer != null ? resolvedBuyer.getUnitName() : "N/A",
                rawBookingId,
                targetDealName,
                targetDealId);

        String effectiveTargetKey = targetDealId != null && !targetDealId.isEmpty() ? targetDealId : targetDealName;
        KycApplication application = getOrCreateKycApplication(effectiveTargetKey);

        Map<String, Object> dealFields = new HashMap<>();

        // Personal Information
        if (dto.getApplicantTitle() != null) {
            dealFields.put("Title_A", dto.getApplicantTitle());
            dealFields.put("Applicant_Title", dto.getApplicantTitle());
        }
        if (dto.getApplicantFirstName() != null) {
            dealFields.put("First_Name_A", dto.getApplicantFirstName());
            dealFields.put("Applicant_First_Name", dto.getApplicantFirstName());
        }
        if (dto.getApplicantLastName() != null) {
            dealFields.put("Last_Name_A", dto.getApplicantLastName());
            dealFields.put("Applicant_Last_Name", dto.getApplicantLastName());
        }

        String fullName = ((dto.getApplicantFirstName() != null ? dto.getApplicantFirstName().trim() : "") + " " +
                (dto.getApplicantLastName() != null ? dto.getApplicantLastName().trim() : "")).trim();
        if (!fullName.isEmpty()) {
            dealFields.put("First_Applicant", fullName);
            dealFields.put("Applicant_Name", fullName);
        }

        if (dto.getApplicantGender() != null) {
            dealFields.put("Gender", dto.getApplicantGender());
            dealFields.put("Applicant_Gender", dto.getApplicantGender());
        }
        if (dto.getApplicantDob() != null) {
            String formattedDob = formatDateForZoho(dto.getApplicantDob());
            dealFields.put("Applicant_Date_of_Birth", formattedDob);
            dealFields.put("DOB", formattedDob);
        }
        if (dto.getApplicantAge() != null && !dto.getApplicantAge().trim().isEmpty()) {
            try {
                int ageVal = Integer.parseInt(dto.getApplicantAge().trim());
                dealFields.put("Applicant_Age", ageVal);
                dealFields.put("Age", ageVal);
            } catch (Exception e) {
                dealFields.put("Applicant_Age", dto.getApplicantAge());
            }
        }
        if (dto.getApplicantPhone() != null) {
            dealFields.put("Applicant_Phone_number", dto.getApplicantPhone());
            dealFields.put("Phone", dto.getApplicantPhone());
            dealFields.put("Applicant_Phone", dto.getApplicantPhone());
        }
        if (dto.getApplicantEmail() != null) {
            dealFields.put("Email", dto.getApplicantEmail());
            dealFields.put("Applicant_Email", dto.getApplicantEmail());
        }

        // Identity
        if (dto.getApplicantPan() != null) {
            dealFields.put("Applicant_PAN", dto.getApplicantPan().toUpperCase());
            dealFields.put("PAN_Number", dto.getApplicantPan().toUpperCase());
        }
        if (dto.getApplicantAadhar() != null) {
            dealFields.put("Applicant_Aadhar", dto.getApplicantAadhar());
            dealFields.put("New_Applicant_Aadhar", dto.getApplicantAadhar());
        }
        if (dto.getNewApplicantAadhar() != null) {
            dealFields.put("New_Applicant_Aadhar", dto.getNewApplicantAadhar());
            dealFields.put("Applicant_Aadhar", dto.getNewApplicantAadhar());
        }

        // Family
        if (dto.getApplicantFatherFirstName() != null) {
            dealFields.put("Applicant_Spouse_Father_First_Name", dto.getApplicantFatherFirstName());
            dealFields.put("Applicant_Father_First_Name", dto.getApplicantFatherFirstName());
        }
        if (dto.getApplicantFatherLastName() != null) {
            dealFields.put("Applicant_Spouse_Father_Last_Name", dto.getApplicantFatherLastName());
            dealFields.put("Applicant_Father_Last_Name", dto.getApplicantFatherLastName());
        }

        // Professional
        if (dto.getApplicantOccupation() != null) dealFields.put("Applicant_Occupation", dto.getApplicantOccupation());
        if (dto.getApplicantDesignation() != null) {
            dealFields.put("Designation", dto.getApplicantDesignation());
            dealFields.put("Applicant_Designation", dto.getApplicantDesignation());
        }
        if (dto.getApplicantOrganizationName() != null) {
            dealFields.put("Organization_Name", dto.getApplicantOrganizationName());
            dealFields.put("Applicant_Organization_Name", dto.getApplicantOrganizationName());
        }
        if (dto.getIndustry() != null) dealFields.put("Industry", dto.getIndustry());
        if (dto.getApplicantCitizenshipStatus() != null) {
            dealFields.put("Citizenship_Status", dto.getApplicantCitizenshipStatus());
            dealFields.put("Applicant_Citizenship_Status", dto.getApplicantCitizenshipStatus());
        }

        // Address
        if (dto.getAddressStreet() != null) dealFields.put("Street_Address", dto.getAddressStreet());
        if (dto.getAddressCity() != null) dealFields.put("City", dto.getAddressCity());
        if (dto.getAddressState() != null) dealFields.put("State_Region_Province", dto.getAddressState());
        if (dto.getAddressPincode() != null) dealFields.put("Postal_Zip_Code_2", dto.getAddressPincode());
        if (dto.getAddressCountry() != null) dealFields.put("Country", dto.getAddressCountry());

        // Application
        if (dto.getApplicationDate() != null) {
            String formattedAppDate = formatDateForZoho(dto.getApplicationDate());
            dealFields.put("Application_Date", formattedAppDate);
        }
        if (dto.getConsideringHomeLoan() != null) dealFields.put("Are_you_considering_a_home_loan", dto.getConsideringHomeLoan());

        // Co-Applicant
        if (dto.getSoDoWoA() != null) dealFields.put("S_o_D_o_W_o_A", dto.getSoDoWoA());
        if (dto.getTitleA() != null) dealFields.put("Title_C", dto.getTitleA());
        if (dto.getFirstNameA() != null) dealFields.put("First_Name_C", dto.getFirstNameA());
        if (dto.getLastNameA() != null) dealFields.put("Last_Name_C", dto.getLastNameA());

        // Sync directly to Zoho CRM Deal
        zohoKycSyncService.syncApplicantMapToCrm(effectiveTargetKey, dealFields);

        // Update local KycApplicant primary entity in database
        KycApplicant primaryApplicant = application.getApplicants().stream()
                .filter(a -> a.getApplicantType() == ApplicantType.PRIMARY)
                .findFirst()
                .orElseGet(() -> {
                    KycApplicant newApp = new KycApplicant();
                    newApp.setKycApplication(application);
                    newApp.setApplicantType(ApplicantType.PRIMARY);
                    application.getApplicants().add(newApp);
                    return newApp;
                });

        if (dto.getApplicantTitle() != null) primaryApplicant.setSalutation(dto.getApplicantTitle());
        if (dto.getApplicantFirstName() != null) primaryApplicant.setFirstName(dto.getApplicantFirstName());
        if (dto.getApplicantLastName() != null) primaryApplicant.setLastName(dto.getApplicantLastName());
        if (!fullName.isEmpty()) primaryApplicant.setFullName(fullName);
        if (dto.getApplicantEmail() != null) primaryApplicant.setEmail(dto.getApplicantEmail());
        if (dto.getApplicantPhone() != null) primaryApplicant.setPhone(dto.getApplicantPhone());
        if (dto.getApplicantDob() != null) primaryApplicant.setDateOfBirth(dto.getApplicantDob());
        if (dto.getApplicantOccupation() != null) primaryApplicant.setOccupation(dto.getApplicantOccupation());
        if (dto.getApplicantPan() != null) primaryApplicant.setPanNumber(dto.getApplicantPan().toUpperCase());
        if (dto.getApplicantAadhar() != null) primaryApplicant.setAadhaarNumber(dto.getApplicantAadhar());
        if (dto.getNewApplicantAadhar() != null) primaryApplicant.setAadhaarNumber(dto.getNewApplicantAadhar());

        if (dto.getSoDoWoA() != null) primaryApplicant.setGuardianRelation(dto.getSoDoWoA());
        if (dto.getApplicantFatherSalutation() != null) primaryApplicant.setGuardianSalutation(dto.getApplicantFatherSalutation());
        if (dto.getApplicantFatherFirstName() != null) primaryApplicant.setGuardianFirstName(dto.getApplicantFatherFirstName());
        if (dto.getApplicantFatherLastName() != null) primaryApplicant.setGuardianLastName(dto.getApplicantFatherLastName());

        String guardianFullName = ((dto.getApplicantFatherFirstName() != null ? dto.getApplicantFatherFirstName().trim() : "") + " " +
                (dto.getApplicantFatherLastName() != null ? dto.getApplicantFatherLastName().trim() : "")).trim();
        if (!guardianFullName.isEmpty()) primaryApplicant.setGuardianName(guardianFullName);

        if (dto.getAddressStreet() != null) primaryApplicant.setAddressStreet(dto.getAddressStreet());
        if (dto.getAddressLine2() != null) primaryApplicant.setAddressLine2(dto.getAddressLine2());
        if (dto.getAddressCity() != null) primaryApplicant.setAddressCity(dto.getAddressCity());
        if (dto.getAddressState() != null) primaryApplicant.setAddressState(dto.getAddressState());
        if (dto.getAddressPincode() != null) primaryApplicant.setAddressPincode(dto.getAddressPincode());
        if (dto.getAddressCountry() != null) primaryApplicant.setAddressCountry(dto.getAddressCountry());

        if (dto.getApplicationDate() != null) application.setApplicationDate(dto.getApplicationDate());
        if (dto.getConsideringHomeLoan() != null) application.setConsideringHomeLoan(dto.getConsideringHomeLoan());

        // Update local application state
        application.setUpdatedAt(LocalDateTime.now());
        KycApplication savedApp = kycApplicationRepository.save(application);

        auditService.logEvent(savedApp, KycAuditEventType.DRAFT_SAVED, actorId, "CLIENT", "Applicant info submitted to Zoho CRM", null);

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
        if (dto.getSalutation() != null) applicant.setSalutation(dto.getSalutation());
        if (dto.getFirstName() != null) applicant.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null) applicant.setLastName(dto.getLastName());
        if (dto.getGuardianRelation() != null) applicant.setGuardianRelation(dto.getGuardianRelation());
        if (dto.getGuardianSalutation() != null) applicant.setGuardianSalutation(dto.getGuardianSalutation());
        if (dto.getGuardianFirstName() != null) applicant.setGuardianFirstName(dto.getGuardianFirstName());
        if (dto.getGuardianLastName() != null) applicant.setGuardianLastName(dto.getGuardianLastName());
        if (dto.getGuardianName() != null) applicant.setGuardianName(dto.getGuardianName());
        if (dto.getDateOfBirth() != null) applicant.setDateOfBirth(dto.getDateOfBirth());
        if (dto.getOccupation() != null) applicant.setOccupation(dto.getOccupation());
        if (dto.getAddressSameAsPrimary() != null) applicant.setAddressSameAsPrimary(dto.getAddressSameAsPrimary());
        if (dto.getAddressSameAsSecondary() != null) applicant.setAddressSameAsSecondary(dto.getAddressSameAsSecondary());

        if (dto.getEmail() != null) applicant.setEmail(dto.getEmail());
        if (dto.getPhone() != null) applicant.setPhone(dto.getPhone());
        if (dto.getRelation() != null) applicant.setRelation(dto.getRelation());
        if (dto.getPanNumber() != null) applicant.setPanNumber(dto.getPanNumber().toUpperCase());
        if (dto.getAadhaarNumber() != null) applicant.setAadhaarNumber(dto.getAadhaarNumber());

        if (dto.getAddress() != null) {
            if (dto.getAddress().getStreet() != null) applicant.setAddressStreet(dto.getAddress().getStreet());
            if (dto.getAddress().getAddressLine2() != null) applicant.setAddressLine2(dto.getAddress().getAddressLine2());
            if (dto.getAddress().getCity() != null) applicant.setAddressCity(dto.getAddress().getCity());
            if (dto.getAddress().getState() != null) applicant.setAddressState(dto.getAddress().getState());
            if (dto.getAddress().getPincode() != null) applicant.setAddressPincode(dto.getAddress().getPincode());
            if (dto.getAddress().getCountry() != null) applicant.setAddressCountry(dto.getAddress().getCountry());
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

    private String formatDateForZoho(String input) {
        if (input == null || input.trim().isEmpty()) return null;
        String str = input.trim();

        // 1. Already ISO: YYYY-MM-DD
        if (str.matches("^\\d{4}-\\d{2}-\\d{2}$")) return str;

        // 2. YYYY/MM/DD or YYYY.MM.DD -> YYYY-MM-DD
        if (str.matches("^\\d{4}[/.\\-]\\d{2}[/.\\-]\\d{2}$")) {
            return str.replaceAll("[/.]", "-");
        }

        // 3. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY -> YYYY-MM-DD
        if (str.matches("^\\d{2}[/.\\-]\\d{2}[/.\\-]\\d{4}$")) {
            String[] parts = str.split("[/.\\-]");
            return parts[2] + "-" + parts[1] + "-" + parts[0];
        }

        // 4. Try parsing with java.time.formatters
        String[] parseFormats = {"yyyy-MM-dd", "dd/MM/yyyy", "dd-MM-yyyy", "yyyy/MM/dd", "dd.MM.yyyy"};
        for (String fmt : parseFormats) {
            try {
                java.time.LocalDate date = java.time.LocalDate.parse(str, java.time.format.DateTimeFormatter.ofPattern(fmt));
                return date.format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE);
            } catch (Exception ignored) {
            }
        }

        return str;
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
