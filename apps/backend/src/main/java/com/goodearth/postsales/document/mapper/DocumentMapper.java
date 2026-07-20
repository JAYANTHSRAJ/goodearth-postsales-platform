package com.goodearth.postsales.document.mapper;

import com.goodearth.postsales.document.dto.DocumentDto;
import com.goodearth.postsales.document.entity.Document;
import org.springframework.stereotype.Component;

@Component
public class DocumentMapper {

    public DocumentDto toDto(Document document) {
        if (document == null) {
            return null;
        }
        DocumentDto dto = new DocumentDto();
        dto.setId(document.getId());
        if (document.getWorkflow() != null) {
            dto.setWorkflowId(document.getWorkflow().getId());
        }
        dto.setWorkDriveFileId(document.getWorkDriveFileId());
        dto.setVersion(document.getVersion());
        dto.setFileName(document.getFileName());
        dto.setDocumentType(document.getDocumentType());
        dto.setMimeType(document.getMimeType());
        dto.setFileSize(document.getFileSize());
        dto.setUploadedBy(document.getUploadedBy());
        dto.setUploadedAt(document.getUploadedAt());
        dto.setStatus(document.getStatus());
        return dto;
    }
}
