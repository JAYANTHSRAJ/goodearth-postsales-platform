package com.goodearth.postsales.kyc.exception;

import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class KycInvalidStateTransitionException extends CustomException {

    public KycInvalidStateTransitionException(String currentState, String attemptedAction) {
        super(String.format("Cannot perform '%s' when KYC application status is '%s'", attemptedAction, currentState), HttpStatus.CONFLICT);
    }
}
