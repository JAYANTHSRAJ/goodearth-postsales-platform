package com.goodearth.postsales.kyc.dto;

import jakarta.validation.constraints.AssertTrue;
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
public class KycSubmitRequestDto {

    @NotNull(message = "KYC application ID is required")
    private UUID kycApplicationId;

    @AssertTrue(message = "Declaration must be accepted before submission")
    private Boolean declarationAccepted;

    private String clientNotes;
}
