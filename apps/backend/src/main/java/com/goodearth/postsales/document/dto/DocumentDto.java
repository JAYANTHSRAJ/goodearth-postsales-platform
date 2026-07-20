package com.goodearth.postsales.document.dto;

import com.goodearth.postsales.document.entity.DocumentStatus;
import com.goodearth.postsales.document.entity.DocumentType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDto {
    private UUID id;
    private UUID workflowId;
    private String workDriveFileId;
    private int version;
    private String fileName;
    private DocumentType documentType;
    private String mimeType;
    private Long fileSize;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
    private DocumentStatus status;
}
