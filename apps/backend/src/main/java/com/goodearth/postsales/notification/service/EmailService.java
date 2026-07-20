package com.goodearth.postsales.notification.service;

public interface EmailService {
    void sendEmail(String toEmail, String subject, String body);
}
