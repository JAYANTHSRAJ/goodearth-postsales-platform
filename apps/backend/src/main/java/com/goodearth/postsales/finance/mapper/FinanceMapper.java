package com.goodearth.postsales.finance.mapper;

import com.goodearth.postsales.finance.dto.FinancialQuoteDto;
import com.goodearth.postsales.finance.dto.PaymentScheduleDto;
import com.goodearth.postsales.finance.dto.PaymentReceiptDto;
import com.goodearth.postsales.finance.entity.FinancialQuote;
import com.goodearth.postsales.finance.entity.PaymentSchedule;
import com.goodearth.postsales.finance.entity.PaymentReceipt;
import org.springframework.stereotype.Component;

@Component
public class FinanceMapper {

    public FinancialQuoteDto toDto(FinancialQuote entity) {
        if (entity == null) {
            return null;
        }
        FinancialQuoteDto dto = new FinancialQuoteDto();
        dto.setId(entity.getId());
        if (entity.getWorkflow() != null) {
            dto.setWorkflowId(entity.getWorkflow().getId());
        }
        if (entity.getBuyer() != null) {
            dto.setBuyerId(entity.getBuyer().getId());
            dto.setBuyerName(entity.getBuyer().getFullName());
        }
        if (entity.getChangeRequest() != null) {
            dto.setChangeRequestId(entity.getChangeRequest().getId());
        }
        dto.setZohoEstimateId(entity.getZohoEstimateId());
        dto.setAmount(entity.getAmount());
        dto.setGst(entity.getGst());
        dto.setDiscount(entity.getDiscount());
        dto.setStatus(entity.getStatus());
        dto.setRemarks(entity.getRemarks());
        return dto;
    }

    public PaymentScheduleDto toDto(PaymentSchedule entity) {
        if (entity == null) {
            return null;
        }
        PaymentScheduleDto dto = new PaymentScheduleDto();
        dto.setId(entity.getId());
        if (entity.getWorkflow() != null) {
            dto.setWorkflowId(entity.getWorkflow().getId());
        }
        dto.setZohoInvoiceId(entity.getZohoInvoiceId());
        dto.setAmount(entity.getAmount());
        dto.setStatus(entity.getStatus());
        dto.setDueDate(entity.getDueDate());
        dto.setRemarks(entity.getRemarks());
        return dto;
    }

    public PaymentReceiptDto toDto(PaymentReceipt entity) {
        if (entity == null) {
            return null;
        }
        PaymentReceiptDto dto = new PaymentReceiptDto();
        dto.setId(entity.getId());
        if (entity.getWorkflow() != null) {
            dto.setWorkflowId(entity.getWorkflow().getId());
        }
        dto.setZohoPaymentId(entity.getZohoPaymentId());
        dto.setAmount(entity.getAmount());
        dto.setStatus(entity.getStatus());
        dto.setPaidDate(entity.getPaidDate());
        dto.setRemarks(entity.getRemarks());
        return dto;
    }
}
