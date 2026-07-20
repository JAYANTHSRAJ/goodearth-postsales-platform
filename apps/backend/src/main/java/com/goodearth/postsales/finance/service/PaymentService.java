package com.goodearth.postsales.finance.service;

import com.goodearth.postsales.finance.dto.FinancialSummaryDto;
import com.goodearth.postsales.finance.dto.PaymentScheduleDto;
import com.goodearth.postsales.finance.dto.PaymentReceiptDto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface PaymentService {
    PaymentScheduleDto generateInvoice(UUID workflowId, BigDecimal amount, LocalDateTime dueDate, String remarks);
    List<PaymentScheduleDto> getInvoicesByWorkflow(UUID workflowId);
    List<PaymentReceiptDto> getReceiptsByWorkflow(UUID workflowId);
    FinancialSummaryDto calculateOutstandingBalance(UUID workflowId);
    List<com.goodearth.postsales.finance.dto.PaymentDto> getAllPayments();
    List<PaymentScheduleDto> getAllInvoices();
}
