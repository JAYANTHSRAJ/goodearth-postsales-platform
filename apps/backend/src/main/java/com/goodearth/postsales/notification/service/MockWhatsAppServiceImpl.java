package com.goodearth.postsales.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class MockWhatsAppServiceImpl implements WhatsAppService {

    private static final Logger log = LoggerFactory.getLogger(MockWhatsAppServiceImpl.class);

    @Override
    public void sendWhatsAppMessage(String toPhone, String message) {
        log.info("[WHATSAPP MESSAGE] Sending WhatsApp to: {} | Message: {}", toPhone, message);
    }
}
