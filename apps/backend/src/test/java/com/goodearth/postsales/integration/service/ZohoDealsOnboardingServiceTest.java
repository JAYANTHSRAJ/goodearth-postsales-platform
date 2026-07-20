package com.goodearth.postsales.integration.service;

import com.goodearth.postsales.buyer.service.ZohoBuyerSyncService;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import com.goodearth.postsales.notification.service.EmailService;
import com.goodearth.postsales.project.repository.ProjectRepository;
import com.goodearth.postsales.stage.repository.StageRepository;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ZohoDealsOnboardingServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BuyerRepository buyerRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private WorkflowRepository workflowRepository;

    @Mock
    private StageRepository stageRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private ZohoApiClient apiClient;

    @Mock
    private ZohoProperties properties;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ZohoBuyerSyncService syncService;

    private ZohoDealsOnboardingService service;

    @BeforeEach
    public void setUp() {
        service = new ZohoDealsOnboardingService(
                userRepository,
                buyerRepository,
                projectRepository,
                workflowRepository,
                stageRepository,
                emailService,
                apiClient,
                properties,
                passwordEncoder,
                syncService
        );
    }

    @Test
    public void testProcessDealWebhook_SuccessWithDealEmail() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("dealId", "deal_123");

        // Act
        service.processDealWebhook(payload);

        // Assert
        verify(syncService, times(1)).syncSingleDeal("deal_123");
    }

    @Test
    public void testProcessDealWebhook_FetchContactWhenEmailMissingOnDeal() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", "deal_123");

        // Act
        service.processDealWebhook(payload);

        // Assert
        verify(syncService, times(1)).syncSingleDeal("deal_123");
    }
}
