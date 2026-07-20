package com.goodearth.postsales.workflow.service;

import com.goodearth.postsales.workflow.dto.WorkflowDto;
import com.goodearth.postsales.workflow.entity.WorkflowStatus;

import java.util.List;
import java.util.UUID;

public interface WorkflowService {
    WorkflowDto createWorkflow(UUID buyerId, UUID projectId);
    WorkflowDto getWorkflow(UUID id);
    List<WorkflowDto> getAllWorkflows();
    WorkflowDto updateWorkflowStatus(UUID id, WorkflowStatus status);
}
