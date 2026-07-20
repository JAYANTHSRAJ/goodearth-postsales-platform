package com.goodearth.postsales.annotation.mapper;

import com.goodearth.postsales.annotation.dto.AnnotationCommentDto;
import com.goodearth.postsales.annotation.entity.AnnotationComment;
import org.springframework.stereotype.Component;

@Component
public class AnnotationCommentMapper {

    public AnnotationCommentDto toDto(AnnotationComment entity) {
        if (entity == null) {
            return null;
        }

        AnnotationCommentDto dto = new AnnotationCommentDto();
        dto.setId(entity.getId());
        if (entity.getAnnotation() != null) {
            dto.setAnnotationId(entity.getAnnotation().getId());
        }
        if (entity.getAuthor() != null) {
            dto.setAuthorId(entity.getAuthor().getId());
            dto.setAuthorEmail(entity.getAuthor().getEmail());
        }
        dto.setAuthorRole(entity.getAuthorRole());
        dto.setComment(entity.getComment());
        dto.setCreatedAt(entity.getCreatedAt());

        return dto;
    }
}
