package com.goodearth.postsales.system.service;

import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.changerequest.repository.ChangeRequestRepository;
import com.goodearth.postsales.finance.repository.PaymentReceiptRepository;
import com.goodearth.postsales.finance.repository.PaymentScheduleRepository;
import com.goodearth.postsales.stage.repository.StageRepository;
import com.goodearth.postsales.system.dto.AdminDashboardDto;
import com.goodearth.postsales.webhook.repository.WebhookEventRepository;
import com.goodearth.postsales.workflow.entity.WorkflowStatus;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceImplTest {

    @Mock
    private BuyerRepository buyerRepository;

    @Mock
    private WorkflowRepository workflowRepository;

    @Mock
    private PaymentScheduleRepository scheduleRepository;

    @Mock
    private PaymentReceiptRepository receiptRepository;

    @Mock
    private WebhookEventRepository webhookEventRepository;

    @Mock
    private StageRepository stageRepository;

    @Mock
    private ChangeRequestRepository changeRequestRepository;

    @InjectMocks
    private AdminDashboardServiceImpl dashboardService;

    @BeforeEach
    void setUp() {
        when(buyerRepository.count()).thenReturn(5L);
        when(workflowRepository.countByStatus(WorkflowStatus.ACTIVE)).thenReturn(3L);
        when(scheduleRepository.findAll()).thenReturn(Collections.emptyList());
        when(receiptRepository.findAll()).thenReturn(Collections.emptyList());
        when(webhookEventRepository.countPendingQueue()).thenReturn(0L);
        when(webhookEventRepository.countFailedToday(any())).thenReturn(0L);
        when(workflowRepository.findAll()).thenReturn(Collections.emptyList());
        when(stageRepository.findAll()).thenReturn(Collections.emptyList());
        when(changeRequestRepository.findAll()).thenReturn(Collections.emptyList());
    }

    @Test
    void testGetDashboardStats_Success() {
        AdminDashboardDto stats = dashboardService.getDashboardStats();
        assertNotNull(stats);
    }
}
