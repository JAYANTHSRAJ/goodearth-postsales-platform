package com.goodearth.postsales.integration.zoho;

public class ZohoAuthenticationException extends RuntimeException {
    
    public ZohoAuthenticationException(String message) {
        super(message);
    }
    
    public ZohoAuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}
