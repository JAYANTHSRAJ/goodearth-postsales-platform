package com.goodearth.postsales.document.mapper;

import com.goodearth.postsales.document.dto.DocumentVersionDto;
import com.goodearth.postsales.document.entity.DocumentVersion;
import org.springframework.stereotype.Component;

@Component
public class DocumentVersionMapper {

    public DocumentVersionDto toDto(DocumentVersion entity) {
        if (entity == null) {
            return null;
        }
        return DocumentVersionDto.builder()
                .versionId(entity.getId())
                .versionNumber(entity.getVersionNumber())
                .fileName(entity.getFileName())
                .fileSizeBytes(entity.getFileSizeBytes())
                .mimeType(entity.getMimeType())
                .status(entity.getStatus())
                .rejectionReasonCode(entity.getRejectionReasonCode())
                .rejectionComments(entity.getRejectionComments())
                .uploadedBy(entity.getUploadedBy())
                .uploadedAt(entity.getUploadedAt())
                .isCurrent(entity.getIsCurrent())
                .build();
    }
}
