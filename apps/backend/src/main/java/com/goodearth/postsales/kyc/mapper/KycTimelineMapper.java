package com.goodearth.postsales.kyc.mapper;

import com.goodearth.postsales.kyc.dto.KycTimelineEventDto;
import com.goodearth.postsales.kyc.entity.KycAuditLog;
import org.springframework.stereotype.Component;

@Component
public class KycTimelineMapper {

    public KycTimelineEventDto toDto(KycAuditLog auditLog) {
        if (auditLog == null) {
            return null;
        }
        return KycTimelineEventDto.builder()
                .eventId(auditLog.getId())
                .eventType(auditLog.getEventType())
                .actorId(auditLog.getActorId())
                .actorRole(auditLog.getActorRole())
                .summary(auditLog.getSummary())
                .timestamp(auditLog.getCreatedAt())
                .build();
    }
}
