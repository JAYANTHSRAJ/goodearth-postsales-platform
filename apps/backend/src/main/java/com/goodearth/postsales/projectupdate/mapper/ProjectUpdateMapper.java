package com.goodearth.postsales.projectupdate.mapper;

import com.goodearth.postsales.projectupdate.dto.ProjectUpdateDto;
import com.goodearth.postsales.projectupdate.entity.ProjectUpdate;
import org.springframework.stereotype.Component;

@Component
public class ProjectUpdateMapper {

    public ProjectUpdateDto toDto(ProjectUpdate update) {
        if (update == null) {
            return null;
        }

        ProjectUpdateDto dto = new ProjectUpdateDto();
        dto.setId(update.getId());
        if (update.getWorkflow() != null) {
            dto.setWorkflowId(update.getWorkflow().getId());
        }
        if (update.getStage() != null) {
            dto.setStageId(update.getStage().getId());
            dto.setStageName(update.getStage().getName());
        }
        dto.setTitle(update.getTitle());
        dto.setDescription(update.getDescription());
        dto.setUpdateType(update.getUpdateType().name());
        dto.setProgressPercentage(update.getProgressPercentage());
        dto.setPublishedBy(update.getPublishedBy());
        dto.setPublishedAt(update.getPublishedAt());
        dto.setVisibleToClient(update.isVisibleToClient());
        dto.setLocation(update.getLocation());
        dto.setCreatedAt(update.getCreatedAt());

        return dto;
    }
}
