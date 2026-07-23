package com.goodearth.postsales.kyc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycDashboardSummaryResponseDto {

    private KycDashboardMetricsDto metrics;
    private List<KycDashboardItemDto> applications;
    private int page;
    private int limit;
    private long totalCount;
    private int totalPages;
}
