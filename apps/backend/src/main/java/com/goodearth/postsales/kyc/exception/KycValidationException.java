package com.goodearth.postsales.kyc.exception;

import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class KycValidationException extends CustomException {

    public KycValidationException(String message) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
