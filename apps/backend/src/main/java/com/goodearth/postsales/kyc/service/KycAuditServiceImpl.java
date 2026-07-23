package com.goodearth.postsales.kyc.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodearth.postsales.kyc.entity.KycApplicant;
import com.goodearth.postsales.kyc.entity.KycApplication;
import com.goodearth.postsales.kyc.entity.KycAuditLog;
import com.goodearth.postsales.kyc.entity.KycAuditEventType;
import com.goodearth.postsales.kyc.repository.KycAuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class KycAuditServiceImpl implements KycAuditService {

    private static final Logger log = LoggerFactory.getLogger(KycAuditServiceImpl.class);

    private final KycAuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public KycAuditServiceImpl(KycAuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void logEvent(KycApplication application, KycAuditEventType eventType, String actorId, String actorRole, String summary, Object metadata) {
        try {
            KycAuditLog auditLog = new KycAuditLog();
            auditLog.setKycApplication(application);
            auditLog.setEventType(eventType);
            auditLog.setActorId(actorId != null ? actorId : "SYSTEM");
            auditLog.setActorRole(actorRole != null ? actorRole : "SYSTEM");
            auditLog.setSummary(summary);
            auditLog.setCreatedAt(LocalDateTime.now());

            if (metadata != null) {
                auditLog.setMetadataJson(objectMapper.writeValueAsString(metadata));
            }

            auditLogRepository.save(auditLog);
            log.info("KYC Audit Log recorded: applicationId={}, eventType={}, actorId={}", application.getId(), eventType, actorId);
        } catch (Exception e) {
            log.error("Failed to write KYC audit log for applicationId={}", application.getId(), e);
        }
    }
}
