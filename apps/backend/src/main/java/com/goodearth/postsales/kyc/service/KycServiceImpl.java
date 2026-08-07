package com.goodearth.postsales.kyc.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.document.dto.DocumentSlotDto;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.entity.DocumentStatus;
import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.document.entity.DocumentVersion;
import com.goodearth.postsales.document.entity.DocumentVersionStatus;
import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.document.repository.DocumentVersionRepository;
import com.goodearth.postsales.kyc.dto.ApplicantDto;
import com.goodearth.postsales.kyc.dto.KycApproveRequestDto;
import com.goodearth.postsales.kyc.dto.KycApplicationResponseDto;
import com.goodearth.postsales.kyc.dto.KycAutosaveRequestDto;
import com.goodearth.postsales.kyc.dto.KycAutosaveResponseDto;
import com.goodearth.postsales.kyc.dto.KycCopyRequestDto;
import com.goodearth.postsales.kyc.dto.KycCopySourceDto;
import com.goodearth.postsales.kyc.dto.KycDashboardItemDto;
import com.goodearth.postsales.kyc.dto.KycDashboardMetricsDto;
import com.goodearth.postsales.kyc.dto.KycDashboardSummaryResponseDto;
import com.goodearth.postsales.kyc.dto.KycDraftSaveRequestDto;
import com.goodearth.postsales.kyc.dto.KycMissingItemDto;
import com.goodearth.postsales.kyc.dto.KycProgressResponseDto;
import com.goodearth.postsales.kyc.dto.KycValidationSummaryResponseDto;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
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
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

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
            WorkflowRepository workflowRepository,
            org.springframework.context.ApplicationEventPublisher eventPublisher) {
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
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public KycApplicationResponseDto saveDraft(KycDraftSaveRequestDto dto, String actorId) {
        KycApplication application = getOrCreateKycApplication(dto.getBookingId(), actorId, actorId);
        if (application.getUserEmail() == null && actorId != null && !"anonymousUser".equalsIgnoreCase(actorId)) {
            application.setUserEmail(actorId);
            application.setUserId(actorId);
        }

        // State Machine Check: Cannot save draft if under review, approved, or rejected
        if (application.getStatus() != KycApplicationStatus.DRAFT &&
                application.getStatus() != KycApplicationStatus.ACTION_REQUIRED &&
                application.getStatus() != KycApplicationStatus.EDIT_ENABLED) {
            throw new KycInvalidStateTransitionException(application.getStatus().name(), "Save Draft");
        }

        if (dto.getApplicationDate() != null) application.setApplicationDate(dto.getApplicationDate());
        if ("No".equalsIgnoreCase(dto.getHasThirdApplicant())) {
            application.setHasThirdApplicant("No");
            List<Document> joint2Docs = documentRepository.findByKycApplicationId(application.getId()).stream()
                    .filter(d -> d.getApplicantType() == ApplicantType.JOINT_2)
                    .toList();
            for (Document doc : joint2Docs) {
                doc.setStatus(DocumentStatus.ARCHIVED);
                doc.setKycApplicant(null);
                documentRepository.save(doc);
            }
            documentRepository.flush();

            List<KycApplicant> existingThirdApps = kycApplicantRepository.findAllByKycApplicationIdAndApplicantType(application.getId(), ApplicantType.JOINT_2);
            for (KycApplicant app : existingThirdApps) {
                kycApplicantRepository.delete(app);
            }
            kycApplicantRepository.flush();
            if (application.getApplicants() != null) {
                application.getApplicants().removeIf(a -> a.getApplicantType() == ApplicantType.JOINT_2);
            }
        } else if (dto.getHasThirdApplicant() != null) {
            application.setHasThirdApplicant(dto.getHasThirdApplicant());
        }

        if ("No".equalsIgnoreCase(dto.getHasCoApplicant())) {
            application.setHasCoApplicant("No");
            application.setHasThirdApplicant("No");
            archiveApplicantDocuments(application.getId(), ApplicantType.JOINT_1);
            archiveApplicantDocuments(application.getId(), ApplicantType.JOINT_2);
            List<KycApplicant> existingJointApps = kycApplicantRepository.findAllByKycApplicationIdAndApplicantType(application.getId(), ApplicantType.JOINT_1);
            for (KycApplicant app : existingJointApps) {
                kycApplicantRepository.delete(app);
            }
            List<KycApplicant> existingThirdApps = kycApplicantRepository.findAllByKycApplicationIdAndApplicantType(application.getId(), ApplicantType.JOINT_2);
            for (KycApplicant app : existingThirdApps) {
                kycApplicantRepository.delete(app);
            }
            kycApplicantRepository.flush();
            if (application.getApplicants() != null) {
                application.getApplicants().removeIf(a -> a.getApplicantType() == ApplicantType.JOINT_1 || a.getApplicantType() == ApplicantType.JOINT_2);
            }
        } else if (dto.getHasCoApplicant() != null) {
            application.setHasCoApplicant(dto.getHasCoApplicant());
        }

        String titleBeforeMapping = application.getApplicants() != null ? application.getApplicants().stream()
                .filter(a -> a.getApplicantType() == ApplicantType.PRIMARY)
                .map(KycApplicant::getSalutation)
                .findFirst().orElse("N/A") : "N/A";

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

        String titleAfterMapping = application.getApplicants() != null ? application.getApplicants().stream()
                .filter(a -> a.getApplicantType() == ApplicantType.PRIMARY)
                .map(KycApplicant::getSalutation)
                .findFirst().orElse("N/A") : "N/A";

        int percentage = calculateCompletionPercentage(application);
        application.setCompletionPercentage(percentage);
        application.setUpdatedAt(LocalDateTime.now());
        KycApplication savedApp = kycApplicationRepository.save(application);
        kycApplicationRepository.flush();

        String titleAfterSave = savedApp.getApplicants() != null ? savedApp.getApplicants().stream()
                .filter(a -> a.getApplicantType() == ApplicantType.PRIMARY)
                .map(KycApplicant::getSalutation)
                .findFirst().orElse("N/A") : "N/A";

        KycApplication reloadedApp = kycApplicationRepository.findById(savedApp.getId()).orElse(savedApp);
        String titleAfterDbReload = reloadedApp.getApplicants() != null ? reloadedApp.getApplicants().stream()
                .filter(a -> a.getApplicantType() == ApplicantType.PRIMARY)
                .map(KycApplicant::getSalutation)
                .findFirst().orElse("N/A") : "N/A";

        log.info("[SAVE_DRAFT_TRACE]\nBooking ID: {}\nApplication ID: {}\nApplicant Title before mapping: {}\nApplicant Title after mapping: {}\nApplicant Title after save(): {}\nApplicant Title after DB reload: {}",
                reloadedApp.getBookingId(), reloadedApp.getId(), titleBeforeMapping, titleAfterMapping, titleAfterSave, titleAfterDbReload);

        auditService.logEvent(reloadedApp, KycAuditEventType.DRAFT_SAVED, actorId, "CLIENT", "KYC draft saved", null);

        // Sync Deal fields and milestone to Zoho CRM using reloaded entity
        zohoKycSyncService.syncKycDealFieldsToCrm(reloadedApp);

        List<Document> documents = documentRepository.findByKycApplicationId(reloadedApp.getId());
        return kycApplicationMapper.toResponseDto(reloadedApp, documents);
    }

    @Override
    @Transactional
    public KycApplicationResponseDto submitApplicantInfo(com.goodearth.postsales.kyc.dto.ApplicantInfoSubmitRequestDto dto, String actorId) {
        if (dto == null) {
            throw new IllegalArgumentException("Request DTO is required for applicant info submission");
        }

        String rawBookingId = dto.getBookingId() != null ? dto.getBookingId().trim() : "";
        String targetDealName = dto.getZohoDealName() != null ? dto.getZohoDealName().trim() : rawBookingId;
        String targetDealId = (dto.getZohoDealId() != null && !dto.getZohoDealId().isBlank())
                ? dto.getZohoDealId().trim()
                : (!rawBookingId.isBlank() && !"DEFAULT_BOOKING".equalsIgnoreCase(rawBookingId) && !"current".equalsIgnoreCase(rawBookingId)
                        ? rawBookingId
                        : null);

        Buyer resolvedBuyer = null;
        Workflow resolvedWorkflow = null;

        if (actorId != null && !actorId.trim().isEmpty()) {
            List<Buyer> buyers = buyerRepository.findAllByEmailIgnoreCase(actorId.trim());
            if (!buyers.isEmpty()) {
                resolvedBuyer = buyers.get(0);
            }
        }

        if (targetDealId != null && !targetDealId.isBlank()) {
            final String tid = targetDealId;
            Optional<Workflow> wfOpt = workflowRepository.findAll().stream()
                    .filter(w -> w.getProject() != null && tid.equalsIgnoreCase(w.getProject().getZohoDealId()))
                    .findFirst();
            if (wfOpt.isPresent()) {
                resolvedWorkflow = wfOpt.get();
                if (resolvedWorkflow.getProject() != null && resolvedWorkflow.getProject().getProjectName() != null) {
                    targetDealName = resolvedWorkflow.getProject().getProjectName();
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

        if (application.getStatus() != KycApplicationStatus.DRAFT &&
                application.getStatus() != KycApplicationStatus.ACTION_REQUIRED &&
                application.getStatus() != KycApplicationStatus.EDIT_ENABLED) {
            throw new KycInvalidStateTransitionException(application.getStatus().name(), "Submit Applicant Info");
        }

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
        if (dto.getHasCoApplicant() != null) {
            dealFields.put("Do_you_have_coapplicant", dto.getHasCoApplicant());
            dealFields.put("Co_applicant", dto.getHasCoApplicant());
            dealFields.put("Has_Co_Applicant", dto.getHasCoApplicant());
        }
        if (dto.getSoDoWoA() != null) {
            dealFields.put("S_o_D_o_W_o_C", dto.getSoDoWoA());
            dealFields.put("S_o_D_o_W_o_A", dto.getSoDoWoA());
        }
        if (dto.getTitleA() != null) {
            dealFields.put("Title_C", dto.getTitleA());
            dealFields.put("CoApplicant_Title", dto.getTitleA());
        }
        if (dto.getFirstNameA() != null) {
            dealFields.put("First_Name_C", dto.getFirstNameA());
            dealFields.put("Co_applicant_First_Name", dto.getFirstNameA());
        }
        if (dto.getLastNameA() != null) {
            dealFields.put("Last_Name_C", dto.getLastNameA());
            dealFields.put("Co_applicant_Last_Name", dto.getLastNameA());
        }
        if (dto.getCoApplicantGender() != null) {
            dealFields.put("Co_applicant_Gender", dto.getCoApplicantGender());
        }
        if (dto.getCoApplicantAge() != null) {
            try {
                dealFields.put("CoApplicant_Age", Integer.parseInt(dto.getCoApplicantAge().trim()));
            } catch (Exception e) {
                dealFields.put("CoApplicant_Age", dto.getCoApplicantAge());
            }
        }
        if (dto.getCoApplicantRelation() != null) {
            dealFields.put("Relationship_with_Primary_applicant", dto.getCoApplicantRelation());
        }

        String coApplicantFullName = ((dto.getFirstNameA() != null ? dto.getFirstNameA().trim() : "") + " " +
                (dto.getLastNameA() != null ? dto.getLastNameA().trim() : "")).trim();
        if (!coApplicantFullName.isEmpty()) {
            dealFields.put("Co_Applicant_Name", coApplicantFullName);
            dealFields.put("Second_Applicant", coApplicantFullName);
        }

        if (dto.getCoApplicantEmail() != null) {
            dealFields.put("Email_C", dto.getCoApplicantEmail());
            dealFields.put("Co_applicant_Email", dto.getCoApplicantEmail());
        }
        if (dto.getCoApplicantPhone() != null) {
            dealFields.put("Phone_C", dto.getCoApplicantPhone());
            dealFields.put("Co_applicant_Phone", dto.getCoApplicantPhone());
        }
        if (dto.getCoApplicantDob() != null) {
            String formattedCoDob = formatDateForZoho(dto.getCoApplicantDob());
            dealFields.put("DOB_C", formattedCoDob);
            dealFields.put("Co_applicant_DOB", formattedCoDob);
        }
        if (dto.getCoApplicantOccupation() != null) {
            dealFields.put("Co_Applicant_Occupation", dto.getCoApplicantOccupation());
        }
        if (dto.getCoApplicantPan() != null) {
            dealFields.put("Co_applicant_PAN_Number", dto.getCoApplicantPan().toUpperCase());
            dealFields.put("Co_applicant_PAN", dto.getCoApplicantPan().toUpperCase());
        }
        if (dto.getCoApplicantAadhar() != null) {
            dealFields.put("CoApplicant_Aadhar", dto.getCoApplicantAadhar());
        }
        if (dto.getCoApplicantFatherFirstName() != null) {
            dealFields.put("Co_applicant_Father_First_Name", dto.getCoApplicantFatherFirstName());
        }
        if (dto.getCoApplicantFatherLastName() != null) {
            dealFields.put("Co_applicant_Father_Last_Name", dto.getCoApplicantFatherLastName());
        }
        if (dto.getCoApplicantAddressSameAsPrimary() != null) {
            dealFields.put("Is_it_the_same_address_as_the_first_applicant_s", dto.getCoApplicantAddressSameAsPrimary() ? "Yes" : "No");
        }
        if (dto.getCoApplicantAddressStreet() != null) {
            dealFields.put("Street_Address_C", dto.getCoApplicantAddressStreet());
            dealFields.put("Address_Line_C", dto.getCoApplicantAddressStreet());
        }
        if (dto.getCoApplicantAddressCity() != null) dealFields.put("City_C", dto.getCoApplicantAddressCity());
        if (dto.getCoApplicantAddressState() != null) dealFields.put("State_C", dto.getCoApplicantAddressState());
        if (dto.getCoApplicantAddressPincode() != null) {
            dealFields.put("Postal_Zip_code_C", dto.getCoApplicantAddressPincode());
            dealFields.put("Zip_C", dto.getCoApplicantAddressPincode());
        }
        if (dto.getCoApplicantAddressCountry() != null) dealFields.put("Country_C", dto.getCoApplicantAddressCountry());

        // Third Applicant
        if (dto.getHasThirdApplicant() != null) {
            dealFields.put("Do_you_have_third_applicant", dto.getHasThirdApplicant());
            dealFields.put("Has_Third_Applicant", dto.getHasThirdApplicant());
        }
        if (dto.getThirdApplicantTitle() != null) {
            dealFields.put("Third_Applicant_Title", dto.getThirdApplicantTitle());
        }
        if (dto.getThirdApplicantFirstName() != null) {
            dealFields.put("Third_Applicant_First_Name", dto.getThirdApplicantFirstName());
        }
        if (dto.getThirdApplicantLastName() != null) {
            dealFields.put("Third_Applicant_Last_Name", dto.getThirdApplicantLastName());
        }
        if (dto.getThirdApplicantGender() != null) {
            dealFields.put("Third_Applicant_Gender", dto.getThirdApplicantGender());
        }
        if (dto.getThirdApplicantAge() != null) {
            try {
                dealFields.put("Third_applicant_age", Integer.parseInt(dto.getThirdApplicantAge().trim()));
            } catch (Exception e) {
                dealFields.put("Third_applicant_age", dto.getThirdApplicantAge());
            }
        }

        String thirdApplicantFullName = ((dto.getThirdApplicantFirstName() != null ? dto.getThirdApplicantFirstName().trim() : "") + " " +
                (dto.getThirdApplicantLastName() != null ? dto.getThirdApplicantLastName().trim() : "")).trim();
        if (!thirdApplicantFullName.isEmpty()) {
            dealFields.put("Third_Applicant", thirdApplicantFullName);
            dealFields.put("Third_Applicant_Name", thirdApplicantFullName);
        }

        if (dto.getThirdApplicantEmail() != null) {
            dealFields.put("Email_T", dto.getThirdApplicantEmail());
            dealFields.put("Third_Applicant_Email", dto.getThirdApplicantEmail());
        }
        if (dto.getThirdApplicantPhone() != null) {
            dealFields.put("Phone_T", dto.getThirdApplicantPhone());
            dealFields.put("Third_Applicant_Phone", dto.getThirdApplicantPhone());
        }
        if (dto.getThirdApplicantDob() != null) {
            String formattedThirdDob = formatDateForZoho(dto.getThirdApplicantDob());
            dealFields.put("DOB_T", formattedThirdDob);
            dealFields.put("Third_Applicant_Date_of_Birth", formattedThirdDob);
        }
        if (dto.getThirdApplicantOccupation() != null) {
            dealFields.put("Third_Applicant_Occupation", dto.getThirdApplicantOccupation());
        }
        if (dto.getThirdApplicantPan() != null) {
            dealFields.put("Third_Applicant_PAN", dto.getThirdApplicantPan().toUpperCase());
        }
        if (dto.getThirdApplicantAadhar() != null) {
            dealFields.put("Third_Applicant_Aadhar", dto.getThirdApplicantAadhar());
        }
        if (dto.getThirdApplicantSoDoWo() != null) {
            dealFields.put("S_o_D_o_W_o_S", dto.getThirdApplicantSoDoWo());
        }
        if (dto.getThirdApplicantFatherSalutation() != null) {
            dealFields.put("Title_S", dto.getThirdApplicantFatherSalutation());
        }
        if (dto.getThirdApplicantFatherFirstName() != null) {
            dealFields.put("First_Name_S", dto.getThirdApplicantFatherFirstName());
            dealFields.put("Third_Applicant_Father_First_Name", dto.getThirdApplicantFatherFirstName());
        }
        if (dto.getThirdApplicantFatherLastName() != null) {
            dealFields.put("Last_Name_S", dto.getThirdApplicantFatherLastName());
            dealFields.put("Third_Applicant_Father_Last_Name", dto.getThirdApplicantFatherLastName());
        }
        if (dto.getThirdApplicantAddressStreet() != null) {
            dealFields.put("Street_Address_T", dto.getThirdApplicantAddressStreet());
            dealFields.put("Address_Line_T", dto.getThirdApplicantAddressStreet());
        }
        if (dto.getThirdApplicantAddressCity() != null) dealFields.put("City_T", dto.getThirdApplicantAddressCity());
        if (dto.getThirdApplicantAddressState() != null) dealFields.put("State_T", dto.getThirdApplicantAddressState());
        if (dto.getThirdApplicantAddressPincode() != null) {
            dealFields.put("Postal_Zip_Code_T", dto.getThirdApplicantAddressPincode());
            dealFields.put("Zip_T", dto.getThirdApplicantAddressPincode());
        }
        if (dto.getThirdApplicantAddressCountry() != null) dealFields.put("Country_T", dto.getThirdApplicantAddressCountry());

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

        String effectivePrimaryName = fullName;
        if (effectivePrimaryName.isEmpty()) {
            effectivePrimaryName = ((primaryApplicant.getFirstName() != null ? primaryApplicant.getFirstName().trim() : "") + " " +
                    (primaryApplicant.getLastName() != null ? primaryApplicant.getLastName().trim() : "")).trim();
        }
        if (effectivePrimaryName.isEmpty()) {
            effectivePrimaryName = "Primary Applicant";
        }
        primaryApplicant.setFullName(effectivePrimaryName);
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

        if (dto.getHasCoApplicant() != null) {
            application.setHasCoApplicant(dto.getHasCoApplicant());

            if ("Yes".equalsIgnoreCase(dto.getHasCoApplicant())) {
                boolean hasCoData = !coApplicantFullName.isEmpty() ||
                        (dto.getCoApplicantEmail() != null && !dto.getCoApplicantEmail().trim().isEmpty()) ||
                        (dto.getCoApplicantPhone() != null && !dto.getCoApplicantPhone().trim().isEmpty()) ||
                        (dto.getCoApplicantPan() != null && !dto.getCoApplicantPan().trim().isEmpty()) ||
                        (dto.getCoApplicantAadhar() != null && !dto.getCoApplicantAadhar().trim().isEmpty());

                KycApplicant coApplicant = application.getApplicants().stream()
                        .filter(a -> a.getApplicantType() == ApplicantType.JOINT_1)
                        .findFirst()
                        .orElse(null);

                if (hasCoData) {
                    if (coApplicant == null) {
                        coApplicant = new KycApplicant();
                        coApplicant.setKycApplication(application);
                        coApplicant.setApplicantType(ApplicantType.JOINT_1);
                        application.getApplicants().add(coApplicant);
                    }

                    if (dto.getTitleA() != null) coApplicant.setSalutation(dto.getTitleA());
                    if (dto.getFirstNameA() != null) coApplicant.setFirstName(dto.getFirstNameA());
                    if (dto.getLastNameA() != null) coApplicant.setLastName(dto.getLastNameA());

                    String effectiveCoName = coApplicantFullName;
                    if (effectiveCoName.isEmpty()) {
                        effectiveCoName = ((coApplicant.getFirstName() != null ? coApplicant.getFirstName().trim() : "") + " " +
                                (coApplicant.getLastName() != null ? coApplicant.getLastName().trim() : "")).trim();
                    }
                    if (effectiveCoName.isEmpty()) {
                        effectiveCoName = "Co-Applicant";
                    }
                    coApplicant.setFullName(effectiveCoName);

                    if (dto.getCoApplicantEmail() != null) coApplicant.setEmail(dto.getCoApplicantEmail());
                    if (dto.getCoApplicantPhone() != null) coApplicant.setPhone(dto.getCoApplicantPhone());
                    if (dto.getCoApplicantDob() != null) coApplicant.setDateOfBirth(dto.getCoApplicantDob());
                    if (dto.getCoApplicantOccupation() != null) coApplicant.setOccupation(dto.getCoApplicantOccupation());
                    if (dto.getCoApplicantPan() != null) coApplicant.setPanNumber(dto.getCoApplicantPan().toUpperCase());
                    if (dto.getCoApplicantAadhar() != null) coApplicant.setAadhaarNumber(dto.getCoApplicantAadhar());

                    if (dto.getSoDoWoA() != null) coApplicant.setGuardianRelation(dto.getSoDoWoA());
                    if (dto.getCoApplicantFatherSalutation() != null) coApplicant.setGuardianSalutation(dto.getCoApplicantFatherSalutation());
                    if (dto.getCoApplicantFatherFirstName() != null) coApplicant.setGuardianFirstName(dto.getCoApplicantFatherFirstName());
                    if (dto.getCoApplicantFatherLastName() != null) coApplicant.setGuardianLastName(dto.getCoApplicantFatherLastName());

                    String coGuardianFullName = ((dto.getCoApplicantFatherFirstName() != null ? dto.getCoApplicantFatherFirstName().trim() : "") + " " +
                            (dto.getCoApplicantFatherLastName() != null ? dto.getCoApplicantFatherLastName().trim() : "")).trim();
                    if (!coGuardianFullName.isEmpty()) coApplicant.setGuardianName(coGuardianFullName);

                    if (dto.getCoApplicantAddressSameAsPrimary() != null) coApplicant.setAddressSameAsPrimary(dto.getCoApplicantAddressSameAsPrimary());
                    if (dto.getCoApplicantAddressStreet() != null) coApplicant.setAddressStreet(dto.getCoApplicantAddressStreet());
                    if (dto.getCoApplicantAddressLine2() != null) coApplicant.setAddressLine2(dto.getCoApplicantAddressLine2());
                    if (dto.getCoApplicantAddressCity() != null) coApplicant.setAddressCity(dto.getCoApplicantAddressCity());
                    if (dto.getCoApplicantAddressState() != null) coApplicant.setAddressState(dto.getCoApplicantAddressState());
                    if (dto.getCoApplicantAddressPincode() != null) coApplicant.setAddressPincode(dto.getCoApplicantAddressPincode());
                    if (dto.getCoApplicantAddressCountry() != null) coApplicant.setAddressCountry(dto.getCoApplicantAddressCountry());
                } else if (coApplicant != null && (coApplicant.getFullName() == null || coApplicant.getFullName().trim().isEmpty())) {
                    application.getApplicants().remove(coApplicant);
                }
            } else {
                application.getApplicants().removeIf(a -> a.getApplicantType() == ApplicantType.JOINT_1);
                application.setHasThirdApplicant("No");
                application.getApplicants().removeIf(a -> a.getApplicantType() == ApplicantType.JOINT_2);
            }
        }

        if (dto.getHasThirdApplicant() != null) {
            application.setHasThirdApplicant(dto.getHasThirdApplicant());

            if ("Yes".equalsIgnoreCase(dto.getHasThirdApplicant()) && "Yes".equalsIgnoreCase(application.getHasCoApplicant())) {
                boolean hasThirdData = !thirdApplicantFullName.isEmpty() ||
                        (dto.getThirdApplicantFirstName() != null && !dto.getThirdApplicantFirstName().trim().isEmpty()) ||
                        (dto.getThirdApplicantLastName() != null && !dto.getThirdApplicantLastName().trim().isEmpty()) ||
                        (dto.getThirdApplicantTitle() != null && !dto.getThirdApplicantTitle().trim().isEmpty()) ||
                        (dto.getThirdApplicantEmail() != null && !dto.getThirdApplicantEmail().trim().isEmpty()) ||
                        (dto.getThirdApplicantPhone() != null && !dto.getThirdApplicantPhone().trim().isEmpty()) ||
                        (dto.getThirdApplicantPan() != null && !dto.getThirdApplicantPan().trim().isEmpty()) ||
                        (dto.getThirdApplicantAadhar() != null && !dto.getThirdApplicantAadhar().trim().isEmpty());

                KycApplicant thirdApplicant = application.getApplicants().stream()
                        .filter(a -> a.getApplicantType() == ApplicantType.JOINT_2)
                        .findFirst()
                        .orElse(null);

                if (hasThirdData) {
                    if (thirdApplicant == null) {
                        thirdApplicant = new KycApplicant();
                        thirdApplicant.setKycApplication(application);
                        thirdApplicant.setApplicantType(ApplicantType.JOINT_2);
                        application.getApplicants().add(thirdApplicant);
                    }

                    if (dto.getThirdApplicantTitle() != null) thirdApplicant.setSalutation(dto.getThirdApplicantTitle());
                    if (dto.getThirdApplicantFirstName() != null) thirdApplicant.setFirstName(dto.getThirdApplicantFirstName());
                    if (dto.getThirdApplicantLastName() != null) thirdApplicant.setLastName(dto.getThirdApplicantLastName());

                    String effectiveThirdName = thirdApplicantFullName;
                    if (effectiveThirdName.isEmpty()) {
                        effectiveThirdName = ((thirdApplicant.getFirstName() != null ? thirdApplicant.getFirstName().trim() : "") + " " +
                                (thirdApplicant.getLastName() != null ? thirdApplicant.getLastName().trim() : "")).trim();
                    }
                    if (effectiveThirdName.isEmpty()) {
                        effectiveThirdName = "Third Applicant";
                    }
                    thirdApplicant.setFullName(effectiveThirdName);

                    if (dto.getThirdApplicantEmail() != null) thirdApplicant.setEmail(dto.getThirdApplicantEmail());
                    if (dto.getThirdApplicantPhone() != null) thirdApplicant.setPhone(dto.getThirdApplicantPhone());
                    if (dto.getThirdApplicantDob() != null) thirdApplicant.setDateOfBirth(dto.getThirdApplicantDob());
                    if (dto.getThirdApplicantOccupation() != null) thirdApplicant.setOccupation(dto.getThirdApplicantOccupation());
                    if (dto.getThirdApplicantPan() != null) thirdApplicant.setPanNumber(dto.getThirdApplicantPan().toUpperCase());
                    if (dto.getThirdApplicantAadhar() != null) thirdApplicant.setAadhaarNumber(dto.getThirdApplicantAadhar());

                    if (dto.getThirdApplicantSoDoWo() != null) thirdApplicant.setGuardianRelation(dto.getThirdApplicantSoDoWo());
                    if (dto.getThirdApplicantFatherSalutation() != null) thirdApplicant.setGuardianSalutation(dto.getThirdApplicantFatherSalutation());
                    if (dto.getThirdApplicantFatherFirstName() != null) thirdApplicant.setGuardianFirstName(dto.getThirdApplicantFatherFirstName());
                    if (dto.getThirdApplicantFatherLastName() != null) thirdApplicant.setGuardianLastName(dto.getThirdApplicantFatherLastName());

                    String thirdGuardianFullName = ((dto.getThirdApplicantFatherFirstName() != null ? dto.getThirdApplicantFatherFirstName().trim() : "") + " " +
                            (dto.getThirdApplicantFatherLastName() != null ? dto.getThirdApplicantFatherLastName().trim() : "")).trim();
                    if (!thirdGuardianFullName.isEmpty()) thirdApplicant.setGuardianName(thirdGuardianFullName);

                    if (dto.getThirdApplicantAddressSameAsPrimary() != null) thirdApplicant.setAddressSameAsPrimary(dto.getThirdApplicantAddressSameAsPrimary());
                    if (dto.getThirdApplicantAddressSameAsSecondary() != null) thirdApplicant.setAddressSameAsSecondary(dto.getThirdApplicantAddressSameAsSecondary());
                    if (dto.getThirdApplicantAddressStreet() != null) thirdApplicant.setAddressStreet(dto.getThirdApplicantAddressStreet());
                    if (dto.getThirdApplicantAddressLine2() != null) thirdApplicant.setAddressLine2(dto.getThirdApplicantAddressLine2());
                    if (dto.getThirdApplicantAddressCity() != null) thirdApplicant.setAddressCity(dto.getThirdApplicantAddressCity());
                    if (dto.getThirdApplicantAddressState() != null) thirdApplicant.setAddressState(dto.getThirdApplicantAddressState());
                    if (dto.getThirdApplicantAddressPincode() != null) thirdApplicant.setAddressPincode(dto.getThirdApplicantAddressPincode());
                    if (dto.getThirdApplicantAddressCountry() != null) thirdApplicant.setAddressCountry(dto.getThirdApplicantAddressCountry());
                } else if (thirdApplicant != null && (thirdApplicant.getFullName() == null || thirdApplicant.getFullName().trim().isEmpty())) {
                    application.getApplicants().remove(thirdApplicant);
                }
            } else {
                application.getApplicants().removeIf(a -> a.getApplicantType() == ApplicantType.JOINT_2);
            }
        }

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
        KycApplication application = kycApplicationRepository.findFirstByBookingIdOrderByCreatedAtDesc(dto.getBookingId())
                .orElseThrow(() -> new KycNotFoundException("Booking ID", dto.getBookingId()));

        if (application.getStatus() != KycApplicationStatus.DRAFT &&
                application.getStatus() != KycApplicationStatus.ACTION_REQUIRED &&
                application.getStatus() != KycApplicationStatus.EDIT_ENABLED) {
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
        ensureDocumentSlots(application);

        List<Document> documents = documentRepository.findByKycApplicationId(application.getId());
        return kycApplicationMapper.toResponseDto(application, documents);
    }

    private void ensureDocumentSlots(KycApplication application) {
        List<Document> existingDocs = documentRepository.findByKycApplicationId(application.getId());

        // 1. Primary Applicant Slots
        ensureSlot(application, existingDocs, ApplicantType.PRIMARY, DocumentType.AADHAAR_CARD);
        ensureSlot(application, existingDocs, ApplicantType.PRIMARY, DocumentType.PAN_CARD);
        ensureSlot(application, existingDocs, ApplicantType.PRIMARY, DocumentType.ADDRESS_PROOF);
        ensureSlot(application, existingDocs, ApplicantType.PRIMARY, DocumentType.VOTER_ID);

        // 2. Co-Applicant Slots (JOINT_1)
        if ("Yes".equalsIgnoreCase(application.getHasCoApplicant())) {
            ensureSlot(application, existingDocs, ApplicantType.JOINT_1, DocumentType.AADHAAR_CARD);
            ensureSlot(application, existingDocs, ApplicantType.JOINT_1, DocumentType.PAN_CARD);
            ensureSlot(application, existingDocs, ApplicantType.JOINT_1, DocumentType.ADDRESS_PROOF);
            ensureSlot(application, existingDocs, ApplicantType.JOINT_1, DocumentType.VOTER_ID);
        }

        // 3. Third Applicant Slots (JOINT_2)
        if ("Yes".equalsIgnoreCase(application.getHasCoApplicant()) && "Yes".equalsIgnoreCase(application.getHasThirdApplicant())) {
            ensureSlot(application, existingDocs, ApplicantType.JOINT_2, DocumentType.AADHAAR_CARD);
            ensureSlot(application, existingDocs, ApplicantType.JOINT_2, DocumentType.PAN_CARD);
            ensureSlot(application, existingDocs, ApplicantType.JOINT_2, DocumentType.ADDRESS_PROOF);
            ensureSlot(application, existingDocs, ApplicantType.JOINT_2, DocumentType.VOTER_ID);
        } else {
            existingDocs.stream()
                    .filter(d -> d.getApplicantType() == ApplicantType.JOINT_2 && d.getStatus() == DocumentStatus.ACTIVE)
                    .forEach(d -> {
                        d.setStatus(DocumentStatus.ARCHIVED);
                        d.setKycApplicant(null);
                        documentRepository.save(d);
                    });
            documentRepository.flush();
        }
    }

    private void ensureSlot(KycApplication application, List<Document> existingDocs, ApplicantType applicantType, DocumentType docType) {
        boolean exists = existingDocs.stream()
                .anyMatch(d -> d.getApplicantType() == applicantType && d.getDocumentType() == docType && d.getStatus() == DocumentStatus.ACTIVE);
        if (!exists) {
            com.goodearth.postsales.document.config.DocumentSlotConfig slotConfig =
                    com.goodearth.postsales.document.config.DocumentSlotConfig.getConfig(applicantType, docType);
            KycApplicant applicant = application.getApplicants() != null ? application.getApplicants().stream()
                    .filter(a -> a.getApplicantType() == applicantType)
                    .findFirst()
                    .orElse(null) : null;

            Document newDoc = new Document();
            newDoc.setKycApplication(application);
            newDoc.setKycApplicant(applicant);
            newDoc.setCategory(com.goodearth.postsales.document.entity.DocumentCategory.KYC);
            newDoc.setApplicantType(applicantType);
            newDoc.setDocumentType(docType);
            newDoc.setIsRequired(slotConfig.isRequired());
            newDoc.setStatus(com.goodearth.postsales.document.entity.DocumentStatus.ACTIVE);
            newDoc.setFileName(docType.name() + "_" + applicantType.name() + "_SLOT");
            documentRepository.save(newDoc);
        }
    }

    private void archiveApplicantDocuments(UUID kycApplicationId, ApplicantType applicantType) {
        List<Document> docs = documentRepository.findByKycApplicationId(kycApplicationId).stream()
                .filter(d -> d.getApplicantType() == applicantType)
                .toList();
        for (Document doc : docs) {
            doc.setStatus(DocumentStatus.ARCHIVED);
            doc.setKycApplicant(null);
            documentRepository.save(doc);
        }
        documentRepository.flush();
    }

    private String resolveCanonicalBookingId(String requestedBookingId, String userEmail) {
        if (requestedBookingId != null && !requestedBookingId.isBlank()
                && !"DEFAULT_BOOKING".equalsIgnoreCase(requestedBookingId)
                && !"current".equalsIgnoreCase(requestedBookingId)
                && !requestedBookingId.startsWith("BKG-GUEST")
                && !requestedBookingId.startsWith("BKG-user")) {
            return requestedBookingId.trim();
        }

        UUID activeUnitId = com.goodearth.postsales.client.context.ActiveUnitContext.getActiveUnitId();
        if (activeUnitId != null) {
            Optional<Workflow> wfOpt = workflowRepository.findById(activeUnitId);
            if (wfOpt.isPresent() && wfOpt.get().getProject() != null && wfOpt.get().getProject().getZohoDealId() != null) {
                return wfOpt.get().getProject().getZohoDealId().trim();
            }
        }

        String dealId = com.goodearth.postsales.client.context.ActivePropertyContext.getDealId();
        if (dealId == null || dealId.isBlank()) {
            dealId = com.goodearth.postsales.client.context.ActivePropertyContext.getBookingId();
        }
        if (dealId != null && !dealId.isBlank()) {
            return dealId.trim();
        }

        if (userEmail != null && !userEmail.isBlank() && !"anonymousUser".equalsIgnoreCase(userEmail)) {
            List<com.goodearth.postsales.buyer.entity.Buyer> buyers = buyerRepository.findAllByEmailIgnoreCase(userEmail.trim());
            if (!buyers.isEmpty()) {
                com.goodearth.postsales.buyer.entity.Buyer primaryBuyer = buyers.get(0);
                List<Workflow> wfs = workflowRepository.findByBuyerId(primaryBuyer.getId());
                if (!wfs.isEmpty() && wfs.get(0).getProject() != null && wfs.get(0).getProject().getZohoDealId() != null) {
                    return wfs.get(0).getProject().getZohoDealId().trim();
                }
                if (primaryBuyer.getZohoDealId() != null && !primaryBuyer.getZohoDealId().isBlank()) {
                    return primaryBuyer.getZohoDealId().trim();
                }
            }
            Optional<KycApplication> existingKyc = kycApplicationRepository.findFirstByUserEmailOrderByCreatedAtDesc(userEmail.trim());
            if (existingKyc.isPresent() && existingKyc.get().getBookingId() != null && !existingKyc.get().getBookingId().isBlank()) {
                return existingKyc.get().getBookingId();
            }
        }

        return null;
    }

    private KycApplication getOrCreateKycApplication(String bookingId, String userEmail, String userId) {
        String cleanEmail = (userEmail != null && !userEmail.isBlank() && !"anonymousUser".equalsIgnoreCase(userEmail)) ? userEmail.trim() : null;
        String canonicalBookingId = resolveCanonicalBookingId(bookingId, cleanEmail);

        if (canonicalBookingId == null) {
            throw new com.goodearth.postsales.common.exception.CustomException(
                    "No active booking found for this user.",
                    org.springframework.http.HttpStatus.NOT_FOUND
            );
        }

        Optional<KycApplication> appOpt = Optional.empty();
        if (cleanEmail != null) {
            appOpt = kycApplicationRepository.findFirstByBookingIdAndUserEmailOrderByCreatedAtDesc(canonicalBookingId, cleanEmail);
            if (appOpt.isEmpty() || appOpt.get().getStatus() == KycApplicationStatus.DRAFT) {
                Optional<KycApplication> bookingApp = kycApplicationRepository.findFirstByBookingIdOrderByCreatedAtDesc(canonicalBookingId);
                if (bookingApp.isPresent() && (appOpt.isEmpty() || bookingApp.get().getStatus() != KycApplicationStatus.DRAFT)) {
                    appOpt = bookingApp;
                }
                if (appOpt.isEmpty()) {
                    appOpt = kycApplicationRepository.findFirstByUserEmailOrderByCreatedAtDesc(cleanEmail);
                    if (appOpt.isPresent() && !canonicalBookingId.equalsIgnoreCase(appOpt.get().getBookingId())) {
                        appOpt = Optional.empty();
                    }
                }
            }
        } else {
            appOpt = kycApplicationRepository.findFirstByBookingIdOrderByCreatedAtDesc(canonicalBookingId);
        }

        return appOpt.orElseGet(() -> {
            KycApplication newApp = new KycApplication();
            newApp.setBookingId(canonicalBookingId);
            newApp.setUserEmail(cleanEmail);
            newApp.setUserId(userId);
            newApp.setStatus(KycApplicationStatus.DRAFT);
            newApp.setCompletionPercentage(0);
            return kycApplicationRepository.save(newApp);
        });
    }

    private KycApplication getOrCreateKycApplication(String bookingId) {
        return getOrCreateKycApplication(bookingId, null, null);
    }

    @Override
    @Transactional
    public KycApplicationResponseDto createKycApplication(String bookingId, String userEmail, String userId) {
        String cleanEmail = (userEmail != null && !userEmail.isBlank() && !"anonymousUser".equalsIgnoreCase(userEmail)) ? userEmail.trim() : null;
        String canonicalBookingId = resolveCanonicalBookingId(bookingId, cleanEmail);

        if (canonicalBookingId == null) {
            throw new com.goodearth.postsales.common.exception.CustomException(
                    "No active booking found for this user.",
                    org.springframework.http.HttpStatus.NOT_FOUND
            );
        }

        KycApplication newApp = new KycApplication();
        newApp.setBookingId(canonicalBookingId);
        newApp.setUserEmail(cleanEmail);
        newApp.setUserId(userId);
        newApp.setStatus(KycApplicationStatus.DRAFT);
        newApp.setCompletionPercentage(0);
        KycApplication savedApp = kycApplicationRepository.save(newApp);

        ensureDocumentSlots(savedApp);
        List<Document> documents = documentRepository.findByKycApplicationId(savedApp.getId());
        return kycApplicationMapper.toResponseDto(savedApp, documents);
    }

    @Override
    @Transactional
    public KycApplicationResponseDto getKycApplicationByBooking(String bookingId, String userEmail, String userId) {
        KycApplication application = getOrCreateKycApplication(bookingId, userEmail, userId);
        ensureDocumentSlots(application);

        List<Document> documents = documentRepository.findByKycApplicationId(application.getId());
        return kycApplicationMapper.toResponseDto(application, documents);
    }

    @Override
    @Transactional(readOnly = true)
    public KycValidationSummaryResponseDto validateKyc(String bookingId) {
        KycApplication application = getOrCreateKycApplication(bookingId);
        List<Document> documents = documentRepository.findByKycApplicationId(application.getId());

        KycValidationSummaryResponseDto summary = new KycValidationSummaryResponseDto();
        summary.setBookingId(bookingId);

        // 1. Applicant Combination check
        if ("Yes".equalsIgnoreCase(application.getHasThirdApplicant()) && !"Yes".equalsIgnoreCase(application.getHasCoApplicant())) {
            summary.getMissingItems().add(KycMissingItemDto.builder()
                    .section("APPLICATION")
                    .key("hasThirdApplicant")
                    .requirement("Third Applicant cannot be enabled without enabling Co-Applicant")
                    .build());
        }

        // 2. Primary Applicant PII & Address validation
        KycApplicant primaryApp = application.getApplicants() != null ? application.getApplicants().stream()
                .filter(a -> a.getApplicantType() == ApplicantType.PRIMARY)
                .findFirst()
                .orElse(null) : null;

        validateApplicantDetails(primaryApp, ApplicantType.PRIMARY, "PRIMARY_APPLICANT", summary.getPrimaryApplicantMissingFields(), summary.getMissingItems());
        summary.setPrimaryApplicantComplete(summary.getPrimaryApplicantMissingFields().isEmpty());

        // 3. Co-Applicant PII & Address validation
        if ("Yes".equalsIgnoreCase(application.getHasCoApplicant())) {
            KycApplicant coApp = application.getApplicants() != null ? application.getApplicants().stream()
                    .filter(a -> a.getApplicantType() == ApplicantType.JOINT_1)
                    .findFirst()
                    .orElse(null) : null;

            validateApplicantDetails(coApp, ApplicantType.JOINT_1, "CO_APPLICANT", summary.getCoApplicantMissingFields(), summary.getMissingItems());
            summary.setCoApplicantComplete(summary.getCoApplicantMissingFields().isEmpty());
        } else {
            summary.setCoApplicantComplete(true);
        }

        // 4. Third Applicant PII & Address validation
        if ("Yes".equalsIgnoreCase(application.getHasCoApplicant()) && "Yes".equalsIgnoreCase(application.getHasThirdApplicant())) {
            KycApplicant thirdApp = application.getApplicants() != null ? application.getApplicants().stream()
                    .filter(a -> a.getApplicantType() == ApplicantType.JOINT_2)
                    .findFirst()
                    .orElse(null) : null;

            validateApplicantDetails(thirdApp, ApplicantType.JOINT_2, "THIRD_APPLICANT", summary.getThirdApplicantMissingFields(), summary.getMissingItems());
            summary.setThirdApplicantComplete(summary.getThirdApplicantMissingFields().isEmpty());
        } else {
            summary.setThirdApplicantComplete(true);
        }

        // 5. Mandatory Documents Validation (Aadhaar, PAN, Address Proof mandatory; Voter ID optional)
        validateRequiredDocumentSlot(documents, ApplicantType.PRIMARY, DocumentType.AADHAAR_CARD, "Primary Applicant Aadhaar Card", summary.getDocumentsMissingSlots(), summary.getMissingItems());
        validateRequiredDocumentSlot(documents, ApplicantType.PRIMARY, DocumentType.PAN_CARD, "Primary Applicant PAN Card", summary.getDocumentsMissingSlots(), summary.getMissingItems());
        validateRequiredDocumentSlot(documents, ApplicantType.PRIMARY, DocumentType.ADDRESS_PROOF, "Primary Applicant Address Proof", summary.getDocumentsMissingSlots(), summary.getMissingItems());

        if ("Yes".equalsIgnoreCase(application.getHasCoApplicant())) {
            validateRequiredDocumentSlot(documents, ApplicantType.JOINT_1, DocumentType.AADHAAR_CARD, "Co-Applicant Aadhaar Card", summary.getDocumentsMissingSlots(), summary.getMissingItems());
            validateRequiredDocumentSlot(documents, ApplicantType.JOINT_1, DocumentType.PAN_CARD, "Co-Applicant PAN Card", summary.getDocumentsMissingSlots(), summary.getMissingItems());
            validateRequiredDocumentSlot(documents, ApplicantType.JOINT_1, DocumentType.ADDRESS_PROOF, "Co-Applicant Address Proof", summary.getDocumentsMissingSlots(), summary.getMissingItems());
        }

        if ("Yes".equalsIgnoreCase(application.getHasCoApplicant()) && "Yes".equalsIgnoreCase(application.getHasThirdApplicant())) {
            validateRequiredDocumentSlot(documents, ApplicantType.JOINT_2, DocumentType.AADHAAR_CARD, "Third Applicant Aadhaar Card", summary.getDocumentsMissingSlots(), summary.getMissingItems());
            validateRequiredDocumentSlot(documents, ApplicantType.JOINT_2, DocumentType.PAN_CARD, "Third Applicant PAN Card", summary.getDocumentsMissingSlots(), summary.getMissingItems());
            validateRequiredDocumentSlot(documents, ApplicantType.JOINT_2, DocumentType.ADDRESS_PROOF, "Third Applicant Address Proof", summary.getDocumentsMissingSlots(), summary.getMissingItems());
        }

        summary.setDocumentsComplete(summary.getDocumentsMissingSlots().isEmpty());
        summary.setOverallValid(summary.isPrimaryApplicantComplete() && summary.isCoApplicantComplete() && summary.isThirdApplicantComplete() && summary.isDocumentsComplete() && summary.getMissingItems().isEmpty());

        return summary;
    }

    private void validateApplicantDetails(KycApplicant applicant, ApplicantType type, String sectionName, List<String> missingFields, List<KycMissingItemDto> missingItems) {
        if (applicant == null) {
            missingFields.add("Applicant Record");
            missingItems.add(KycMissingItemDto.builder()
                    .section(sectionName)
                    .key("applicant")
                    .requirement(type + " Applicant information record has not been created")
                    .applicantType(type)
                    .build());
            return;
        }

        checkField(applicant.getSalutation(), "salutation", type + " Applicant Title/Salutation", sectionName, type, missingFields, missingItems);
        checkField(applicant.getFirstName(), "firstName", type + " Applicant First Name", sectionName, type, missingFields, missingItems);
        checkField(applicant.getLastName(), "lastName", type + " Applicant Last Name", sectionName, type, missingFields, missingItems);
        checkField(applicant.getEmail(), "email", type + " Applicant Email", sectionName, type, missingFields, missingItems);
        checkField(applicant.getPhone(), "phone", type + " Applicant Phone Number", sectionName, type, missingFields, missingItems);
        checkField(applicant.getDateOfBirth(), "dateOfBirth", type + " Applicant Date of Birth", sectionName, type, missingFields, missingItems);
        checkField(applicant.getOccupation(), "occupation", type + " Applicant Occupation", sectionName, type, missingFields, missingItems);
        checkField(applicant.getPanNumber(), "panNumber", type + " Applicant PAN Number", sectionName, type, missingFields, missingItems);
        checkField(applicant.getAadhaarNumber(), "aadhaarNumber", type + " Applicant Aadhaar Number", sectionName, type, missingFields, missingItems);
        checkField(applicant.getGuardianRelation(), "guardianRelation", type + " Applicant S/o, D/o, W/o Relation", sectionName, type, missingFields, missingItems);
        checkField(applicant.getGuardianName() != null ? applicant.getGuardianName() : applicant.getGuardianFirstName(), "guardianName", type + " Applicant Father/Spouse Name", sectionName, type, missingFields, missingItems);

        // Address
        checkField(applicant.getAddressStreet(), "addressStreet", type + " Applicant Street Address", sectionName, type, missingFields, missingItems);
        checkField(applicant.getAddressCity(), "addressCity", type + " Applicant Address City", sectionName, type, missingFields, missingItems);
        checkField(applicant.getAddressState(), "addressState", type + " Applicant Address State", sectionName, type, missingFields, missingItems);
        checkField(applicant.getAddressPincode(), "addressPincode", type + " Applicant Address Pincode", sectionName, type, missingFields, missingItems);
        checkField(applicant.getAddressCountry(), "addressCountry", type + " Applicant Address Country", sectionName, type, missingFields, missingItems);
    }

    private void checkField(String val, String key, String label, String section, ApplicantType type, List<String> missingFields, List<KycMissingItemDto> missingItems) {
        if (val == null || val.trim().isEmpty()) {
            missingFields.add(key);
            missingItems.add(KycMissingItemDto.builder()
                    .section(section)
                    .key(key)
                    .requirement(label + " is required")
                    .applicantType(type)
                    .build());
        }
    }

    private void validateRequiredDocumentSlot(List<Document> documents, ApplicantType applicantType, DocumentType docType, String label, List<String> missingSlots, List<KycMissingItemDto> missingItems) {
        boolean hasUploadedVersion = documents.stream()
                .filter(d -> d.getApplicantType() == applicantType && d.getDocumentType() == docType)
                .anyMatch(d -> d.getVersions() != null && d.getVersions().stream().anyMatch(v -> Boolean.TRUE.equals(v.getIsCurrent())));

        if (!hasUploadedVersion) {
            String slotKey = applicantType + "_" + docType;
            missingSlots.add(slotKey);
            missingItems.add(KycMissingItemDto.builder()
                    .section("DOCUMENTS")
                    .key(slotKey)
                    .requirement(label + " document upload is required")
                    .applicantType(applicantType)
                    .build());
        }
    }

    @Override
    @Transactional
    public KycApplicationResponseDto submitKyc(KycSubmitRequestDto dto, String actorId) {
        KycApplication application = kycApplicationRepository.findById(dto.getKycApplicationId())
                .orElseThrow(() -> new KycNotFoundException("KYC Application", dto.getKycApplicationId().toString()));

        // Allowed transitions: DRAFT -> UNDER_REVIEW, ACTION_REQUIRED -> UNDER_REVIEW, EDIT_ENABLED -> UNDER_REVIEW
        if (application.getStatus() != KycApplicationStatus.DRAFT &&
                application.getStatus() != KycApplicationStatus.ACTION_REQUIRED &&
                application.getStatus() != KycApplicationStatus.EDIT_ENABLED) {
            throw new KycInvalidStateTransitionException(application.getStatus().name(), "Submit KYC");
        }

        // Re-run validation immediately before final submission
        KycValidationSummaryResponseDto valSummary = validateKyc(application.getBookingId());
        if (!valSummary.isOverallValid()) {
            String missingMsg = valSummary.getMissingItems() != null && !valSummary.getMissingItems().isEmpty()
                    ? valSummary.getMissingItems().get(0).getRequirement()
                    : "Mandatory KYC requirements or uploads are incomplete.";
            throw new KycValidationException("Cannot submit KYC application: " + missingMsg);
        }

        application.setStatus(KycApplicationStatus.UNDER_REVIEW);
        application.setSubmittedAt(LocalDateTime.now());
        if (dto.getClientNotes() != null) {
            application.setClientNotes(dto.getClientNotes());
        }
        application.setCompletionPercentage(100);

        KycApplication savedApp = kycApplicationRepository.save(application);

        auditService.logEvent(savedApp, KycAuditEventType.KYC_SUBMITTED, actorId, "CLIENT", "KYC application submitted for compliance verification", null);
        auditService.logEvent(savedApp, KycAuditEventType.REVIEW_STARTED, "SYSTEM", "COMPLIANCE_TEAM", "Under Compliance Review", null);

        // Synchronize milestone with Zoho CRM
        zohoKycSyncService.syncKycStatusToCrm(savedApp, "KYC Submitted - Under Review", "Homebuyer submitted complete KYC application.");

        publishKycNotification(savedApp, "UNDER_REVIEW", "KYC submitted for compliance verification.");

        List<Document> documents = documentRepository.findByKycApplicationId(savedApp.getId());
        return kycApplicationMapper.toResponseDto(savedApp, documents);
    }

    private void publishKycNotification(KycApplication application, String status, String remarks) {
        if (application == null || eventPublisher == null) return;
        try {
            KycApplicant primary = application.getApplicants() != null
                    ? application.getApplicants().stream().filter(a -> a.getApplicantType() == ApplicantType.PRIMARY).findFirst().orElse(null)
                    : null;
            String email = primary != null ? primary.getEmail() : null;
            String name = primary != null ? primary.getFullName() : null;

            eventPublisher.publishEvent(new com.goodearth.postsales.notification.event.NotificationEvents.KycStatusChangedEvent(
                    application.getId(),
                    application.getBookingId(),
                    status,
                    email,
                    name,
                    remarks
            ));
        } catch (Exception ex) {
            log.warn("Failed to publish KycStatusChangedEvent: {}", ex.getMessage());
        }
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
    @Transactional
    public KycApplicationResponseDto grantEditAccess(com.goodearth.postsales.kyc.dto.KycGrantEditRequestDto dto, String reviewerId) {
        KycApplication application = kycApplicationRepository.findById(dto.getKycApplicationId())
                .orElseThrow(() -> new KycNotFoundException("KYC Application", dto.getKycApplicationId().toString()));

        application.setStatus(KycApplicationStatus.EDIT_ENABLED);
        application.setEditReason(dto.getReason());
        application.setUpdatedAt(LocalDateTime.now());
        KycApplication savedApp = kycApplicationRepository.save(application);

        auditService.logEvent(savedApp, KycAuditEventType.CHANGES_REQUESTED, reviewerId, "CRM_EXECUTIVE",
                "Granted edit access to buyer: " + dto.getReason(), dto.getReason());

        zohoKycSyncService.syncKycStatusToCrm(savedApp, "KYC Edit Access Granted", "Compliance team granted edit access: " + dto.getReason());
        publishKycNotification(savedApp, "EDIT_ENABLED", dto.getReason());

        List<Document> documents = documentRepository.findByKycApplicationId(savedApp.getId());
        return kycApplicationMapper.toResponseDto(savedApp, documents);
    }

    @Override
    @Transactional
    public KycApplicationResponseDto addInternalNote(com.goodearth.postsales.kyc.dto.KycInternalNoteRequestDto dto, String actorId) {
        KycApplication application = kycApplicationRepository.findById(dto.getKycApplicationId())
                .orElseThrow(() -> new KycNotFoundException("KYC Application", dto.getKycApplicationId().toString()));

        String timestamp = LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        String newNote = String.format("[%s by %s]: %s", timestamp, actorId, dto.getNote());

        String existingNotes = application.getInternalNotes();
        if (existingNotes != null && !existingNotes.trim().isEmpty()) {
            application.setInternalNotes(existingNotes + "\n" + newNote);
        } else {
            application.setInternalNotes(newNote);
        }
        application.setUpdatedAt(LocalDateTime.now());
        KycApplication savedApp = kycApplicationRepository.save(application);

        auditService.logEvent(savedApp, KycAuditEventType.DRAFT_SAVED, actorId, "CRM_STAFF",
                "Added private internal note", dto.getNote());

        List<Document> documents = documentRepository.findByKycApplicationId(savedApp.getId());
        return kycApplicationMapper.toResponseDto(savedApp, documents);
    }

    @Override
    @Transactional
    public KycApplicationResponseDto resubmitKyc(KycSubmitRequestDto dto, String actorId) {
        KycApplication application = kycApplicationRepository.findById(dto.getKycApplicationId())
                .orElseThrow(() -> new KycNotFoundException("KYC Application", dto.getKycApplicationId().toString()));

        if (application.getStatus() != KycApplicationStatus.EDIT_ENABLED &&
                application.getStatus() != KycApplicationStatus.ACTION_REQUIRED &&
                application.getStatus() != KycApplicationStatus.DRAFT) {
            throw new KycInvalidStateTransitionException(application.getStatus().name(), "Resubmit KYC");
        }

        KycValidationSummaryResponseDto valSummary = validateKyc(application.getBookingId());
        if (!valSummary.isOverallValid()) {
            String missingMsg = valSummary.getMissingItems() != null && !valSummary.getMissingItems().isEmpty()
                    ? valSummary.getMissingItems().get(0).getRequirement()
                    : "Mandatory KYC requirements or uploads are incomplete.";
            throw new KycValidationException("Cannot resubmit KYC application: " + missingMsg);
        }

        log.info("[KYC_RESUBMIT_TRACE]\nBooking ID: {}\nStatus Before: {}\nStatus Target: UNDER_REVIEW",
                application.getBookingId(), application.getStatus());

        application.setStatus(KycApplicationStatus.UNDER_REVIEW);
        application.setSubmittedAt(LocalDateTime.now());
        application.setUpdatedAt(LocalDateTime.now());
        KycApplication savedApp = kycApplicationRepository.save(application);
        kycApplicationRepository.flush();

        KycApplication reloadedApp = kycApplicationRepository.findById(savedApp.getId()).orElse(savedApp);
        log.info("[KYC_RESUBMIT_TRACE]\nEntity ID: {}\nBooking ID: {}\nStatus Saved: {}\nStatus Reloaded: {}\nCompletion %: {}%",
                reloadedApp.getId(), reloadedApp.getBookingId(), savedApp.getStatus(), reloadedApp.getStatus(), reloadedApp.getCompletionPercentage());

        auditService.logEvent(savedApp, KycAuditEventType.KYC_SUBMITTED, actorId, "CLIENT",
                "Buyer resubmitted updated KYC application for review", null);

        // Synchronize updated Deal fields and milestone status note to Zoho CRM
        log.info("[KYC_RESUBMIT_TRACE] Triggering Zoho CRM Deal fields & milestone sync for booking: {}", savedApp.getBookingId());
        boolean dealFieldsSyncSuccess = zohoKycSyncService.syncKycDealFieldsToCrm(savedApp);
        boolean statusNoteSyncSuccess = zohoKycSyncService.syncKycStatusToCrm(savedApp, "KYC Resubmitted", "Buyer updated and resubmitted KYC application.");

        log.info("[KYC_RESUBMIT_TRACE]\nBooking ID: {}\nDeal Fields Sync: {}\nStatus Note Sync: {}\nResubmit Sync Status: SUCCESS",
                savedApp.getBookingId(), dealFieldsSyncSuccess ? "SUCCESS" : "SKIPPED/WARNING", statusNoteSyncSuccess ? "SUCCESS" : "SKIPPED/WARNING");

        List<Document> documents = documentRepository.findByKycApplicationId(savedApp.getId());
        return kycApplicationMapper.toResponseDto(savedApp, documents);
    }

    @Override
    @Transactional(readOnly = true)
    public KycProgressResponseDto getKycProgress(String bookingId) {
        KycApplication application = kycApplicationRepository.findFirstByBookingIdOrderByCreatedAtDesc(bookingId)
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
        KycApplication application = kycApplicationRepository.findFirstByBookingIdOrderByCreatedAtDesc(bookingId)
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
        if (dto == null) return;

        String computedFullName = dto.getFullName();
        if (computedFullName == null || computedFullName.trim().isEmpty()) {
            computedFullName = ((dto.getFirstName() != null ? dto.getFirstName().trim() : "") + " " +
                    (dto.getLastName() != null ? dto.getLastName().trim() : "")).trim();
        }

        boolean hasData = !computedFullName.isEmpty() ||
                (dto.getFirstName() != null && !dto.getFirstName().trim().isEmpty()) ||
                (dto.getLastName() != null && !dto.getLastName().trim().isEmpty()) ||
                (dto.getSalutation() != null && !dto.getSalutation().trim().isEmpty()) ||
                (dto.getEmail() != null && !dto.getEmail().trim().isEmpty()) ||
                (dto.getPhone() != null && !dto.getPhone().trim().isEmpty()) ||
                (dto.getPanNumber() != null && !dto.getPanNumber().trim().isEmpty()) ||
                (dto.getAadhaarNumber() != null && !dto.getAadhaarNumber().trim().isEmpty());

        boolean hasThirdApplicantYes = "Yes".equalsIgnoreCase(application.getHasThirdApplicant());
        boolean hasCoApplicantYes = "Yes".equalsIgnoreCase(application.getHasCoApplicant());

        // Deletion Decision Rules:
        // 1. Delete JOINT_2 if Third Applicant is toggled to No or Co-Applicant is No
        if (type == ApplicantType.JOINT_2 && (!hasThirdApplicantYes || !hasCoApplicantYes)) {
            archiveApplicantDocuments(application.getId(), type);
            List<KycApplicant> existingThirdApps = kycApplicantRepository.findAllByKycApplicationIdAndApplicantType(application.getId(), type);
            for (KycApplicant app : existingThirdApps) {
                kycApplicantRepository.delete(app);
            }
            kycApplicantRepository.flush();
            if (application.getApplicants() != null) {
                application.getApplicants().removeIf(a -> a.getApplicantType() == type);
            }
            return;
        }

        // 2. Delete JOINT_1 if Co-Applicant is toggled to No
        if (type == ApplicantType.JOINT_1 && !hasCoApplicantYes) {
            archiveApplicantDocuments(application.getId(), type);
            List<KycApplicant> existingJointApps = kycApplicantRepository.findAllByKycApplicationIdAndApplicantType(application.getId(), type);
            for (KycApplicant app : existingJointApps) {
                kycApplicantRepository.delete(app);
            }
            kycApplicantRepository.flush();
            if (application.getApplicants() != null) {
                application.getApplicants().removeIf(a -> a.getApplicantType() == type);
            }
            return;
        }

        // 3. Preserve saved JOINT_1 / JOINT_2 data if toggle is Yes, unless record has no name and no data
        if (!hasData && type != ApplicantType.PRIMARY) {
            List<KycApplicant> existingApps = kycApplicantRepository.findAllByKycApplicationIdAndApplicantType(application.getId(), type);
            for (KycApplicant existing : existingApps) {
                if (existing.getFullName() == null || existing.getFullName().trim().isEmpty()) {
                    kycApplicantRepository.delete(existing);
                }
            }
            if (application.getApplicants() != null) {
                application.getApplicants().removeIf(a -> a.getApplicantType() == type && (a.getFullName() == null || a.getFullName().trim().isEmpty()));
            }
            return;
        }

        KycApplicant applicant = kycApplicantRepository.findFirstByKycApplicationIdAndApplicantType(application.getId(), type)
                .orElseGet(() -> {
                    KycApplicant newApp = new KycApplicant();
                    newApp.setKycApplication(application);
                    newApp.setApplicantType(type);
                    return newApp;
                });

        if (!computedFullName.isEmpty()) {
            applicant.setFullName(computedFullName);
        } else if (applicant.getFullName() == null || applicant.getFullName().trim().isEmpty()) {
            applicant.setFullName(type == ApplicantType.PRIMARY ? "Primary Applicant" : (type == ApplicantType.JOINT_1 ? "Co-Applicant" : "Third Applicant"));
        }

        applicant.setSalutation(dto.getSalutation() != null && !dto.getSalutation().trim().isEmpty() ? dto.getSalutation() : (applicant.getSalutation() != null ? applicant.getSalutation() : "Mr."));
        if (dto.getFirstName() != null) applicant.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null) applicant.setLastName(dto.getLastName());
        applicant.setGuardianRelation(dto.getGuardianRelation() != null && !dto.getGuardianRelation().trim().isEmpty() ? dto.getGuardianRelation() : (applicant.getGuardianRelation() != null ? applicant.getGuardianRelation() : "S/O"));
        applicant.setGuardianSalutation(dto.getGuardianSalutation() != null && !dto.getGuardianSalutation().trim().isEmpty() ? dto.getGuardianSalutation() : (applicant.getGuardianSalutation() != null ? applicant.getGuardianSalutation() : "Mr."));
        if (dto.getGuardianFirstName() != null) applicant.setGuardianFirstName(dto.getGuardianFirstName());
        if (dto.getGuardianLastName() != null) applicant.setGuardianLastName(dto.getGuardianLastName());
        if (dto.getGuardianName() != null) applicant.setGuardianName(dto.getGuardianName());
        if (dto.getDateOfBirth() != null) applicant.setDateOfBirth(dto.getDateOfBirth());
        applicant.setGender(dto.getGender() != null && !dto.getGender().trim().isEmpty() ? dto.getGender() : (applicant.getGender() != null ? applicant.getGender() : "Male"));
        if (dto.getAge() != null) applicant.setAge(dto.getAge());
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
            applicant.setAddressCountry(dto.getAddress().getCountry() != null && !dto.getAddress().getCountry().trim().isEmpty() ? dto.getAddress().getCountry() : (applicant.getAddressCountry() != null ? applicant.getAddressCountry() : "India"));
        } else if (applicant.getAddressCountry() == null || applicant.getAddressCountry().trim().isEmpty()) {
            applicant.setAddressCountry("India");
        }

        KycApplicant saved = kycApplicantRepository.saveAndFlush(applicant);
        if (application.getApplicants() == null) {
            application.setApplicants(new java.util.ArrayList<>());
        }
        if (!application.getApplicants().contains(saved)) {
            application.getApplicants().add(saved);
        }
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

    @Override
    @Transactional(readOnly = true)
    public List<KycCopySourceDto> getAvailableKycCopySources(UUID targetWorkflowId, String userEmail) {
        log.info("[KYC_COPY] GET /api/v1/client/kyc/available-sources hit. Target Workflow ID: {}, User Email: {}", targetWorkflowId, userEmail);

        if (userEmail == null || userEmail.isBlank() || "anonymousUser".equalsIgnoreCase(userEmail)) {
            log.warn("[KYC_COPY] User email is empty or anonymous. Returning empty list.");
            return List.of();
        }

        List<Buyer> buyers = buyerRepository.findAllByEmailIgnoreCase(userEmail.trim());
        if (buyers.isEmpty()) {
            log.warn("[KYC_COPY] No buyer found for email: {}. Returning empty list.", userEmail);
            return List.of();
        }

        List<UUID> buyerIds = buyers.stream().map(Buyer::getId).collect(Collectors.toList());
        List<Workflow> buyerWorkflows = new java.util.ArrayList<>();
        for (UUID bId : buyerIds) {
            buyerWorkflows.addAll(workflowRepository.findByBuyerId(bId));
        }

        log.info("[KYC_COPY] Diagnostic Info:\nBuyer Count: {}\nBuyer IDs: {}\nTotal Buyer Workflows: {}",
                buyers.size(), buyerIds, buyerWorkflows.size());

        List<KycApplication> userKycs = kycApplicationRepository.findAllByUserEmailOrderByCreatedAtDesc(userEmail.trim());
        long completedKycCount = userKycs.stream().filter(k -> k.getStatus() == KycApplicationStatus.SUBMITTED
                || k.getStatus() == KycApplicationStatus.APPROVED
                || k.getStatus() == KycApplicationStatus.UNDER_REVIEW
                || (k.getApplicants() != null && k.getApplicants().stream().anyMatch(a -> a.getApplicantType() == ApplicantType.PRIMARY && a.getFullName() != null && !a.getFullName().isBlank()))).count();

        log.info("[KYC_COPY] Diagnostic Info:\nUser Total KYCs in DB: {}\nCompleted/Submitted KYCs Count: {}", userKycs.size(), completedKycCount);

        List<KycCopySourceDto> sources = new java.util.ArrayList<>();
        Set<UUID> processedWorkflows = new java.util.HashSet<>();

        for (Workflow wf : buyerWorkflows) {
            log.info("[KYC_COPY] Inspecting Workflow ID: {}, Deal ID: {}, Project Name: {}, Unit Location: {}",
                    wf.getId(),
                    wf.getProject() != null ? wf.getProject().getZohoDealId() : "N/A",
                    wf.getProject() != null ? wf.getProject().getProjectName() : "N/A",
                    wf.getProject() != null ? wf.getProject().getLocation() : "N/A");

            if (targetWorkflowId != null && targetWorkflowId.equals(wf.getId())) {
                log.info("[KYC_COPY] Skipping target workflow ID: {}", targetWorkflowId);
                continue;
            }

            if (processedWorkflows.contains(wf.getId())) {
                continue;
            }
            processedWorkflows.add(wf.getId());

            String dealId = (wf.getProject() != null && wf.getProject().getZohoDealId() != null)
                    ? wf.getProject().getZohoDealId()
                    : (wf.getBuyer() != null ? wf.getBuyer().getZohoDealId() : null);

            String unitName = (wf.getProject() != null && wf.getProject().getLocation() != null && !wf.getProject().getLocation().isBlank())
                    ? wf.getProject().getLocation()
                    : (wf.getBuyer() != null && wf.getBuyer().getUnitName() != null ? wf.getBuyer().getUnitName() : "Unit");

            String projectName = (wf.getProject() != null && wf.getProject().getProjectName() != null)
                    ? wf.getProject().getProjectName()
                    : "GoodEarth Community";

            Optional<KycApplication> kycOpt = Optional.empty();
            if (dealId != null && !dealId.isBlank()) {
                kycOpt = kycApplicationRepository.findFirstByBookingIdOrderByCreatedAtDesc(dealId);
            }
            if (kycOpt.isEmpty() && unitName != null && !unitName.isBlank()) {
                kycOpt = kycApplicationRepository.findFirstByBookingIdOrderByCreatedAtDesc(unitName);
            }
            if (kycOpt.isEmpty()) {
                kycOpt = kycApplicationRepository.findFirstByBookingIdOrderByCreatedAtDesc(wf.getId().toString());
            }

            if (kycOpt.isPresent()) {
                KycApplication kyc = kycOpt.get();
                boolean hasPrimary = kyc.getApplicants() != null && kyc.getApplicants().stream()
                        .anyMatch(a -> a.getApplicantType() == ApplicantType.PRIMARY && a.getFullName() != null && !a.getFullName().isBlank());

                log.info("[KYC_COPY] Evaluated Workflow {}: KYC Application ID={}, Booking ID={}, Status={}, Has Primary={}",
                        wf.getId(), kyc.getId(), kyc.getBookingId(), kyc.getStatus(), hasPrimary);

                if (hasPrimary || kyc.getStatus() == KycApplicationStatus.SUBMITTED
                        || kyc.getStatus() == KycApplicationStatus.APPROVED
                        || kyc.getStatus() == KycApplicationStatus.UNDER_REVIEW) {

                    KycCopySourceDto sourceDto = KycCopySourceDto.builder()
                            .workflowId(wf.getId())
                            .bookingId(kyc.getBookingId() != null ? kyc.getBookingId() : (dealId != null ? dealId : wf.getId().toString()))
                            .unitName(unitName)
                            .projectName(projectName)
                            .status(kyc.getStatus() != null ? kyc.getStatus().name() : "APPROVED")
                            .submittedAt(kyc.getSubmittedAt() != null ? kyc.getSubmittedAt() : kyc.getCreatedAt())
                            .applicationDate(kyc.getApplicationDate())
                            .build();

                    sources.add(sourceDto);
                    log.info("[KYC_COPY] Added valid copy source: WorkflowId={}, UnitName={}, Status={}", wf.getId(), unitName, sourceDto.getStatus());
                }
            } else {
                log.info("[KYC_COPY] No KYC application found for workflow ID: {} (Checked keys: dealId={}, unitName={})", wf.getId(), dealId, unitName);
            }
        }

        log.info("[KYC_COPY] FINAL SUMMARY for Buyer {}: Target Workflow={}, Total Sources Found={}",
                userEmail, targetWorkflowId, sources.size());
        return sources;
    }

    @Override
    @Transactional
    public KycApplicationResponseDto copyKycFromSource(UUID targetWorkflowId, KycCopyRequestDto request, String actorId) {
        if (request == null || request.getSourceWorkflowId() == null) {
            throw new KycValidationException("Source workflow ID is required to copy KYC.");
        }
        UUID sourceWorkflowId = request.getSourceWorkflowId();

        Workflow targetWf = workflowRepository.findById(targetWorkflowId)
                .orElseThrow(() -> new KycNotFoundException("Target workflow not found: " + targetWorkflowId));
        Buyer buyer = targetWf.getBuyer();
        if (buyer == null) {
            throw new KycValidationException("Target workflow is not associated with a valid buyer.");
        }

        Workflow sourceWf = workflowRepository.findById(sourceWorkflowId)
                .orElseThrow(() -> new KycNotFoundException("Source workflow not found: " + sourceWorkflowId));
        if (sourceWf.getBuyer() == null || !sourceWf.getBuyer().getId().equals(buyer.getId())) {
            throw new KycValidationException("Security Error: You can only copy KYC from properties owned by the same buyer.");
        }

        String sourceDealId = sourceWf.getProject() != null ? sourceWf.getProject().getZohoDealId() : null;
        String sourceUnitName = (sourceWf.getProject() != null && sourceWf.getProject().getLocation() != null && !sourceWf.getProject().getLocation().isBlank())
                ? sourceWf.getProject().getLocation()
                : (sourceWf.getBuyer() != null ? sourceWf.getBuyer().getUnitName() : null);

        log.info("[KYC_COPY_TRACE] STEP 1: Resolving Source KycApplication. Search keys: dealId={}, unitName={}, workflowId={}",
                sourceDealId, sourceUnitName, sourceWorkflowId);

        Optional<KycApplication> sourceKycOpt = Optional.empty();
        if (sourceDealId != null && !sourceDealId.isBlank()) {
            sourceKycOpt = kycApplicationRepository.findFirstByBookingIdOrderByCreatedAtDesc(sourceDealId);
        }
        if (sourceKycOpt.isEmpty() && sourceUnitName != null && !sourceUnitName.isBlank()) {
            sourceKycOpt = kycApplicationRepository.findFirstByBookingIdOrderByCreatedAtDesc(sourceUnitName);
        }
        if (sourceKycOpt.isEmpty()) {
            sourceKycOpt = kycApplicationRepository.findFirstByBookingIdOrderByCreatedAtDesc(sourceWorkflowId.toString());
        }

        KycApplication sourceKyc = sourceKycOpt.orElseThrow(() -> new KycNotFoundException(
                "No KYC record found for source property (Checked dealId=" + sourceDealId + ", unit=" + sourceUnitName + ", wf=" + sourceWorkflowId + ")"));

        KycApplicant sourcePrimary = sourceKyc.getApplicants() != null ? sourceKyc.getApplicants().stream()
                .filter(a -> a.getApplicantType() == ApplicantType.PRIMARY)
                .findFirst().orElse(null) : null;

        log.info("[KYC_COPY_TRACE] STEP 1 LOG - Loaded Source Entity ID: {}, BookingId: {}, Primary FullName: '{}', PAN: '{}', Aadhaar: '{}', City: '{}', Pincode: '{}'",
                sourceKyc.getId(), sourceKyc.getBookingId(),
                sourcePrimary != null ? sourcePrimary.getFullName() : "NULL",
                sourcePrimary != null ? sourcePrimary.getPanNumber() : "NULL",
                sourcePrimary != null ? sourcePrimary.getAadhaarNumber() : "NULL",
                sourcePrimary != null && sourcePrimary.getAddressCity() != null ? sourcePrimary.getAddressCity() : "NULL",
                sourcePrimary != null && sourcePrimary.getAddressPincode() != null ? sourcePrimary.getAddressPincode() : "NULL");

        String targetDealId = targetWf.getProject() != null ? targetWf.getProject().getZohoDealId() : null;
        if (targetDealId == null || targetDealId.isBlank()) {
            targetDealId = targetWorkflowId.toString();
        }
        KycApplication targetKyc = getOrCreateKycApplication(targetDealId, buyer.getEmail(), actorId);

        boolean isOverwrite = Boolean.TRUE.equals(request.getOverwrite());
        if (!isOverwrite && (targetKyc.getStatus() == KycApplicationStatus.SUBMITTED
                || targetKyc.getStatus() == KycApplicationStatus.APPROVED)) {
            throw new KycInvalidStateTransitionException(targetKyc.getStatus().name(), "Copy KYC into completed/verified record");
        }

        // Copy Reusable Application Fields
        targetKyc.setConsideringHomeLoan(sourceKyc.getConsideringHomeLoan());
        targetKyc.setHasCoApplicant(sourceKyc.getHasCoApplicant());
        targetKyc.setHasThirdApplicant(sourceKyc.getHasThirdApplicant());
        targetKyc.setClientNotes(sourceKyc.getClientNotes());
        targetKyc.setApplicationDate(sourceKyc.getApplicationDate());
        targetKyc.setStatus(KycApplicationStatus.DRAFT);
        targetKyc.setCompletionPercentage(sourceKyc.getCompletionPercentage());

        kycApplicationRepository.save(targetKyc);

        // Delete existing applicants for target application and clone source applicants
        kycApplicantRepository.deleteAllByKycApplicationId(targetKyc.getId());
        kycApplicantRepository.flush();

        if (targetKyc.getApplicants() != null) {
            targetKyc.getApplicants().clear();
        } else {
            targetKyc.setApplicants(new java.util.ArrayList<>());
        }

        List<KycApplicant> sourceApplicants = sourceKyc.getApplicants();
        if (sourceApplicants != null && !sourceApplicants.isEmpty()) {
            for (KycApplicant srcApp : sourceApplicants) {
                KycApplicant targetApp = new KycApplicant();
                targetApp.setKycApplication(targetKyc);
                targetApp.setApplicantType(srcApp.getApplicantType());
                targetApp.setSalutation(srcApp.getSalutation());
                targetApp.setFirstName(srcApp.getFirstName());
                targetApp.setLastName(srcApp.getLastName());
                targetApp.setFullName(srcApp.getFullName());
                targetApp.setGuardianRelation(srcApp.getGuardianRelation());
                targetApp.setGuardianSalutation(srcApp.getGuardianSalutation());
                targetApp.setGuardianFirstName(srcApp.getGuardianFirstName());
                targetApp.setGuardianLastName(srcApp.getGuardianLastName());
                targetApp.setGuardianName(srcApp.getGuardianName());
                targetApp.setDateOfBirth(srcApp.getDateOfBirth());
                targetApp.setGender(srcApp.getGender());
                targetApp.setAge(srcApp.getAge());
                targetApp.setOccupation(srcApp.getOccupation());
                targetApp.setEmail(srcApp.getEmail());
                targetApp.setPhone(srcApp.getPhone());
                targetApp.setRelation(srcApp.getRelation());
                targetApp.setPanNumber(srcApp.getPanNumber());
                targetApp.setAadhaarNumber(srcApp.getAadhaarNumber());
                targetApp.setAddressStreet(srcApp.getAddressStreet());
                targetApp.setAddressLine2(srcApp.getAddressLine2());
                targetApp.setAddressCity(srcApp.getAddressCity());
                targetApp.setAddressState(srcApp.getAddressState());
                targetApp.setAddressPincode(srcApp.getAddressPincode());
                targetApp.setAddressCountry(srcApp.getAddressCountry());
                targetApp.setAddressSameAsPrimary(srcApp.getAddressSameAsPrimary());
                targetApp.setAddressSameAsSecondary(srcApp.getAddressSameAsSecondary());

                kycApplicantRepository.save(targetApp);
                targetKyc.getApplicants().add(targetApp);
            }
        }
        kycApplicationRepository.saveAndFlush(targetKyc);

        // Clone Uploaded Documents
        List<Document> sourceDocs = documentRepository.findByKycApplicationId(sourceKyc.getId());
        if (sourceDocs != null && !sourceDocs.isEmpty()) {
            for (Document srcDoc : sourceDocs) {
                Document targetDoc = new Document();
                targetDoc.setKycApplication(targetKyc);
                targetDoc.setWorkflow(targetWf);
                targetDoc.setCategory(srcDoc.getCategory());
                targetDoc.setApplicantType(srcDoc.getApplicantType());
                targetDoc.setIsRequired(srcDoc.getIsRequired());
                targetDoc.setWorkDriveFileId(srcDoc.getWorkDriveFileId());
                targetDoc.setFileName(srcDoc.getFileName() != null ? srcDoc.getFileName() : "kyc_document.pdf");
                targetDoc.setDocumentType(srcDoc.getDocumentType() != null ? srcDoc.getDocumentType() : com.goodearth.postsales.document.entity.DocumentType.PASSPORT);
                targetDoc.setMimeType(srcDoc.getMimeType());
                targetDoc.setFileSize(srcDoc.getFileSize());
                targetDoc.setUploadedBy(actorId);
                targetDoc.setUploadedAt(srcDoc.getUploadedAt() != null ? srcDoc.getUploadedAt() : LocalDateTime.now());
                targetDoc.setStatus(srcDoc.getStatus() != null ? srcDoc.getStatus() : com.goodearth.postsales.document.entity.DocumentStatus.ACTIVE);
                targetDoc.setVersion(srcDoc.getVersion() > 0 ? srcDoc.getVersion() : 1);
                targetDoc.setCrmAttachmentId(srcDoc.getCrmAttachmentId());
                targetDoc.setCrmAttachmentName(srcDoc.getCrmAttachmentName());
                targetDoc.setCrmAttachmentUploadedAt(srcDoc.getCrmAttachmentUploadedAt());
                targetDoc.setCrmAttachmentSyncStatus(srcDoc.getCrmAttachmentSyncStatus());

                documentRepository.save(targetDoc);

                if (srcDoc.getVersions() != null && !srcDoc.getVersions().isEmpty()) {
                    for (DocumentVersion srcVer : srcDoc.getVersions()) {
                        DocumentVersion targetVer = new DocumentVersion();
                        targetVer.setDocument(targetDoc);
                        targetVer.setVersionNumber(srcVer.getVersionNumber());
                        targetVer.setFileName(srcVer.getFileName() != null ? srcVer.getFileName() : targetDoc.getFileName());
                        targetVer.setFileSizeBytes(srcVer.getFileSizeBytes());
                        targetVer.setMimeType(srcVer.getMimeType());
                        targetVer.setWorkDriveFileId(srcVer.getWorkDriveFileId());
                        targetVer.setWorkDrivePermalink(srcVer.getWorkDrivePermalink());
                        targetVer.setStatus(srcVer.getStatus() != null ? srcVer.getStatus() : DocumentVersionStatus.SUBMITTED);
                        targetVer.setUploadedBy(actorId);
                        targetVer.setUploadedAt(srcVer.getUploadedAt() != null ? srcVer.getUploadedAt() : LocalDateTime.now());
                        documentVersionRepository.save(targetVer);
                    }
                }
            }
        }

        // Audit Logging
        auditService.logEvent(targetKyc, KycAuditEventType.KYC_CREATED, actorId, "CLIENT",
                "KYC copied from Workflow " + sourceWorkflowId + " (Source Deal: " + sourceDealId + ")", null);

        // STEP 3: Re-read target application directly from database (fresh query, no in-memory cache)
        kycApplicationRepository.flush();
        KycApplication freshTargetEntity = kycApplicationRepository.findById(targetKyc.getId())
                .orElseThrow(() -> new KycNotFoundException("Target KYC not found after save: " + targetKyc.getId()));

        KycApplicant targetPrimary = freshTargetEntity.getApplicants() != null ? freshTargetEntity.getApplicants().stream()
                .filter(a -> a.getApplicantType() == ApplicantType.PRIMARY)
                .findFirst().orElse(null) : null;

        log.info("[KYC_COPY_TRACE] STEP 3 LOG - Saved Target Entity ID: {}, BookingId: {}, Primary FullName: '{}', PAN: '{}', Aadhaar: '{}', City: '{}', Pincode: '{}'",
                freshTargetEntity.getId(), freshTargetEntity.getBookingId(),
                targetPrimary != null ? targetPrimary.getFullName() : "NULL",
                targetPrimary != null ? targetPrimary.getPanNumber() : "NULL",
                targetPrimary != null ? targetPrimary.getAadhaarNumber() : "NULL",
                targetPrimary != null && targetPrimary.getAddressCity() != null ? targetPrimary.getAddressCity() : "NULL",
                targetPrimary != null && targetPrimary.getAddressPincode() != null ? targetPrimary.getAddressPincode() : "NULL");

        // STEP 4: Map to Response DTO using KycApplicationMapper and log final DTO
        List<Document> freshTargetDocs = documentRepository.findByKycApplicationId(freshTargetEntity.getId());
        KycApplicationResponseDto responseDto = kycApplicationMapper.toResponseDto(freshTargetEntity, freshTargetDocs);

        log.info("[KYC_COPY_TRACE] STEP 4 LOG - Returned Mapped DTO ID: {}, BookingId: {}, Primary FullName: '{}', PAN: '{}', City: '{}'",
                responseDto.getKycApplicationId(), responseDto.getBookingId(),
                responseDto.getPrimaryApplicant() != null ? responseDto.getPrimaryApplicant().getFullName() : "NULL",
                responseDto.getPrimaryApplicant() != null ? responseDto.getPrimaryApplicant().getPanNumber() : "NULL",
                responseDto.getPrimaryApplicant() != null && responseDto.getPrimaryApplicant().getAddress() != null ? responseDto.getPrimaryApplicant().getAddress().getCity() : "NULL");

        return responseDto;
    }
}
