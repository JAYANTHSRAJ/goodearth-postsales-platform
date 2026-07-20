package com.goodearth.postsales.projectupdate.dto;

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
public class ProjectUpdateDto {
    private UUID id;
    private UUID workflowId;
    private UUID stageId;
    private String stageName;
    private String title;
    private String description;
    private String updateType;
    private BigDecimal progressPercentage;
    private String publishedBy;
    private LocalDateTime publishedAt;
    private boolean isVisibleToClient;
    private String location;
    private LocalDateTime createdAt;
}
