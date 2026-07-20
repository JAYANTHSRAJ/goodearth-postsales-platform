package com.goodearth.postsales.payment.provider;

import java.math.BigDecimal;

public interface PaymentProvider {
    String getProviderName();
    boolean processPayment(String email, BigDecimal amount, String currency, String orderId);
}
