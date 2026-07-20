package com.goodearth.postsales.integration.service;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.common.enumeration.UserRole;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import com.goodearth.postsales.integration.zoho.dto.ZohoContactResponse;
import com.goodearth.postsales.integration.zoho.dto.ZohoDealResponse;
import com.goodearth.postsales.notification.service.EmailService;
import com.goodearth.postsales.project.entity.Project;
import com.goodearth.postsales.project.repository.ProjectRepository;
import com.goodearth.postsales.stage.entity.Stage;
import com.goodearth.postsales.stage.repository.StageRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.entity.WorkflowStatus;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.goodearth.postsales.buyer.service.ZohoBuyerSyncService;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class ZohoDealsOnboardingService {

    private static final Logger log = LoggerFactory.getLogger(ZohoDealsOnboardingService.class);

    private final UserRepository userRepository;
    private final BuyerRepository buyerRepository;
    private final ProjectRepository projectRepository;
    private final WorkflowRepository workflowRepository;
    private final StageRepository stageRepository;
    private final EmailService emailService;
    private final ZohoApiClient apiClient;
    private final ZohoProperties properties;
    private final PasswordEncoder passwordEncoder;
    private final ZohoBuyerSyncService syncService;

    public ZohoDealsOnboardingService(
            UserRepository userRepository,
            BuyerRepository buyerRepository,
            ProjectRepository projectRepository,
            WorkflowRepository workflowRepository,
            StageRepository stageRepository,
            EmailService emailService,
            ZohoApiClient apiClient,
            ZohoProperties properties,
            PasswordEncoder passwordEncoder,
            ZohoBuyerSyncService syncService) {
        this.userRepository = userRepository;
        this.buyerRepository = buyerRepository;
        this.projectRepository = projectRepository;
        this.workflowRepository = workflowRepository;
        this.stageRepository = stageRepository;
        this.emailService = emailService;
        this.apiClient = apiClient;
        this.properties = properties;
        this.passwordEncoder = passwordEncoder;
        this.syncService = syncService;
    }

    public ZohoProperties getProperties() {
        return this.properties;
    }

    @Transactional
    public void processDealWebhook(Map<String, Object> payload) {
        log.info("Incoming webhook payload: {}", payload);

        // 1. Extract the Deal ID.
        String dealId = null;
        if (payload != null) {
            if (payload.get("id") != null) {
                dealId = payload.get("id").toString();
            } else if (payload.get("dealId") != null) {
                dealId = payload.get("dealId").toString();
            } else if (payload.get("deal_id") != null) {
                dealId = payload.get("deal_id").toString();
            } else if (payload.get("Deal_Id") != null) {
                dealId = payload.get("Deal_Id").toString();
            } else if (payload.get("data") instanceof List) {
                List<?> list = (List<?>) payload.get("data");
                if (!list.isEmpty() && list.get(0) instanceof Map) {
                    Map<?, ?> map = (Map<?, ?>) list.get(0);
                    if (map.get("id") != null) {
                        dealId = map.get("id").toString();
                    } else if (map.get("deal_id") != null) {
                        dealId = map.get("deal_id").toString();
                    } else if (map.get("Deal_Id") != null) {
                        dealId = map.get("Deal_Id").toString();
                    }
                }
            }
        }

        log.info("Extracted Deal ID: {}", dealId);

        if (dealId == null || dealId.trim().isEmpty()) {
            log.info("Skip reason: Portal activation skipped because Deal ID is missing in webhook payload.");
            return;
        }

        // Delegate to the single source of truth sync service
        syncService.syncSingleDeal(dealId);
    }

    public void sendWelcomeEmail(Buyer buyer) {
        log.info("ENTER sendWelcomeEmail");
        log.info("Reached email step");
        log.info("welcomeEmailSent={}", buyer.isWelcomeEmailSent());
        log.info("portalActivated={}", buyer.isPortalActivated());

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(buyer.getEmail());
        boolean userExists = userOpt.isPresent();
        log.info("userExists={}", userExists);

        String activationToken = null;
        if (userOpt.isPresent()) {
            activationToken = userOpt.get().getActivationToken();
        }
        log.info("activationToken={}", activationToken);

        if (buyer.getEmail() == null) {
            log.info("Skipping welcome email: buyer email is null");
            log.info("EXIT sendWelcomeEmail");
            return;
        }

        try {
            String subject = "Welcome to GoodEarth Homeowner Portal";
            String body = String.format(
                    "Dear %s,\n\n" +
                    "Welcome to GoodEarth.\n\n" +
                    "Your homeowner portal has been created.\n\n" +
                    "Click below to activate your account.\n\n" +
                    "Activate Account: %s\n",
                    buyer.getFullName(),
                    "https://goodearth.in/portal/activate"
            );
            log.info("Preparing welcome email to {}", buyer.getEmail());
            emailService.sendEmail(buyer.getEmail(), subject, body);
            buyer.setWelcomeEmailSent(true);
            buyer.setSyncStatus("SUCCESS");
            buyerRepository.save(buyer);
            log.info("SMTP email sent successfully to {}", buyer.getEmail());
        } catch (Exception ex) {
            log.error("Email sending failed for {}", buyer.getEmail(), ex);
            buyer.setWelcomeEmailSent(false);
            buyer.setSyncStatus("EMAIL_FAILED");
            buyerRepository.save(buyer);
        }
        log.info("EXIT sendWelcomeEmail");
    }
}

