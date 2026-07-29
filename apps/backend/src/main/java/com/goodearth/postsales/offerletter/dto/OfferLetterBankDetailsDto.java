package com.goodearth.postsales.offerletter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfferLetterBankDetailsDto {
    private String beneficiaryName;
    private String beneficiaryAccountNo;
    private String bankName;
    private String bankAddress;
    private String ifscCode;
}
