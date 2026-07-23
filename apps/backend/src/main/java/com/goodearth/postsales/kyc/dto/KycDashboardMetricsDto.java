package com.goodearth.postsales.kyc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycDashboardMetricsDto {

    private long totalPendingReview;
    private long totalActionRequired;
    private long totalVerifiedThisMonth;
    private double avgReviewTimeHours;
}
