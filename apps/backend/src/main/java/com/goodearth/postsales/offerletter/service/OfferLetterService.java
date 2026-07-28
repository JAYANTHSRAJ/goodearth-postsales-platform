package com.goodearth.postsales.offerletter.service;

import com.goodearth.postsales.kyc.dto.KycDocumentStreamDto;
import com.goodearth.postsales.offerletter.dto.OfferLetterStatusDto;

public interface OfferLetterService {
    OfferLetterStatusDto getOfferLetterStatus(String dealIdOrBookingId);
    KycDocumentStreamDto streamOfferLetterPdf(String dealIdOrBookingId, String actorId);
}
