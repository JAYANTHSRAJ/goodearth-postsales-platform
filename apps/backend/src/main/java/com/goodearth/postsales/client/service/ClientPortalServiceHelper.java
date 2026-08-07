package com.goodearth.postsales.client.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.client.dto.ClientDrawingSummaryDto;
import com.goodearth.postsales.client.mapper.ClientPortalMapper;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.document.dto.DocumentDto;
import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.document.service.DocumentService;
import com.goodearth.postsales.stage.entity.Stage;
import com.goodearth.postsales.stage.repository.StageRepository;
import com.goodearth.postsales.workdrive.dto.WorkDriveFileVersionDto;
import com.goodearth.postsales.workdrive.entity.WorkDriveFile;
import com.goodearth.postsales.workdrive.entity.WorkDriveFolder;
import com.goodearth.postsales.workdrive.repository.WorkDriveFileRepository;
import com.goodearth.postsales.workdrive.repository.WorkDriveFolderRepository;
import com.goodearth.postsales.workdrive.service.WorkDriveVersionService;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.entity.WorkflowStatus;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import com.goodearth.postsales.buyer.entity.FamilyMember;
import com.goodearth.postsales.buyer.repository.FamilyMemberRepository;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ClientPortalServiceHelper {

    private static final Logger log = LoggerFactory.getLogger(ClientPortalServiceHelper.class);

    private final BuyerRepository buyerRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final WorkflowRepository workflowRepository;
    private final StageRepository stageRepository;
    private final DocumentService documentService;
    private final WorkDriveFolderRepository workDriveFolderRepository;
    private final WorkDriveFileRepository workDriveFileRepository;
    private final WorkDriveVersionService workDriveVersionService;
    private final ClientPortalMapper mapper;

    public ClientPortalServiceHelper(
            BuyerRepository buyerRepository,
            FamilyMemberRepository familyMemberRepository,
            WorkflowRepository workflowRepository,
            StageRepository stageRepository,
            DocumentService documentService,
            WorkDriveFolderRepository workDriveFolderRepository,
            WorkDriveFileRepository workDriveFileRepository,
            WorkDriveVersionService workDriveVersionService,
            ClientPortalMapper mapper) {
        this.buyerRepository = buyerRepository;
        this.familyMemberRepository = familyMemberRepository;
        this.workflowRepository = workflowRepository;
        this.stageRepository = stageRepository;
        this.documentService = documentService;
        this.workDriveFolderRepository = workDriveFolderRepository;
        this.workDriveFileRepository = workDriveFileRepository;
        this.workDriveVersionService = workDriveVersionService;
        this.mapper = mapper;
    }

    public Buyer getAuthenticatedBuyer(UserDetails userDetails) {
        if (userDetails == null) {
            log.warn("[FAMILY_LOGIN] UserDetails is null");
            throw new CustomException("Client is not authenticated", HttpStatus.UNAUTHORIZED);
        }

        String email = userDetails.getUsername();
        
        UUID activeWfId = com.goodearth.postsales.client.context.ActivePropertyContext.getWorkflowId();
        if (activeWfId != null) {
            Optional<Workflow> wfOpt = workflowRepository.findById(activeWfId);
            if (wfOpt.isPresent() && wfOpt.get().getBuyer() != null) {
                Buyer b = wfOpt.get().getBuyer();
                log.info("[FAMILY_LOGIN] Active workflow matched buyer: ID={}, Email={}", b.getId(), b.getEmail());
                return b;
            }
        }

        UUID activeBuyerId = com.goodearth.postsales.client.context.ActivePropertyContext.getBuyerId();
        if (activeBuyerId == null) {
            activeBuyerId = com.goodearth.postsales.client.context.ActiveUnitContext.getActiveUnitId();
        }
        if (activeBuyerId != null) {
            Optional<Buyer> activeBuyerOpt = buyerRepository.findById(activeBuyerId);
            if (activeBuyerOpt.isPresent()) {
                Buyer b = activeBuyerOpt.get();
                log.info("[FAMILY_LOGIN] Active buyer matched ID: ID={}, Email={}", b.getId(), b.getEmail());
                return b;
            }

            Optional<Workflow> wfOpt = workflowRepository.findById(activeBuyerId);
            if (wfOpt.isPresent() && wfOpt.get().getBuyer() != null) {
                Buyer b = wfOpt.get().getBuyer();
                log.info("[FAMILY_LOGIN] Active unit matched workflow buyer: ID={}, Email={}", b.getId(), b.getEmail());
                return b;
            }
        }

        String dealId = com.goodearth.postsales.client.context.ActivePropertyContext.getDealId();
        if (dealId != null && !dealId.isBlank()) {
            Optional<Buyer> buyerOpt = buyerRepository.findFirstByZohoDealId(dealId);
            if (buyerOpt.isPresent()) {
                return buyerOpt.get();
            }
        }

        java.util.Optional<Buyer> buyerOpt = buyerRepository.findFirstByEmailIgnoreCaseOrderByIdDesc(email);
        if (buyerOpt.isPresent()) {
            Buyer b = buyerOpt.get();
            log.info("[FAMILY_LOGIN] Primary buyer found={}", b.getEmail());
            return b;
        }

        java.util.Optional<FamilyMember> familyMemberOpt = familyMemberRepository.findFirstByEmailIgnoreCaseOrderByIdDesc(email);
        if (familyMemberOpt.isPresent()) {
            FamilyMember fm = familyMemberOpt.get();
            Buyer b = fm.getBuyer();
            if (b != null) {
                log.info("[FAMILY_LOGIN] Family member buyer found={}", b.getEmail());
                return b;
            }
        }

        List<Buyer> buyers = buyerRepository.findAll();
        if (!buyers.isEmpty()) {
            Buyer b = buyers.get(0);
            log.info("[FAMILY_LOGIN] Fallback buyer for Admin/Staff: ID={}, Email={}", b.getId(), b.getEmail());
            return b;
        }

        log.warn("[FAMILY_LOGIN] No buyer mapping found for email={}", email);
        throw new CustomException("Buyer record not found for email: " + email, HttpStatus.NOT_FOUND);
    }

    public Workflow getBuyerWorkflow(Buyer buyer) {
        log.info("[AUTH_LOG] ClientPortalServiceHelper.getBuyerWorkflow: Buyer ID = {}", buyer != null ? buyer.getId() : "null");
        if (buyer == null) {
            throw new CustomException("Buyer object is null", HttpStatus.BAD_REQUEST);
        }

        // 1. Check if specific workflowId is present in ActivePropertyContext
        UUID activeWfId = com.goodearth.postsales.client.context.ActivePropertyContext.getWorkflowId();
        if (activeWfId != null) {
            Optional<Workflow> wfOpt = workflowRepository.findById(activeWfId);
            if (wfOpt.isPresent()) {
                log.info("[AUTH_LOG] Resolved workflow by ActivePropertyContext.workflowId: {}", wfOpt.get().getId());
                return wfOpt.get();
            }
        }

        // 2. Check if active bookingId/dealId is present in ActivePropertyContext
        String activeDealId = com.goodearth.postsales.client.context.ActivePropertyContext.getDealId();
        if (activeDealId == null || activeDealId.isBlank()) {
            activeDealId = com.goodearth.postsales.client.context.ActivePropertyContext.getBookingId();
        }
        if (activeDealId != null && !activeDealId.isBlank()) {
            final String targetDealId = activeDealId.trim();
            Optional<Workflow> wfOpt = workflowRepository.findByBuyerId(buyer.getId()).stream()
                    .filter(w -> w.getProject() != null && targetDealId.equalsIgnoreCase(w.getProject().getZohoDealId()))
                    .findFirst();
            if (wfOpt.isPresent()) {
                log.info("[AUTH_LOG] Resolved workflow by ActivePropertyContext.dealId ({}): {}", targetDealId, wfOpt.get().getId());
                return wfOpt.get();
            }
        }

        // 3. Fallback to active workflow or first workflow for buyer
        java.util.Optional<Workflow> activeWfOpt = workflowRepository.findFirstByBuyerIdAndStatus(buyer.getId(), WorkflowStatus.ACTIVE);
        if (activeWfOpt.isPresent()) {
            log.info("[AUTH_LOG] Resolved active workflow: {}", activeWfOpt.get().getId());
            return activeWfOpt.get();
        }

        java.util.Optional<Workflow> anyWfOpt = workflowRepository.findFirstByBuyerId(buyer.getId());
        if (anyWfOpt.isPresent()) {
            log.info("[AUTH_LOG] Resolved first available workflow: {}", anyWfOpt.get().getId());
            return anyWfOpt.get();
        }

        throw new CustomException("No active workflow associated with buyer: " + buyer.getFullName(), HttpStatus.NOT_FOUND);
    }

    public double calculateCompletionPercentage(UUID currentStageId) {
        if (currentStageId == null) {
            return 0.0;
        }
        long totalStages = stageRepository.count();
        if (totalStages == 0) {
            return 0.0;
        }
        Stage currentStage = stageRepository.findById(currentStageId).orElse(null);
        if (currentStage == null) {
            return 0.0;
        }
        return Math.round(((double) currentStage.getSequenceOrder() / totalStages) * 1000.0) / 10.0;
    }

    public ClientDrawingSummaryDto fetchLatestDrawing(UUID workflowId) {
        List<DocumentDto> designDocs = documentService.getDocumentsByWorkflow(workflowId).stream()
                .filter(doc -> doc.getDocumentType() == DocumentType.DESIGN_PLAN)
                .sorted(Comparator.comparing(DocumentDto::getUploadedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        if (designDocs.isEmpty()) {
            return null;
        }

        DocumentDto latestDoc = designDocs.get(0);
        
        Optional<WorkDriveFolder> folderOpt = workDriveFolderRepository.findByWorkflowId(workflowId);
        if (folderOpt.isPresent()) {
            List<WorkDriveFile> files = workDriveFileRepository.findByFolderId(folderOpt.get().getId());
            Optional<WorkDriveFile> matchedFile = files.stream()
                    .filter(f -> f.getDocument() != null && f.getDocument().getId().equals(latestDoc.getId()))
                    .findFirst();

            if (matchedFile.isPresent()) {
                WorkDriveFileVersionDto versionDto = workDriveVersionService.getLatestVersion(matchedFile.get().getId());
                if (versionDto != null) {
                    return mapper.toDrawingSummary(versionDto);
                }
            }
        }

        ClientDrawingSummaryDto fallback = new ClientDrawingSummaryDto();
        fallback.setId(latestDoc.getId());
        fallback.setFileName(latestDoc.getFileName());
        fallback.setVersion(latestDoc.getVersion());
        fallback.setMimeType(latestDoc.getMimeType());
        fallback.setUploadedBy(latestDoc.getUploadedBy());
        fallback.setUploadedAt(latestDoc.getUploadedAt());
        return fallback;
    }
}
