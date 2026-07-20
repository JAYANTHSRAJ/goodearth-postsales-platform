package com.goodearth.postsales.integration.zoho;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.concurrent.locks.ReentrantLock;

@Component
public class ZohoTokenManager {

    private static final Logger log = LoggerFactory.getLogger(ZohoTokenManager.class);

    private final ZohoProperties properties;
    private final RestClient restClient;
    private final ReentrantLock lock = new ReentrantLock();

    private String cachedToken;
    private Instant expiryTime;

    public ZohoTokenManager(ZohoProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.create();
    }

    public String getAccessToken() {
        lock.lock();
        try {
            if (cachedToken == null || isNearExpiry()) {
                refreshAccessToken();
            }
            return cachedToken;
        } finally {
            lock.unlock();
        }
    }

    public void testTokenRefresh() {
        lock.lock();
        try {
            refreshAccessToken();
        } finally {
            lock.unlock();
        }
    }

    private boolean isNearExpiry() {
        if (expiryTime == null) {
            return true;
        }
        // Buffer of 5 minutes (300 seconds)
        return Instant.now().isAfter(expiryTime.minusSeconds(300));
    }

    private void refreshAccessToken() {
        try {
            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("refresh_token", properties.getRefreshToken());
            formData.add("client_id", properties.getClientId());
            formData.add("client_secret", properties.getClientSecret());
            formData.add("grant_type", "refresh_token");

            String tokenUrl = properties.getAccountsUrl() + "/oauth/v2/token";
            log.info("Requesting Zoho access token from URL: {}", tokenUrl);
            log.info("Request headers: Content-Type=application/x-www-form-urlencoded");

            String responseBody = restClient.post()
                    .uri(tokenUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .body(String.class);

            log.info("Zoho OAuth Token Response Body: {}", responseBody);

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            ZohoTokenResponse response = mapper.readValue(responseBody, ZohoTokenResponse.class);

            if (response == null || response.getAccessToken() == null) {
                throw new ZohoAuthenticationException("Failed to retrieve access token. Complete response body: " + responseBody);
            }

            this.cachedToken = response.getAccessToken();
            long expiresSeconds = response.getExpiresIn() != null ? response.getExpiresIn() : 3600;
            this.expiryTime = Instant.now().plusSeconds(expiresSeconds);

        } catch (Exception ex) {
            log.error("OAuth token request failure to URL: {}", properties.getAccountsUrl() + "/oauth/v2/token", ex);
            if (ex instanceof org.springframework.web.client.RestClientResponseException) {
                org.springframework.web.client.RestClientResponseException rre = (org.springframework.web.client.RestClientResponseException) ex;
                log.error("OAuth token request HTTP Status: {} - Response Body: {}", rre.getStatusCode(), rre.getResponseBodyAsString());
            }
            throw new ZohoAuthenticationException("Error refreshing Zoho access token: " + ex.getMessage(), ex);
        }
    }
}
