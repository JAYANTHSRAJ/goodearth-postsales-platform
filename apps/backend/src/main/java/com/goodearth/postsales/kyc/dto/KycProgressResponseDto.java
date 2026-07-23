package com.goodearth.postsales.kyc.dto;

import com.goodearth.postsales.document.dto.DocumentSlotDto;
import com.goodearth.postsales.kyc.entity.KycApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycProgressResponseDto {

    private String bookingId;
    private UUID kycApplicationId;
    private KycApplicationStatus overallStatus;
    private Integer completionPercentage;
    private Integer requiredSlotsCount;
    private Integer uploadedSlotsCount;
    private Integer approvedSlotsCount;
    private Integer rejectedSlotsCount;
    private Integer pendingReviewSlotsCount;
    private List<DocumentSlotDto> slots;
}
