package com.goodearth.postsales.client.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClientDashboardDto {
    private ClientBuyerSummaryDto buyer;
    private ClientProjectSummaryDto project;
    private ClientWorkflowSummaryDto workflow;
    private ClientStageSummaryDto currentStage;
    private double completionPercent;
    private ClientDrawingSummaryDto latestDrawing;
    private List<ClientChangeRequestSummaryDto> pendingChangeRequests;
    private BigDecimal outstandingBalance;
    private List<ClientNotificationDto> recentNotifications;
    private List<ClientWorkflowSummaryDto> workflows;
}
