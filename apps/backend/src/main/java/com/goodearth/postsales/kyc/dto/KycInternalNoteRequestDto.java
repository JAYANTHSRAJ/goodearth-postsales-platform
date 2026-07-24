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
public class KycInternalNoteRequestDto {

    @NotNull(message = "KYC Application ID is required")
    private UUID kycApplicationId;

    @NotBlank(message = "Note content is required")
    private String note;
}
