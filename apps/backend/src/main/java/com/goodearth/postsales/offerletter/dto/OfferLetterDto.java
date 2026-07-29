package com.goodearth.postsales.offerletter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfferLetterDto {
    private String offerLetterNo;
    private String offerLetterDate;
    private String projectName;
    private String unitName;

    @Builder.Default
    private List<OfferLetterApplicantDto> applicants = new ArrayList<>();

    // Unit & Area Details (Table 1)
    private String carpetAreaSqm;
    private String superBuiltUpAreaSqm;
    private String exclusiveCommonAreaSqm;
    private String associationCommonAreaSqm;
    private String udsAllotteeSqm;
    private String totalUdsSqm;
    private String exclusiveBalconySqm;
    private String openTerraceSqm;
    private String coveredCarParks;

    // Sale Price Details (Table 2)
    private BigDecimal costOfUnit;
    private String costOfUnitFormatted;
    private String gstRate;
    private BigDecimal gstAmount;
    private String gstAmountFormatted;
    private BigDecimal costOfHome;
    private String costOfHomeFormatted;
    private BigDecimal maintenanceDeposits;
    private String maintenanceDepositsFormatted;
    private String amountInWords;

    // Dynamic Payment Schedule (Table 3)
    @Builder.Default
    private List<OfferLetterMilestoneDto> milestones = new ArrayList<>();
    private String totalMilestonePercent;
    private BigDecimal totalUnitCost;
    private String totalUnitCostFormatted;
    private BigDecimal totalGstAmount;
    private String totalGstAmountFormatted;
    private BigDecimal totalInstallmentCost;
    private String totalInstallmentCostFormatted;

    // Bank Remittance Details (Table 4 & Table 5)
    private OfferLetterBankDetailsDto escrowBankDetails;
    private OfferLetterBankDetailsDto currentBankDetails;

    // General & Legal Details
    @Builder.Default
    private Integer validityDays = 7;
    private String reraNo;
    private String companyName;
}
