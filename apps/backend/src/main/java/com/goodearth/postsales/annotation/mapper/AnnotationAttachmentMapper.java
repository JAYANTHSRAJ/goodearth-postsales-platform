package com.goodearth.postsales.annotation.mapper;

import com.goodearth.postsales.annotation.dto.AnnotationAttachmentDto;
import com.goodearth.postsales.annotation.entity.AnnotationAttachment;
import org.springframework.stereotype.Component;

@Component
public class AnnotationAttachmentMapper {

    public AnnotationAttachmentDto toDto(AnnotationAttachment entity) {
        if (entity == null) {
            return null;
        }

        AnnotationAttachmentDto dto = new AnnotationAttachmentDto();
        dto.setId(entity.getId());
        if (entity.getAnnotation() != null) {
            dto.setAnnotationId(entity.getAnnotation().getId());
        }
        dto.setWorkdriveFileId(entity.getWorkdriveFileId());
        dto.setMediaType(entity.getMediaType());

        return dto;
    }
}
