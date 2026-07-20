package com.goodearth.postsales.payment.provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DummyPaymentProvider implements PaymentProvider {

    private static final Logger log = LoggerFactory.getLogger(DummyPaymentProvider.class);

    @Override
    public String getProviderName() {
        return "DUMMY";
    }

    @Override
    public boolean processPayment(String email, BigDecimal amount, String currency, String orderId) {
        log.info("Processing simulated dummy payment for user: {} | Amount: {} {} | OrderId: {}", 
                email, amount, currency, orderId);
        return true;
    }
}
