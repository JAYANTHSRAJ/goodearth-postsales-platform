package com.goodearth.postsales.changerequest.dto;

import com.goodearth.postsales.changerequest.entity.ChangeRequestStatus;
import com.goodearth.postsales.changerequest.entity.Priority;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChangeRequestDto {
    private UUID id;
    private UUID workflowId;
    private UUID documentId;
    private String annotationId;
    private String requestedBy;
    private String assignedTo;
    private ChangeRequestStatus status;
    private Priority priority;
    private BigDecimal estimatedCost;
    private LocalDateTime estimatedCompletionDate;
    private String remarks;
    private String workDriveFileId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
