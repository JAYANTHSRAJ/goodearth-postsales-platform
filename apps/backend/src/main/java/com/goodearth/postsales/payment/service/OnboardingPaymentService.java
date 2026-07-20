package com.goodearth.postsales.payment.service;

import java.math.BigDecimal;

public interface OnboardingPaymentService {
    boolean executePayment(String email, BigDecimal amount, String currency, String orderId);
}
