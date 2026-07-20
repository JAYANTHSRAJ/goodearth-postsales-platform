package com.goodearth.postsales.notification.service;

public interface WhatsAppService {
    void sendWhatsAppMessage(String toPhone, String message);
}
