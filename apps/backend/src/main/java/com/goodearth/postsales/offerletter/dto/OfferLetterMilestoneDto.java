package com.goodearth.postsales.offerletter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfferLetterMilestoneDto {
    private Integer sNo;
    private String milestoneName;
    private String paymentPercent;
    private String dueDate;
    private BigDecimal unitTotalAmount;
    private String unitTotalAmountFormatted;
    private BigDecimal gstAmount;
    private String gstAmountFormatted;
    private BigDecimal installmentAmount;
    private String installmentAmountFormatted;
}
