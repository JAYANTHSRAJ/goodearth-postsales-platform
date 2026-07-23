package com.goodearth.postsales.kyc.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycDraftSaveRequestDto {

    @NotBlank(message = "Booking ID is required")
    private String bookingId;

    private String applicationDate;
    private String consideringHomeLoan;
    private String hasCoApplicant;
    private String hasThirdApplicant;

    @Valid
    private ApplicantDto primaryApplicant;

    @Valid
    private List<ApplicantDto> jointApplicants;
}
