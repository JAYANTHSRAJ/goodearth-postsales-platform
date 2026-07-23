package com.goodearth.postsales.kyc.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycRequestChangesRequestDto {

    @NotNull(message = "KYC application ID is required")
    private UUID kycApplicationId;

    @NotEmpty(message = "At least one requested change item is required")
    @Valid
    private List<RequestedChangeItemDto> requestedChanges;

    private String generalNotes;
}
