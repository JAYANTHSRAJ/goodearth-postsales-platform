package com.goodearth.postsales.sign.dto;

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
public class ZohoSignDto {
    private UUID id;
    private String requestId;
    private UUID workflowId;
    private UUID documentId;
    private String documentName;
    private String recipientEmail;
    private String recipientName;
    private String recipientRole;
    private String requestStatus;
    private String embedUrl;
    private String signUrl;
    private String signedDocumentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
}
