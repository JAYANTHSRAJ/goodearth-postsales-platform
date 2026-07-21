package com.goodearth.postsales.client.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class KycApplicationDto {
    private UUID id;
    private UUID buyerId;
    private String unitName;
    private String status;
    private String draftData;
    private boolean isLocked;
    private boolean isVerified;
    private boolean hasPendingModificationRequest;
    private String modificationRequestReason;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;

    // Available verified KYCs from other owned units for 1-click reuse
    private List<ClientUnitDto> availableVerifiedKycs;
}
