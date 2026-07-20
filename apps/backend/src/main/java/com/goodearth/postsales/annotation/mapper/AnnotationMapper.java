package com.goodearth.postsales.annotation.mapper;

import com.goodearth.postsales.annotation.dto.AnnotationDto;
import com.goodearth.postsales.annotation.entity.Annotation;
import org.springframework.stereotype.Component;

@Component
public class AnnotationMapper {

    public AnnotationDto toDto(Annotation entity) {
        if (entity == null) {
            return null;
        }

        AnnotationDto dto = new AnnotationDto();
        dto.setId(entity.getId());
        if (entity.getWorkflow() != null) {
            dto.setWorkflowId(entity.getWorkflow().getId());
        }
        if (entity.getDocument() != null) {
            dto.setDocumentId(entity.getDocument().getId());
        }
        dto.setWorkdriveFileId(entity.getWorkdriveFileId());
        if (entity.getAuthor() != null) {
            dto.setAuthorId(entity.getAuthor().getId());
            dto.setAuthorEmail(entity.getAuthor().getEmail());
        }
        dto.setAuthorRole(entity.getAuthorRole());
        dto.setAnnotationType(entity.getAnnotationType().name());
        dto.setXCoordinate(entity.getXCoordinate());
        dto.setYCoordinate(entity.getYCoordinate());
        dto.setPageNumber(entity.getPageNumber());
        dto.setColor(entity.getColor());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setStatus(entity.getStatus().name());
        dto.setCreatedAt(entity.getCreatedAt());

        return dto;
    }
}
