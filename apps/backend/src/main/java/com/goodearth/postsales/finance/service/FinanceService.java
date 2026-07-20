package com.goodearth.postsales.finance.service;

import com.goodearth.postsales.finance.dto.FinancialQuoteDto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface FinanceService {
    FinancialQuoteDto createQuotation(UUID workflowId, UUID changeRequestId, BigDecimal amount, BigDecimal gst, BigDecimal discount, String remarks);
    FinancialQuoteDto acceptQuotation(UUID id);
    FinancialQuoteDto rejectQuotation(UUID id);
    FinancialQuoteDto getQuotation(UUID id);
    List<FinancialQuoteDto> getQuotationsByWorkflow(UUID workflowId);
}
