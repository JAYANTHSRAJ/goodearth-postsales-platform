package com.goodearth.postsales.client.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.client.dto.ClientHomeDetailsDto;
import com.goodearth.postsales.stage.entity.Stage;
import com.goodearth.postsales.stage.repository.StageRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.springframework.http.HttpStatus;
import com.goodearth.postsales.common.exception.CustomException;

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
    public ClientHomeDetailsDto getHomeDetails(UserDetails userDetails, java.util.UUID workflowId) {
        System.out.println("[HOME_LOG] Entered getHomeDetails()");
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        System.out.println("[HOME_LOG] Buyer loaded: " + (buyer != null ? buyer.getEmail() : "null"));
        
        Workflow workflow;
        if (workflowId != null) {
            System.out.println("[HOME_LOG] Loading workflow by ID: " + workflowId);
            workflow = workflowRepository.findById(workflowId)
                    .orElseThrow(() -> new CustomException("Workflow not found.", HttpStatus.NOT_FOUND));
        } else {
            System.out.println("[HOME_LOG] Loading workflow for buyer");
            workflow = helper.getBuyerWorkflow(buyer);
        }
        System.out.println("[HOME_LOG] Workflow loaded: " + (workflow != null ? workflow.getId() : "null"));

        System.out.println("[HOME_LOG] Fetching current stage ID: " + (workflow != null ? workflow.getCurrentStageId() : "null"));
        Stage currentStage = null;
        if (workflow.getCurrentStageId() != null) {
            currentStage = stageRepository.findById(workflow.getCurrentStageId()).orElse(null);
        }
        System.out.println("[HOME_LOG] Current stage loaded: " + (currentStage != null ? currentStage.getName() : "null"));

        ClientHomeDetailsDto homeDetails = new ClientHomeDetailsDto();
        System.out.println("[HOME_LOG] DTO created");
        
        System.out.println("[HOME_LOG] workflow.getProject(): " + (workflow.getProject() != null ? "exists" : "null"));
        System.out.println("[HOME_LOG] Project Name: " + (workflow.getProject() != null ? workflow.getProject().getProjectName() : "null"));
        homeDetails.setProject(workflow.getProject().getProjectName());
        
        String projectCode = workflow.getProject().getProjectCode() != null ? workflow.getProject().getProjectCode() : "GE";
        System.out.println("[HOME_LOG] Project Code: " + projectCode);
        
        String contactIdTail = buyer.getZohoContactId() != null && buyer.getZohoContactId().length() > 4 
                ? buyer.getZohoContactId().substring(buyer.getZohoContactId().length() - 4) : "001";
        System.out.println("[HOME_LOG] Contact ID Tail: " + contactIdTail);
        
        homeDetails.setVilla("Villa " + projectCode + "-" + contactIdTail);
        System.out.println("[HOME_LOG] Villa: " + homeDetails.getVilla());
        
        homeDetails.setArea("3,850 Sq. Ft.");
        System.out.println("[HOME_LOG] Area: " + homeDetails.getArea());
        
        homeDetails.setFacing("East Facing");
        System.out.println("[HOME_LOG] Facing: " + homeDetails.getFacing());
        
        homeDetails.setPlot("Plot No. " + (Math.abs(buyer.getId().hashCode() % 100) + 1));
        System.out.println("[HOME_LOG] Plot: " + homeDetails.getPlot());
        
        homeDetails.setConstructionStatus(currentStage != null ? currentStage.getName() : "Initiated");
        System.out.println("[HOME_LOG] Construction Status: " + homeDetails.getConstructionStatus());
        
        double completionPercent = helper.calculateCompletionPercentage(workflow.getCurrentStageId());
        System.out.println("[HOME_LOG] Completion Percentage calculated: " + completionPercent);
        homeDetails.setCompletionPercent(completionPercent);
        
        LocalDateTime startedAt = workflow.getStartedAt() != null ? workflow.getStartedAt() : LocalDateTime.now();
        System.out.println("[HOME_LOG] Workflow Started At: " + startedAt);
        homeDetails.setExpectedHandover(startedAt.plusMonths(18).toLocalDate().toString());
        System.out.println("[HOME_LOG] Expected Handover: " + homeDetails.getExpectedHandover());
        
        System.out.println("[HOME_LOG] DTO completely populated");
        System.out.println("[HOME_LOG] Returning DTO");
        return homeDetails;
    }
}
