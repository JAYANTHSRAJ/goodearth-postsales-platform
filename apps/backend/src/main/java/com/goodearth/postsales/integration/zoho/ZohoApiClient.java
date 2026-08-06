package com.goodearth.postsales.integration.zoho;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpRequest;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.net.SocketTimeoutException;

@Component
public class ZohoApiClient {

    private static final Logger log = LoggerFactory.getLogger(ZohoApiClient.class);

    private final RestClient restClient;

    public ZohoApiClient(ZohoTokenManager tokenManager) {
        this.restClient = RestClient.builder()
                .requestInterceptor(new ZohoRequestInterceptor(tokenManager))
                .build();
    }

    public RestClient getClient() {
        return this.restClient;
    }

    public <T> T get(String url, Class<T> responseType) {
        try {
            return restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(responseType);
        } catch (Exception ex) {
            handleAndLogException("GET", url, ex);
            throw new ZohoIntegrationException("GET request failed for URL: " + url + " - " + ex.getMessage(), ex);
        }
    }

    public <T> T get(java.net.URI uri, Class<T> responseType) {
        try {
            return restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(responseType);
        } catch (Exception ex) {
            handleAndLogException("GET", uri.toString(), ex);
            throw new ZohoIntegrationException("GET request failed for URI: " + uri + " - " + ex.getMessage(), ex);
        }
    }

    public byte[] downloadWorkDriveFile(String urlOrFileId) {
        try {
            byte[] content = restClient.get()
                    .uri(urlOrFileId)
                    .retrieve()
                    .body(byte[].class);
            if (content != null) {
                log.info("[WORKDRIVE_DOWNLOAD_TRACE] WorkDrive download complete. Length: {} bytes. First 16 bytes: {}",
                        content.length, formatFirstBytes(content, 16));
            }
            return content;
        } catch (Exception ex) {
            handleAndLogException("GET_WORKDRIVE_DOWNLOAD", urlOrFileId, ex);
            throw new ZohoIntegrationException("WorkDrive download failed for URL: " + urlOrFileId + " - " + ex.getMessage(), ex);
        }
    }

    public byte[] downloadCrmAttachment(String url) {
        try {
            return restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(byte[].class);
        } catch (Exception ex) {
            handleAndLogException("GET_CRM_ATTACHMENT_DOWNLOAD", url, ex);
            throw new ZohoIntegrationException("CRM attachment download failed for URL: " + url + " - " + ex.getMessage(), ex);
        }
    }

    public static String formatFirstBytes(byte[] bytes, int count) {
        if (bytes == null || bytes.length == 0) return "EMPTY";
        int len = Math.min(bytes.length, count);
        StringBuilder hex = new StringBuilder();
        StringBuilder ascii = new StringBuilder();
        for (int i = 0; i < len; i++) {
            hex.append(String.format("%02X ", bytes[i]));
            char c = (char) (bytes[i] & 0xFF);
            ascii.append((c >= 32 && c <= 126) ? c : '.');
        }
        return hex.toString().trim() + " | ASCII: '" + ascii.toString() + "'";
    }

    public <T> T post(String url, Object body, Class<T> responseType) {
        try {
            return restClient.post()
                    .uri(url)
                    .body(body)
                    .retrieve()
                    .body(responseType);
        } catch (Exception ex) {
            handleAndLogException("POST", url, ex);
            throw new ZohoIntegrationException("POST request failed for URL: " + url + " - " + ex.getMessage(), ex);
        }
    }

    public <T> T postMultipart(String url, org.springframework.util.MultiValueMap<String, Object> body, Class<T> responseType) {
        try {
            return restClient.post()
                    .uri(url)
                    .contentType(org.springframework.http.MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(responseType);
        } catch (Exception ex) {
            handleAndLogException("POST_MULTIPART", url, ex);
            throw new ZohoIntegrationException("POST multipart request failed for URL: " + url + " - " + ex.getMessage(), ex);
        }
    }

    public <T> T put(String url, Object body, Class<T> responseType) {
        try {
            return restClient.put()
                    .uri(url)
                    .body(body)
                    .retrieve()
                    .body(responseType);
        } catch (Exception ex) {
            handleAndLogException("PUT", url, ex);
            throw new ZohoIntegrationException("PUT request failed for URL: " + url + " - " + ex.getMessage(), ex);
        }
    }

    public <T> T patch(String url, Object body, Class<T> responseType) {
        try {
            return restClient.patch()
                    .uri(url)
                    .body(body)
                    .retrieve()
                    .body(responseType);
        } catch (Exception ex) {
            handleAndLogException("PATCH", url, ex);
            throw new ZohoIntegrationException("PATCH request failed for URL: " + url + " - " + ex.getMessage(), ex);
        }
    }

    public void delete(String url) {
        try {
            restClient.delete()
                    .uri(url)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            handleAndLogException("DELETE", url, ex);
            throw new ZohoIntegrationException("DELETE request failed for URL: " + url + " - " + ex.getMessage(), ex);
        }
    }

    private void handleAndLogException(String method, String url, Exception ex) {
        if (ex instanceof org.springframework.web.client.RestClientResponseException restEx) {
            String responseBody = restEx.getResponseBodyAsString();
            if (responseBody != null && (responseBody.contains("INVALID_QUERY") || responseBody.contains("not available for search"))) {
                log.warn("Zoho CRM returned INVALID_QUERY (unsupported search field) - Method: {}, URL: {}, Response: {}", method, url, responseBody);
                return;
            }
        }

        log.error("Zoho API Integration Error - Method: {}, URL: {}", method, url, ex);

        // 1. HTTP Status & response body
        if (ex instanceof org.springframework.web.client.RestClientResponseException restEx) {
            log.error("Zoho CRM returned HTTP Status: {} ({})", restEx.getStatusCode().value(), restEx.getStatusCode());
            log.error("Zoho response body: {}", restEx.getResponseBodyAsString());
        }

        // 2. Identify OAuth token request failures
        Throwable cause = ex;
        while (cause != null) {
            if (cause instanceof ZohoAuthenticationException) {
                log.error("OAuth token request failure detected: {}", cause.getMessage());
                break;
            }
            cause = cause.getCause();
        }

        // 3. SSL Errors
        cause = ex;
        while (cause != null) {
            if (cause instanceof javax.net.ssl.SSLException ||
                (cause.getMessage() != null && (cause.getMessage().toLowerCase().contains("ssl") || cause.getMessage().toLowerCase().contains("cert")))) {
                log.error("SSL/TLS validation error occurred during request to: {}", url);
                break;
            }
            cause = cause.getCause();
        }

        // 4. Timeouts
        cause = ex;
        while (cause != null) {
            if (cause instanceof java.net.SocketTimeoutException ||
                (cause.getMessage() != null && cause.getMessage().toLowerCase().contains("timeout"))) {
                log.error("Connection timeout occurred during request to: {}", url);
                break;
            }
            cause = cause.getCause();
        }

        // 5. Network / Connect Errors
        cause = ex;
        while (cause != null) {
            if (cause instanceof java.net.ConnectException ||
                cause instanceof java.net.UnknownHostException ||
                cause instanceof java.net.NoRouteToHostException ||
                (cause.getMessage() != null && (cause.getMessage().toLowerCase().contains("connect") || cause.getMessage().toLowerCase().contains("unreachable")))) {
                log.error("Network/Connection error occurred during request to: {}", url);
                break;
            }
            cause = cause.getCause();
        }
    }

    private static class ZohoRequestInterceptor implements ClientHttpRequestInterceptor {

        private final ZohoTokenManager tokenManager;
        private static final int MAX_ATTEMPTS = 3;

        public ZohoRequestInterceptor(ZohoTokenManager tokenManager) {
            this.tokenManager = tokenManager;
        }

        @Override
        public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution)
                throws IOException {

            // Dynamically inject the access token from the token manager
            String token = tokenManager.getAccessToken();
            setAuthHeader(request, token);

            int attempt = 0;
            long backoffMs = 500;
            ClientHttpResponse response = null;
            IOException lastException = null;

            long startTime = System.currentTimeMillis();

            while (attempt < MAX_ATTEMPTS) {
                attempt++;
                try {
                    response = execution.execute(request, body);
                    HttpStatusCode status = response.getStatusCode();
                    int statusCode = status.value();

                    long duration = System.currentTimeMillis() - startTime;
                    log.info("Zoho API Request - Method: {}, URL: {}, Status: {}, Duration: {}ms (Attempt: {})",
                            request.getMethod(), request.getURI(), statusCode, duration, attempt);

                    if (statusCode == 401 && attempt < MAX_ATTEMPTS) {
                        log.warn("Zoho API returned 401 Unauthorized for URL: {}. Forcing access token refresh and retrying...", request.getURI());
                        String newToken = tokenManager.forceRefreshAccessToken();
                        setAuthHeader(request, newToken);
                        sleep(backoffMs);
                        backoffMs *= 2;
                        continue;
                    }

                    if (shouldRetry(statusCode)) {
                        if (attempt < MAX_ATTEMPTS) {
                            sleep(backoffMs);
                            backoffMs *= 2;
                            continue;
                        }
                    }
                    return response;
                } catch (IOException ex) {
                    lastException = ex;
                    long duration = System.currentTimeMillis() - startTime;
                    log.warn("Zoho API Network Failure - Method: {}, URL: {}, Error: {}, Duration: {}ms (Attempt: {})",
                            request.getMethod(), request.getURI(), ex.getMessage(), duration, attempt);

                    if (isTimeoutOrTransientNetworkError(ex)) {
                        if (attempt < MAX_ATTEMPTS) {
                            sleep(backoffMs);
                            backoffMs *= 2;
                            continue;
                        }
                    }
                    throw ex;
                }
            }

            if (lastException != null) {
                throw lastException;
            }
            return response;
        }

        private void setAuthHeader(HttpRequest request, String token) {
            String uriString = request.getURI().toString().toLowerCase();
            if (uriString.contains("workdrive")) {
                request.getHeaders().set("Authorization", "Bearer " + token);
                request.getHeaders().set("Accept", "application/vnd.api+json");
            } else {
                request.getHeaders().set("Authorization", "Zoho-oauthtoken " + token);
            }
        }

        private boolean shouldRetry(int statusCode) {
            return statusCode == 429 || statusCode == 502 || statusCode == 503 || statusCode == 504;
        }

        private boolean isTimeoutOrTransientNetworkError(IOException ex) {
            return ex instanceof SocketTimeoutException || ex.getMessage().contains("timeout") || ex.getMessage().contains("connect");
        }

        private void sleep(long ms) {
            try {
                Thread.sleep(ms);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
}
