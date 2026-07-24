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
public class KycGrantEditRequestDto {

    @NotNull(message = "KYC Application ID is required")
    private UUID kycApplicationId;

    @NotBlank(message = "Reason for granting edit access is required")
    private String reason;
}
