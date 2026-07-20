package com.goodearth.postsales.notification.service;

import com.goodearth.postsales.common.exception.CustomException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

public class SmtpEmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailServiceImpl.class);

    private final JavaMailSender mailSender;
    private final String fromEmail;
    private final String mailHost;
    private final String mailPort;

    public SmtpEmailServiceImpl(
            JavaMailSender mailSender,
            String fromEmail,
            String mailHost,
            String mailPort,
            String requireTls,
            String sslSecure) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
        this.mailHost = mailHost;
        this.mailPort = mailPort;

        log.info("SMTP CONFIG");
        log.info("Host={}", mailHost);
        log.info("Port={}", mailPort);
        log.info("TLS={}", requireTls);
        log.info("SSL={}", sslSecure);
    }

    @Override
    public void sendEmail(String toEmail, String subject, String body) {
        log.info("Preparing to send SMTP email to: {} | Subject: {}", toEmail, subject);

        if (mailSender == null) {
            log.error("JavaMailSender is null. SMTP is not fully configured.");
            throw new CustomException("Email delivery failed: SMTP JavaMailSender is not configured", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body.replace("\n", "<br/>"), true); // Send as HTML

            log.info("Connecting to SMTP2GO...");
            log.info("SMTP2GO connection established");
            mailSender.send(message);
            log.info("SMTP2GO email delivered successfully");
        } catch (Exception ex) {
            log.error("Failed to send SMTP email to: {} | Subject: {} | Complete exception details:", toEmail, subject, ex);
            throw new CustomException("Email delivery failed: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
