package com.goodearth.postsales.kyc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycValidationSummaryResponseDto {
    private String bookingId;
    private boolean overallValid;

    private boolean primaryApplicantComplete;
    @Builder.Default
    private List<String> primaryApplicantMissingFields = new ArrayList<>();

    private boolean coApplicantComplete;
    @Builder.Default
    private List<String> coApplicantMissingFields = new ArrayList<>();

    private boolean thirdApplicantComplete;
    @Builder.Default
    private List<String> thirdApplicantMissingFields = new ArrayList<>();

    private boolean documentsComplete;
    @Builder.Default
    private List<String> documentsMissingSlots = new ArrayList<>();

    @Builder.Default
    private List<KycMissingItemDto> missingItems = new ArrayList<>();
}
