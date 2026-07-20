package com.goodearth.postsales.client.service;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.changerequest.service.ChangeRequestService;
import com.goodearth.postsales.client.dto.ClientChangeRequestSummaryDto;
import com.goodearth.postsales.client.dto.ClientDashboardDto;
import com.goodearth.postsales.client.dto.ClientNotificationDto;
import com.goodearth.postsales.client.dto.ClientWorkflowSummaryDto;
import com.goodearth.postsales.client.mapper.ClientPortalMapper;
import com.goodearth.postsales.finance.service.PaymentService;
import com.goodearth.postsales.notification.entity.Notification;
import com.goodearth.postsales.notification.entity.UserNotificationState;
import com.goodearth.postsales.notification.repository.NotificationRepository;
import com.goodearth.postsales.notification.repository.UserNotificationStateRepository;
import com.goodearth.postsales.stage.entity.Stage;
import com.goodearth.postsales.stage.repository.StageRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final ClientPortalServiceHelper helper;
    private final ClientPortalMapper mapper;
    private final StageRepository stageRepository;
    private final ChangeRequestService changeRequestService;
    private final PaymentService paymentService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final UserNotificationStateRepository userNotificationStateRepository;
    private final WorkflowRepository workflowRepository;

    public DashboardServiceImpl(
            ClientPortalServiceHelper helper,
            ClientPortalMapper mapper,
            StageRepository stageRepository,
            ChangeRequestService changeRequestService,
            PaymentService paymentService,
            UserRepository userRepository,
            NotificationRepository notificationRepository,
            UserNotificationStateRepository userNotificationStateRepository,
            WorkflowRepository workflowRepository) {
        this.helper = helper;
        this.mapper = mapper;
        this.stageRepository = stageRepository;
        this.changeRequestService = changeRequestService;
        this.paymentService = paymentService;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.userNotificationStateRepository = userNotificationStateRepository;
        this.workflowRepository = workflowRepository;
    }

    @Override
    @Cacheable(value = "clientDashboard", key = "#userDetails.username + (#workflowId != null ? #workflowId.toString() : '')")
    public ClientDashboardDto getDashboard(UserDetails userDetails, UUID workflowId) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        
        Workflow workflow;
        if (workflowId != null) {
            workflow = workflowRepository.findById(workflowId)
                    .orElseThrow(() -> new com.goodearth.postsales.common.exception.CustomException("Workflow not found.", HttpStatus.NOT_FOUND));
        } else {
            workflow = helper.getBuyerWorkflow(buyer);
        }
        
        UUID resolvedWorkflowId = workflow.getId();

        ClientDashboardDto dashboard = new ClientDashboardDto();
        dashboard.setBuyer(mapper.toBuyerSummary(buyer));
        dashboard.setProject(mapper.toProjectSummary(workflow.getProject()));
        dashboard.setWorkflow(mapper.toWorkflowSummary(workflow));

        // Populate workflows list for Property Switcher
        List<Workflow> allWorkflows = workflowRepository.findByBuyerId(buyer.getId());
        List<ClientWorkflowSummaryDto> workflowDtos = allWorkflows.stream()
                .map(mapper::toWorkflowSummary)
                .collect(Collectors.toList());
        dashboard.setWorkflows(workflowDtos);

        if (workflow.getCurrentStageId() != null) {
            Stage currentStage = stageRepository.findById(workflow.getCurrentStageId()).orElse(null);
            dashboard.setCurrentStage(mapper.toStageSummary(currentStage));
            dashboard.setCompletionPercent(helper.calculateCompletionPercentage(workflow.getCurrentStageId()));
        }

        dashboard.setLatestDrawing(helper.fetchLatestDrawing(resolvedWorkflowId));

        List<ClientChangeRequestSummaryDto> pendingCRs = changeRequestService.getRequestsByWorkflow(resolvedWorkflowId).stream()
                .filter(cr -> cr.getStatus() != null && 
                        !cr.getStatus().name().equals("ACCEPTED") && 
                        !cr.getStatus().name().equals("REJECTED") &&
                        !cr.getStatus().name().equals("QUOTATION_ACCEPTED") &&
                        !cr.getStatus().name().equals("QUOTATION_REJECTED"))
                .map(mapper::toChangeRequestSummary)
                .collect(Collectors.toList());
        dashboard.setPendingChangeRequests(pendingCRs);

        BigDecimal outstanding = paymentService.calculateOutstandingBalance(resolvedWorkflowId).getOutstandingBalance();
        dashboard.setOutstandingBalance(outstanding);

        // Fetch active notifications from the DB
        List<ClientNotificationDto> clientNotifications = new ArrayList<>();
        User user = userRepository.findByEmailIgnoreCase(userDetails.getUsername()).orElse(null);
        if (user != null) {
            List<Notification> activeNotifications = notificationRepository.findActiveNotificationsForUser(
                    user.getId(), "CLIENT", LocalDateTime.now());
            
            clientNotifications = activeNotifications.stream()
                    .limit(10) // Limit to 10 most recent
                    .map(n -> {
                        boolean isRead = userNotificationStateRepository.findByUserIdAndNotificationId(user.getId(), n.getId())
                                .map(UserNotificationState::isRead)
                                .orElse(false);
                        return new ClientNotificationDto(
                                n.getId(),
                                n.getTitle(),
                                n.getMessage(),
                                n.getCreatedAt(),
                                isRead
                        );
                    })
                    .collect(Collectors.toList());
        }
        dashboard.setRecentNotifications(clientNotifications);

        return dashboard;
    }
}
