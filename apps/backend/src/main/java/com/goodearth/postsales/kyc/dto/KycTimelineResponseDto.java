package com.goodearth.postsales.kyc.dto;

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
public class KycTimelineResponseDto {

    private String bookingId;
    private UUID kycApplicationId;
    private List<KycTimelineEventDto> events;
}
