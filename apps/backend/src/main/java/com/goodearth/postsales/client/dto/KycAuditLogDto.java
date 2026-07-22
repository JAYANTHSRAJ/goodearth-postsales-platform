package com.goodearth.postsales.client.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class KycAuditLogDto {
    private UUID id;
    private UUID kycApplicationId;
    private String action;
    private String previousStatus;
    private String newStatus;
    private String performedByUserEmail;
    private LocalDateTime createdAt;
}
