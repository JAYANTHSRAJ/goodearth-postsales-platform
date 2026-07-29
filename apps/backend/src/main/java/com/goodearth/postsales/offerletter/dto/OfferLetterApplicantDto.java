package com.goodearth.postsales.offerletter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfferLetterApplicantDto {
    private String salutation;
    private String fullName;
    private String label;
}
