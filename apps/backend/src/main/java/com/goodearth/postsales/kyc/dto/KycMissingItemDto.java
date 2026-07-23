package com.goodearth.postsales.kyc.dto;

import com.goodearth.postsales.kyc.entity.ApplicantType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycMissingItemDto {
    private String section;          // "PRIMARY_APPLICANT", "CO_APPLICANT", "THIRD_APPLICANT", "DOCUMENTS", "APPLICATION"
    private String key;              // field name or document slot name e.g. "email", "AADHAAR_CARD"
    private String requirement;      // human-readable message e.g. "Primary Applicant Email is required"
    private ApplicantType applicantType;
}
