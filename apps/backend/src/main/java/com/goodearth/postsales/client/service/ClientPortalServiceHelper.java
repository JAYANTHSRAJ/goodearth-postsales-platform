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
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ClientPortalServiceHelper {

    private final BuyerRepository buyerRepository;
    private final WorkflowRepository workflowRepository;
    private final StageRepository stageRepository;
    private final DocumentService documentService;
    private final WorkDriveFolderRepository workDriveFolderRepository;
    private final WorkDriveFileRepository workDriveFileRepository;
    private final WorkDriveVersionService workDriveVersionService;
    private final ClientPortalMapper mapper;

    public ClientPortalServiceHelper(
            BuyerRepository buyerRepository,
            WorkflowRepository workflowRepository,
            StageRepository stageRepository,
            DocumentService documentService,
            WorkDriveFolderRepository workDriveFolderRepository,
            WorkDriveFileRepository workDriveFileRepository,
            WorkDriveVersionService workDriveVersionService,
            ClientPortalMapper mapper) {
        this.buyerRepository = buyerRepository;
        this.workflowRepository = workflowRepository;
        this.stageRepository = stageRepository;
        this.documentService = documentService;
        this.workDriveFolderRepository = workDriveFolderRepository;
        this.workDriveFileRepository = workDriveFileRepository;
        this.workDriveVersionService = workDriveVersionService;
        this.mapper = mapper;
    }

    public Buyer getAuthenticatedBuyer(UserDetails userDetails) {
        System.out.println("[AUTH_LOG] ClientPortalServiceHelper.getAuthenticatedBuyer: userDetails.getUsername() = " + (userDetails != null ? userDetails.getUsername() : "null"));
        if (userDetails == null) {
            throw new CustomException("Client is not authenticated", HttpStatus.UNAUTHORIZED);
        }
        java.util.Optional<Buyer> buyerOpt = buyerRepository.findByEmailIgnoreCase(userDetails.getUsername());
        System.out.println("[AUTH_LOG] ClientPortalServiceHelper.getAuthenticatedBuyer: Buyer found? = " + buyerOpt.isPresent());
        if (buyerOpt.isPresent()) {
            Buyer b = buyerOpt.get();
            System.out.println("[AUTH_LOG] ClientPortalServiceHelper.getAuthenticatedBuyer: Buyer ID = " + b.getId() + ", Buyer Email = " + b.getEmail());
        }
        return buyerOpt.orElseThrow(() -> new CustomException("Buyer record not found for email: " + userDetails.getUsername(), HttpStatus.NOT_FOUND));
    }

    public Workflow getBuyerWorkflow(Buyer buyer) {
        System.out.println("[AUTH_LOG] ClientPortalServiceHelper.getBuyerWorkflow: Buyer ID = " + (buyer != null ? buyer.getId() : "null"));
        if (buyer == null) {
            throw new CustomException("Buyer object is null", HttpStatus.BAD_REQUEST);
        }
        java.util.Optional<Workflow> activeWfOpt = workflowRepository.findFirstByBuyerIdAndStatus(buyer.getId(), WorkflowStatus.ACTIVE);
        System.out.println("[AUTH_LOG] ClientPortalServiceHelper.getBuyerWorkflow: Active workflow found? = " + activeWfOpt.isPresent());
        if (activeWfOpt.isPresent()) {
            System.out.println("[AUTH_LOG] ClientPortalServiceHelper.getBuyerWorkflow: Workflow ID = " + activeWfOpt.get().getId());
            return activeWfOpt.get();
        }

        java.util.Optional<Workflow> anyWfOpt = workflowRepository.findFirstByBuyerId(buyer.getId());
        System.out.println("[AUTH_LOG] ClientPortalServiceHelper.getBuyerWorkflow: Any workflow found? = " + anyWfOpt.isPresent());
        if (anyWfOpt.isPresent()) {
            System.out.println("[AUTH_LOG] ClientPortalServiceHelper.getBuyerWorkflow: Workflow ID = " + anyWfOpt.get().getId());
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
