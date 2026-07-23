package com.goodearth.postsales.kyc.service;

import com.goodearth.postsales.kyc.entity.KycApplication;

public interface ZohoKycSyncService {

    boolean syncKycStatusToCrm(KycApplication application, String milestoneNoteTitle, String milestoneNoteContent);

    boolean syncKycDealFieldsToCrm(KycApplication application);

    boolean syncApplicantMapToCrm(String bookingId, java.util.Map<String, Object> dealFields);

    boolean verifyDealExists(String dealIdOrBookingId);
}
