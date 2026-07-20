package com.goodearth.postsales.finance.dto;

import com.goodearth.postsales.finance.entity.PaymentStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class PaymentReceiptDto {
    private UUID id;
    private UUID workflowId;
    private String zohoPaymentId;
    private BigDecimal amount;
    private PaymentStatus status;
    private LocalDateTime paidDate;
    private String remarks;
}
