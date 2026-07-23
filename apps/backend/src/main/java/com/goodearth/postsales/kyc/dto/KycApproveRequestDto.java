package com.goodearth.postsales.kyc.dto;

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
public class KycApproveRequestDto {

    @NotNull(message = "KYC application ID is required")
    private UUID kycApplicationId;

    private UUID documentId;

    @NotNull(message = "Approval scope is required (SINGLE_DOCUMENT or FULL_APPLICATION)")
    private String approvalScope;

    private String comments;
}
