package com.goodearth.postsales.client.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class KycStatusResponseDto {
    private UUID workflowId;
    private String unitName;
    private UUID kycApplicationId;
    private String status;
    private boolean isLocked;
    private boolean isVerified;
    private LocalDateTime submittedAt;
}
