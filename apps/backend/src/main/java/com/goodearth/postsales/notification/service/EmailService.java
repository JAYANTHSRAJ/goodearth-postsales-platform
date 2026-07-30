package com.goodearth.postsales.notification.service;

public interface EmailService {
    void sendEmail(String toEmail, String subject, String body);
    default void sendEmailWithAttachment(String toEmail, String subject, String body, String fileName, byte[] attachmentBytes, String mimeType) {
        sendEmail(toEmail, subject, body);
    }
}
