package com.goodearth.postsales.kyc.service;

import com.goodearth.postsales.kyc.entity.KycApplication;

public interface ZohoKycSyncService {

    boolean syncKycStatusToCrm(KycApplication application, String milestoneNoteTitle, String milestoneNoteContent);

    boolean verifyDealExists(String dealIdOrBookingId);
}
