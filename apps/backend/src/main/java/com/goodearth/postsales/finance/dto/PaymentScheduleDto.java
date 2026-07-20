package com.goodearth.postsales.finance.dto;

import com.goodearth.postsales.finance.entity.InvoiceStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class PaymentScheduleDto {
    private UUID id;
    private UUID workflowId;
    private String zohoInvoiceId;
    private BigDecimal amount;
    private InvoiceStatus status;
    private LocalDateTime dueDate;
    private String remarks;
}
