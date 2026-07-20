package com.goodearth.postsales.client.dto;

import com.goodearth.postsales.finance.dto.FinancialQuoteDto;
import com.goodearth.postsales.finance.dto.PaymentScheduleDto;
import com.goodearth.postsales.finance.dto.PaymentReceiptDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClientFinanceDto {
    private List<FinancialQuoteDto> quotes;
    private List<PaymentScheduleDto> invoices;
    private List<PaymentReceiptDto> receipts;
    private BigDecimal outstandingBalance;
}
