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
public class RequestedChangeItemDto {

    @NotNull(message = "Document ID is required")
    private UUID documentId;

    @NotBlank(message = "Reason code is required")
    private String reasonCode;

    @NotBlank(message = "Instructions are required")
    private String instructions;
}
