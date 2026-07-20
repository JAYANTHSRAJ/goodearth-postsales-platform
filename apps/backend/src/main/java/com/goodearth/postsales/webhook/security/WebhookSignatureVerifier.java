package com.goodearth.postsales.webhook.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.time.Instant;

@Component
public class WebhookSignatureVerifier {

    private static final Logger log = LoggerFactory.getLogger(WebhookSignatureVerifier.class);

    public boolean verifySignature(String payload, String signatureHeader, String secret, String timestampHeader) {
        if (secret == null || secret.isBlank() || secret.startsWith("mock-")) {
            log.warn("Mock secret detected. Skipping webhook signature verification.");
            return true;
        }

        if (signatureHeader == null || signatureHeader.isBlank()) {
            log.error("Missing signature header.");
            return false;
        }

        // 1. Replay attack prevention: check timestamp if provided
        if (timestampHeader != null && !timestampHeader.isBlank()) {
            try {
                long timestamp = Long.parseLong(timestampHeader);
                long now = Instant.now().getEpochSecond();
                if (Math.abs(now - timestamp) > 300) { // 5 minutes window
                    log.error("Webhook rejected due to replay attack window expiration. Diff: {}s", now - timestamp);
                    return false;
                }
            } catch (NumberFormatException e) {
                log.warn("Invalid timestamp header format: {}", timestampHeader);
            }
        }

        // 2. Validate HMAC-SHA256 signature
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes("UTF-8"), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] rawHmac = mac.doFinal(payload.getBytes("UTF-8"));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : rawHmac) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            String calculatedSignature = hexString.toString();

            // Constant-time comparison
            return MessageDigest.isEqual(calculatedSignature.getBytes("UTF-8"), signatureHeader.getBytes("UTF-8"));
        } catch (Exception e) {
            log.error("Error verifying webhook signature", e);
            return false;
        }
    }
}
