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
public class KycRejectRequestDto {

    @NotNull(message = "KYC application ID is required")
    private UUID kycApplicationId;

    @NotNull(message = "Document ID is required for rejection")
    private UUID documentId;

    @NotBlank(message = "Rejection reason code is required")
    private String rejectionReasonCode;

    @NotBlank(message = "Explanatory rejection comments are required")
    private String comments;
}
