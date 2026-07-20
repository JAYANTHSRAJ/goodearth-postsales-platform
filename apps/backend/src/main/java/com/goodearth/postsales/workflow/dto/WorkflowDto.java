package com.goodearth.postsales.workflow.dto;

import com.goodearth.postsales.workflow.entity.WorkflowStatus;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowDto {
    private UUID id;
    private UUID buyerId;
    private String buyerName;
    private UUID projectId;
    private String projectName;
    private UUID currentStageId;
    private WorkflowStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
