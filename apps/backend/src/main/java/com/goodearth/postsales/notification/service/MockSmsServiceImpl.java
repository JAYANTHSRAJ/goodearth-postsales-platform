package com.goodearth.postsales.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class MockSmsServiceImpl implements SmsService {

    private static final Logger log = LoggerFactory.getLogger(MockSmsServiceImpl.class);

    @Override
    public void sendSmsMessage(String toPhone, String message) {
        log.info("[SMS MESSAGE] Sending SMS to: {} | Message: {}", toPhone, message);
    }
}
