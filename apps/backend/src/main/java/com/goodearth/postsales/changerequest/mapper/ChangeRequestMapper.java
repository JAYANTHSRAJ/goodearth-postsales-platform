package com.goodearth.postsales.changerequest.mapper;

import com.goodearth.postsales.changerequest.dto.ChangeRequestDto;
import com.goodearth.postsales.changerequest.dto.ChangeRequestHistoryDto;
import com.goodearth.postsales.changerequest.entity.ChangeRequest;
import com.goodearth.postsales.changerequest.entity.ChangeRequestHistory;
import org.springframework.stereotype.Component;

@Component
public class ChangeRequestMapper {

    public ChangeRequestDto toDto(ChangeRequest entity) {
        if (entity == null) {
            return null;
        }
        ChangeRequestDto dto = new ChangeRequestDto();
        dto.setId(entity.getId());
        if (entity.getWorkflow() != null) {
            dto.setWorkflowId(entity.getWorkflow().getId());
        }
        if (entity.getDocument() != null) {
            dto.setDocumentId(entity.getDocument().getId());
        }
        dto.setAnnotationId(entity.getAnnotationId());
        dto.setRequestedBy(entity.getRequestedBy());
        dto.setAssignedTo(entity.getAssignedTo());
        dto.setStatus(entity.getStatus());
        dto.setPriority(entity.getPriority());
        dto.setEstimatedCost(entity.getEstimatedCost());
        dto.setEstimatedCompletionDate(entity.getEstimatedCompletionDate());
        dto.setRemarks(entity.getRemarks());
        dto.setWorkDriveFileId(entity.getWorkDriveFileId());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public ChangeRequestHistoryDto toHistoryDto(ChangeRequestHistory entity) {
        if (entity == null) {
            return null;
        }
        ChangeRequestHistoryDto dto = new ChangeRequestHistoryDto();
        dto.setId(entity.getId());
        if (entity.getChangeRequest() != null) {
            dto.setChangeRequestId(entity.getChangeRequest().getId());
        }
        dto.setAction(entity.getAction());
        dto.setPerformedBy(entity.getPerformedBy());
        dto.setOldStatus(entity.getOldStatus());
        dto.setNewStatus(entity.getNewStatus());
        dto.setRemarks(entity.getRemarks());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
