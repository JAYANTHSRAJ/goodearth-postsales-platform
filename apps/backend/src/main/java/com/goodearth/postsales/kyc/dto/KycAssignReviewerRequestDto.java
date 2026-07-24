package com.goodearth.postsales.kyc.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycAssignReviewerRequestDto {

    @NotNull(message = "KYC Application ID is required")
    private UUID kycApplicationId;

    @NotBlank(message = "Reviewer user ID or email is required")
    private String reviewerId;

    private String priority;
}
