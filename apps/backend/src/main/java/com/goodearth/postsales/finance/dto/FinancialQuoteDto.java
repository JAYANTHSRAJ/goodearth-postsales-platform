package com.goodearth.postsales.finance.dto;

import com.goodearth.postsales.finance.entity.QuoteStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class FinancialQuoteDto {
    private UUID id;
    private UUID workflowId;
    private UUID buyerId;
    private String buyerName;
    private UUID changeRequestId;
    private String zohoEstimateId;
    private BigDecimal amount;
    private BigDecimal gst;
    private BigDecimal discount;
    private QuoteStatus status;
    private String remarks;
}
