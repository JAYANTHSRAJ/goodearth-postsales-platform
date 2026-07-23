package com.goodearth.postsales.kyc.dto;

import com.goodearth.postsales.kyc.entity.KycApplicationStatus;
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
public class KycDashboardItemDto {

    private UUID kycApplicationId;
    private String bookingRef;
    private String unitNumber;
    private String projectName;
    private String primaryApplicantName;
    private KycApplicationStatus status;
    private LocalDateTime submittedAt;
    private String assignedReviewer;
}
