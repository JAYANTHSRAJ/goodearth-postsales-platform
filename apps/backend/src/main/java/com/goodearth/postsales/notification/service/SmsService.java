package com.goodearth.postsales.notification.service;

public interface SmsService {
    void sendSmsMessage(String toPhone, String message);
}
