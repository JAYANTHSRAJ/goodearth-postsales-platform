package com.goodearth.postsales.client.dto;

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
public class ClientChangeRequestSummaryDto {
    private UUID id;
    private String annotationId;
    private String status;
    private String priority;
    private BigDecimal estimatedCost;
    private LocalDateTime estimatedCompletionDate;
    private String remarks;
    private LocalDateTime createdAt;
}
