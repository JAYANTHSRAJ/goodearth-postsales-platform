package com.goodearth.postsales.document.dto;

import com.goodearth.postsales.document.entity.DocumentVersionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentVersionDto {

    private UUID versionId;
    private Integer versionNumber;
    private String fileName;
    private Long fileSizeBytes;
    private String mimeType;
    private DocumentVersionStatus status;
    private String rejectionReasonCode;
    private String rejectionComments;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
    private Boolean isCurrent;
}
