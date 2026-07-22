package com.goodearth.postsales.client.dto;

import jakarta.validation.Valid;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class KycDraftDto {
    private UUID id;
    private UUID workflowId;
    private UUID buyerId;

    private String applicationDate;
    private String homeLoanRequired;

    @Valid
    private PrimaryApplicantDto primaryApplicant;

    private String hasCoApplicant;
    @Valid
    private CoApplicantDto coApplicant;

    private String hasThirdApplicant;
    @Valid
    private ThirdApplicantDto thirdApplicant;

    private String bankAccountName;
    private String bankName;
    private String bankAccountNumber;
    private String bankIfsc;

    private String taxResidency;
    private String gstinNo;

    private String nomineeName;
    private String nomineeRelation;
    private String nomineeDob;
    private String nomineePhone;
}
