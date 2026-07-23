package com.goodearth.postsales.kyc.dto;

import com.goodearth.postsales.kyc.entity.KycAuditEventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycTimelineEventDto {

    private UUID eventId;
    private KycAuditEventType eventType;
    private String actorId;
    private String actorRole;
    private String summary;
    private LocalDateTime timestamp;
}
