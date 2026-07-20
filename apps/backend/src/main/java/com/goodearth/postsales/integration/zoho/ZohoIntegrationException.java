package com.goodearth.postsales.integration.zoho;

public class ZohoIntegrationException extends RuntimeException {
    
    public ZohoIntegrationException(String message) {
        super(message);
    }
    
    public ZohoIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
}
