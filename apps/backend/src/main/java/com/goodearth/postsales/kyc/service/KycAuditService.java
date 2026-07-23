package com.goodearth.postsales.kyc.service;

import com.goodearth.postsales.kyc.entity.KycApplication;
import com.goodearth.postsales.kyc.entity.KycAuditEventType;

public interface KycAuditService {
    void logEvent(KycApplication application, KycAuditEventType eventType, String actorId, String actorRole, String summary, Object metadata);
}
