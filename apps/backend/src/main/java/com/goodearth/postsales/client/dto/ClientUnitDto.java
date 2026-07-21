package com.goodearth.postsales.client.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClientUnitDto {
    private UUID id; // Buyer ID
    private UUID workflowId;
    private String unitName;
    private String projectName;
    private String projectCode;
    private String location;
    private String status;
    private String kycStatus; // "NOT_STARTED", "DRAFT", "SUBMITTED", "VERIFIED"
    private boolean kycLocked;
    private boolean isKycVerified;
    private boolean hasPendingModificationRequest;
    private UUID kycApplicationId;
}
