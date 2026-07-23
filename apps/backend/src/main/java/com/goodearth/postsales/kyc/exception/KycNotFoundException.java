package com.goodearth.postsales.kyc.exception;

import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class KycNotFoundException extends CustomException {

    public KycNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }

    public KycNotFoundException(String identifierType, String identifierValue) {
        super(String.format("KYC Application not found for %s: %s", identifierType, identifierValue), HttpStatus.NOT_FOUND);
    }
}
