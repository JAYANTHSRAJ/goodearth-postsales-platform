package com.goodearth.postsales.client.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.client.dto.ClientHomeDetailsDto;
import com.goodearth.postsales.stage.entity.Stage;
import com.goodearth.postsales.stage.repository.StageRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ClientHomeServiceImpl implements ClientHomeService {

    private final ClientPortalServiceHelper helper;
    private final StageRepository stageRepository;
    private final WorkflowRepository workflowRepository;

    public ClientHomeServiceImpl(
            ClientPortalServiceHelper helper, 
            StageRepository stageRepository,
            WorkflowRepository workflowRepository) {
        this.helper = helper;
        this.stageRepository = stageRepository;
        this.workflowRepository = workflowRepository;
    }

    @Override
    public ClientHomeDetailsDto getHomeDetails(UserDetails userDetails, UUID workflowId) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        
        Workflow workflow;
        if (workflowId != null) {
            workflow = workflowRepository.findById(workflowId)
                    .orElseThrow(() -> new CustomException("Workflow not found.", HttpStatus.NOT_FOUND));
        } else {
            workflow = helper.getBuyerWorkflow(buyer);
        }

        Stage currentStage = null;
        if (workflow.getCurrentStageId() != null) {
            currentStage = stageRepository.findById(workflow.getCurrentStageId()).orElse(null);
        }

        ClientHomeDetailsDto homeDetails = new ClientHomeDetailsDto();
        
        String projectName = (workflow.getProject() != null && workflow.getProject().getProjectName() != null)
                ? workflow.getProject().getProjectName()
                : "GoodEarth Community";
        homeDetails.setProject(projectName);
        
        String projectCode = (workflow.getProject() != null && workflow.getProject().getProjectCode() != null)
                ? workflow.getProject().getProjectCode()
                : "GE";
        
        String contactIdTail = (buyer.getZohoContactId() != null && buyer.getZohoContactId().length() > 4)
                ? buyer.getZohoContactId().substring(buyer.getZohoContactId().length() - 4)
                : "001";
        
        String unitNumber = buyer.getUnitName() != null ? buyer.getUnitName() : ("Villa " + projectCode + "-" + contactIdTail);
        homeDetails.setUnitNumber(unitNumber);
        homeDetails.setVilla(unitNumber);
        
        homeDetails.setPrimaryBuyer(buyer.getFullName() != null ? buyer.getFullName() : buyer.getEmail());
        homeDetails.setPrimaryBuyerEmail(buyer.getEmail());
        
        String coApplicant = buyer.getCoApplicantName();
        homeDetails.setCoOwner(coApplicant != null && !coApplicant.isBlank() ? coApplicant : "None Specified");
        
        homeDetails.setBlock("Phase 1 / Block A");
        homeDetails.setUnitType("4 BHK Eco-Luxury Villa");
        homeDetails.setFloor("Ground + 2 Upper Floors");
        homeDetails.setArea("3,850 Sq. Ft.");
        homeDetails.setFacing("East Facing");
        homeDetails.setBedrooms("4 Bedrooms + Maid Suite");
        
        LocalDateTime startedAt = workflow.getStartedAt() != null ? workflow.getStartedAt() : LocalDateTime.now();
        homeDetails.setPurchaseDate(startedAt.toLocalDate().toString());
        
        String handoverDate = startedAt.plusMonths(18).toLocalDate().toString();
        homeDetails.setExpectedHandover(handoverDate);
        homeDetails.setPossessionDate(handoverDate);
        
        homeDetails.setConstructionStatus(currentStage != null ? currentStage.getName() : "Structure Completed");
        homeDetails.setCompletionPercent(helper.calculateCompletionPercentage(workflow.getCurrentStageId()));
        
        return homeDetails;
    }
}
