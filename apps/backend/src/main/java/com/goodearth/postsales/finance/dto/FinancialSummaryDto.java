package com.goodearth.postsales.finance.dto;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class FinancialSummaryDto {
    private UUID workflowId;
    private BigDecimal totalContractAmount;
    private BigDecimal totalInvoiced;
    private BigDecimal totalPaid;
    private BigDecimal outstandingBalance;
    private List<FinancialQuoteDto> quotations;
    private List<PaymentScheduleDto> invoices;
    private List<PaymentReceiptDto> receipts;
}
