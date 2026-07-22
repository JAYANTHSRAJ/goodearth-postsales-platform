package com.goodearth.postsales.client.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class SubmitKycRequestDto {

    @NotNull(message = "Workflow ID is required")
    private UUID workflowId;

    @Valid
    @NotNull(message = "KYC Form payload is required")
    private KycDraftDto form;

    @AssertTrue(message = "You must confirm that all details entered are true and accurate")
    private boolean agreeAccuracy;

    @AssertTrue(message = "You must accept the terms and statutory disclosures")
    private boolean agreeTerms;
}
