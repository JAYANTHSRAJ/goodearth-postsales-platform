package com.goodearth.postsales.notification.service;

import com.goodearth.postsales.common.exception.CustomException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class Smtp2GoApiEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(Smtp2GoApiEmailService.class);

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String fromEmail;

    public Smtp2GoApiEmailService(String apiKey, String fromEmail) {
        this.restTemplate = new RestTemplate();
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        log.info("Smtp2GoApiEmailService initialized. Sender (fromEmail)={}", fromEmail);
    }

    @Override
    public void sendEmail(String toEmail, String subject, String body) {
        log.info("[EMAIL] Sending email to={}", toEmail);
        log.info("[EMAIL] Subject={}", subject);

        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.error("[EMAIL] SMTP2GO_API_KEY is missing or empty");
            throw new CustomException("Email delivery failed: SMTP2GO_API_KEY is missing", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (fromEmail == null || fromEmail.trim().isEmpty()) {
            log.error("[EMAIL] Sender email (SMTP_FROM) is missing or empty");
            throw new CustomException("Email delivery failed: Sender email is missing", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        String url = "https://api.smtp2go.com/v3/email/send";

        Map<String, Object> payload = new HashMap<>();
        payload.put("api_key", apiKey);
        payload.put("sender", fromEmail);
        payload.put("to", Collections.singletonList(toEmail));
        payload.put("subject", subject);
        if (body != null && (body.trim().startsWith("<!DOCTYPE html>") || body.trim().startsWith("<html"))) {
            payload.put("html_body", body);
            payload.put("text_body", stripHtmlTags(body));
        } else {
            payload.put("text_body", body);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            log.info("[EMAIL] Calling SMTP2GO API...");
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            Map<String, Object> responseBody = response.getBody();

            log.info("[EMAIL] SMTP2GO HTTP Status={}", response.getStatusCode());
            log.info("[EMAIL] SMTP2GO Response Body={}", responseBody);

            if (response.getStatusCode().is2xxSuccessful()) {
                if (responseBody != null && responseBody.containsKey("data")) {
                    Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
                    if (data != null && data.containsKey("failed")) {
                        int failed = ((Number) data.get("failed")).intValue();
                        if (failed > 0) {
                            log.error("[EMAIL] SMTP2GO API failed sending to one or more recipients. Complete HTTP response: {}", responseBody);
                            throw new CustomException("Email delivery failed via SMTP2GO API: failed=" + failed, HttpStatus.INTERNAL_SERVER_ERROR);
                        }
                    }
                }
            } else {
                log.error("[EMAIL] SMTP2GO API send failed. HTTP Status: {}. Complete HTTP response: {}", response.getStatusCode(), responseBody);
                throw new CustomException("Email delivery failed via SMTP2GO API: HTTP " + response.getStatusCode(), HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (Exception ex) {
            log.error("[EMAIL] Exception={}", ex.getMessage(), ex);
            throw new CustomException("Email delivery failed: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, ex);
        }
    }

    @Override
    public void sendEmailWithAttachment(String toEmail, String subject, String body, String fileName, byte[] attachmentBytes, String mimeType) {
        log.info("Preparing to send SMTP2GO API email with attachment to: {} | Subject: {} | Attachment: {}", toEmail, subject, fileName);

        if (apiKey == null || apiKey.trim().isEmpty() || fromEmail == null || fromEmail.trim().isEmpty()) {
            log.warn("SMTP configuration missing or incomplete. Skipping email delivery.");
            return;
        }

        String url = "https://api.smtp2go.com/v3/email/send";

        Map<String, Object> payload = new HashMap<>();
        payload.put("api_key", apiKey);
        payload.put("sender", fromEmail);
        payload.put("to", Collections.singletonList(toEmail));
        payload.put("subject", subject);
        if (body != null && (body.trim().startsWith("<!DOCTYPE html>") || body.trim().startsWith("<html"))) {
            payload.put("html_body", body);
            payload.put("text_body", stripHtmlTags(body));
        } else {
            payload.put("text_body", body);
        }

        if (attachmentBytes != null && attachmentBytes.length > 0) {
            String base64Data = java.util.Base64.getEncoder().encodeToString(attachmentBytes);
            Map<String, String> attachmentMap = new HashMap<>();
            attachmentMap.put("filename", fileName);
            attachmentMap.put("fileblob", base64Data);
            attachmentMap.put("mimetype", mimeType != null ? mimeType : "application/pdf");
            payload.put("attachments", Collections.singletonList(attachmentMap));
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            log.info("SMTP2GO API email with attachment delivered successfully to {}. Response: {}", toEmail, response.getBody());
        } catch (Exception ex) {
            log.error("Failed to send SMTP2GO API email with attachment to: {} | Subject: {} | Error: {}", toEmail, subject, ex.getMessage(), ex);
            throw new CustomException("Email delivery failed: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, ex);
        }
    }

    private String stripHtmlTags(String html) {
        if (html == null) return "";
        return html.replaceAll("<style[^>]*>.*?</style>", "")
                   .replaceAll("<script[^>]*>.*?</script>", "")
                   .replaceAll("<br\\s*/?>", "\n")
                   .replaceAll("</p>", "\n\n")
                   .replaceAll("<[^>]+>", "")
                   .replaceAll("&nbsp;", " ")
                   .replaceAll("&amp;", "&")
                   .replaceAll("&lt;", "<")
                   .replaceAll("&gt;", ">")
                   .replaceAll("\n{3,}", "\n\n")
                   .trim();
    }
}
