package com.goodearth.postsales.workflow.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.project.entity.Project;
import com.goodearth.postsales.project.repository.ProjectRepository;
import com.goodearth.postsales.workflow.dto.WorkflowDto;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.entity.WorkflowStatus;
import com.goodearth.postsales.workflow.mapper.WorkflowMapper;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WorkflowServiceImpl implements WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final BuyerRepository buyerRepository;
    private final ProjectRepository projectRepository;
    private final WorkflowMapper workflowMapper;

    public WorkflowServiceImpl(
            WorkflowRepository workflowRepository,
            BuyerRepository buyerRepository,
            ProjectRepository projectRepository,
            WorkflowMapper workflowMapper) {
        this.workflowRepository = workflowRepository;
        this.buyerRepository = buyerRepository;
        this.projectRepository = projectRepository;
        this.workflowMapper = workflowMapper;
    }

    @Override
    @Transactional
    public WorkflowDto createWorkflow(UUID buyerId, UUID projectId) {
        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new CustomException("Buyer not found.", HttpStatus.NOT_FOUND));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomException("Project not found.", HttpStatus.NOT_FOUND));

        if (workflowRepository.existsByBuyerIdAndProjectIdAndStatus(buyerId, projectId, WorkflowStatus.ACTIVE)) {
            throw new CustomException("An active workflow already exists for this Buyer and Project.", HttpStatus.CONFLICT);
        }

        if (workflowRepository.existsByBuyerIdAndProjectId(buyerId, projectId)) {
            throw new CustomException("A workflow already exists for this Buyer and Project.", HttpStatus.CONFLICT);
        }

        Workflow workflow = new Workflow();
        workflow.setBuyer(buyer);
        workflow.setProject(project);
        workflow.setStatus(WorkflowStatus.ACTIVE);
        workflow.setStartedAt(LocalDateTime.now());

        Workflow savedWorkflow = workflowRepository.save(workflow);
        return workflowMapper.toDto(savedWorkflow);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDto getWorkflow(UUID id) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new CustomException("Workflow not found.", HttpStatus.NOT_FOUND));
        return workflowMapper.toDto(workflow);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowDto> getAllWorkflows() {
        return workflowRepository.findAll().stream()
                .map(workflowMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WorkflowDto updateWorkflowStatus(UUID id, WorkflowStatus status) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new CustomException("Workflow not found.", HttpStatus.NOT_FOUND));

        workflow.setStatus(status);
        if (status == WorkflowStatus.COMPLETED) {
            workflow.setCompletedAt(LocalDateTime.now());
        }

        Workflow savedWorkflow = workflowRepository.save(workflow);
        return workflowMapper.toDto(savedWorkflow);
    }
}
