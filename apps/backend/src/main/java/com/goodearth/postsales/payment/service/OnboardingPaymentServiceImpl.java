package com.goodearth.postsales.payment.service;

import com.goodearth.postsales.payment.provider.PaymentProvider;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class OnboardingPaymentServiceImpl implements OnboardingPaymentService {

    private final PaymentProvider paymentProvider;

    public OnboardingPaymentServiceImpl(PaymentProvider paymentProvider) {
        this.paymentProvider = paymentProvider;
    }

    @Override
    public boolean executePayment(String email, BigDecimal amount, String currency, String orderId) {
        return paymentProvider.processPayment(email, amount, currency, orderId);
    }
}
