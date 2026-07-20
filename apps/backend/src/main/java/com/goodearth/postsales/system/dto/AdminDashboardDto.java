package com.goodearth.postsales.system.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@lombok.ToString
public class AdminDashboardDto {
    private long totalBuyers;
    private long activeWorkflows;
    private BigDecimal totalInvoiced;
    private BigDecimal totalPaid;
    private BigDecimal outstandingBalance;
    private long webhookPendingCount;
    private long webhookFailedToday;
    private Map<String, Long> stageCounts;
    private Map<String, Long> projectWorkloads;
    private java.util.List<DashboardItemDto> pendingReviews;
    private java.util.List<DashboardItemDto> overduePayments;
    private java.util.List<DashboardItemDto> projectDelays;
    private java.util.List<DashboardItemDto> openTickets;
    private java.util.List<DashboardItemDto> recentActivity;
}
