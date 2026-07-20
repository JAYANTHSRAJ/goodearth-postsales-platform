package com.goodearth.postsales.workflow.mapper;

import com.goodearth.postsales.workflow.dto.WorkflowDto;
import com.goodearth.postsales.workflow.entity.Workflow;
import org.springframework.stereotype.Component;

@Component
public class WorkflowMapper {

    public WorkflowDto toDto(Workflow workflow) {
        if (workflow == null) {
            return null;
        }
        WorkflowDto dto = new WorkflowDto();
        dto.setId(workflow.getId());
        if (workflow.getBuyer() != null) {
            dto.setBuyerId(workflow.getBuyer().getId());
            dto.setBuyerName(workflow.getBuyer().getFullName());
        }
        if (workflow.getProject() != null) {
            dto.setProjectId(workflow.getProject().getId());
            dto.setProjectName(workflow.getProject().getProjectName());
        }
        dto.setCurrentStageId(workflow.getCurrentStageId());
        dto.setStatus(workflow.getStatus());
        dto.setStartedAt(workflow.getStartedAt());
        dto.setCompletedAt(workflow.getCompletedAt());
        return dto;
    }
}
