package com.goodearth.postsales.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDto {
    private UUID id;
    private String buyerName;
    private String unitName;
    private String amount;
    private String status;
    private String transactionId;
    private String paymentDate;
}
