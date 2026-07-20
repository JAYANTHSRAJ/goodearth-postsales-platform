package com.goodearth.postsales.buyer.service;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.common.enumeration.UserRole;
import com.goodearth.postsales.common.enumeration.OnboardingStage;
import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import com.goodearth.postsales.integration.zoho.dto.ZohoDealResponse;
import com.goodearth.postsales.integration.zoho.dto.ZohoContactResponse;
import com.goodearth.postsales.auth.service.ActivationTokenService;
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
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class ZohoBuyerSyncServiceImpl implements ZohoBuyerSyncService {

    private static final Logger log = LoggerFactory.getLogger(ZohoBuyerSyncServiceImpl.class);

    private final ZohoApiClient apiClient;
    private final ZohoProperties properties;
    private final BuyerRepository buyerRepository;
    private final ProjectRepository projectRepository;
    private final WorkflowRepository workflowRepository;
    private final StageRepository stageRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final ActivationTokenService activationTokenService;

    public ZohoBuyerSyncServiceImpl(
            ZohoApiClient apiClient,
            ZohoProperties properties,
            BuyerRepository buyerRepository,
            ProjectRepository projectRepository,
            WorkflowRepository workflowRepository,
            StageRepository stageRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            ActivationTokenService activationTokenService) {
        this.apiClient = apiClient;
        this.properties = properties;
        this.buyerRepository = buyerRepository;
        this.projectRepository = projectRepository;
        this.workflowRepository = workflowRepository;
        this.stageRepository = stageRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.activationTokenService = activationTokenService;
    }

    @Override
    @Transactional
    public Map<String, Object> syncBuyers() {
        log.info("Starting Zoho CRM Deals synchronization as single source of truth for Buyers, Projects, and Workflows...");
        String url = properties.getCrmApiUrl() + "/Deals";

        ZohoDealResponse crmResponse;
        try {
            crmResponse = apiClient.get(url, ZohoDealResponse.class);
        } catch (Exception e) {
            log.error("Failed to fetch deals from Zoho CRM", e);
            throw new CustomException("Failed to synchronize deals from Zoho CRM due to integration error: " + e.getMessage(), HttpStatus.BAD_GATEWAY, e);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("dealsFetched", 0);
        summary.put("buyersCreated", 0);
        summary.put("buyersUpdated", 0);
        summary.put("buyersSkipped", 0);
        summary.put("projectsCreated", 0);
        summary.put("projectsUpdated", 0);
        summary.put("workflowsCreated", 0);
        summary.put("workflowsUpdated", 0);

        if (crmResponse == null || crmResponse.getData() == null) {
            log.warn("No deals returned from Zoho CRM");
        } else {
            List<ZohoDealResponse.ZohoDeal> crmDeals = crmResponse.getData();
            summary.put("dealsFetched", crmDeals.size());

            for (ZohoDealResponse.ZohoDeal crmDeal : crmDeals) {
                try {
                    processSingleDeal(crmDeal, summary);
                } catch (Exception e) {
                    log.error("Error processing deal ID {}", crmDeal.getId(), e);
                    summary.put("buyersSkipped", (int) summary.get("buyersSkipped") + 1);
                }
            }
        }

        log.info("Zoho Deals synchronization completed.");
        log.info("Total Deals fetched: {}", summary.get("dealsFetched"));
        log.info("Buyers created: {}, Buyers updated: {}, Buyers skipped: {}", 
                 summary.get("buyersCreated"), summary.get("buyersUpdated"), summary.get("buyersSkipped"));
        log.info("Projects created: {}, Projects updated: {}", 
                 summary.get("projectsCreated"), summary.get("projectsUpdated"));
        log.info("Workflows created: {}, Workflows updated: {}", 
                 summary.get("workflowsCreated"), summary.get("workflowsUpdated"));

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("summary", summary);

        return response;
    }

    @Override
    @Transactional
    public Map<String, Object> syncSingleDeal(String dealId) {
        log.info("Starting single Deal synchronization for Deal ID: {}", dealId);
        String url = properties.getCrmApiUrl() + "/Deals/" + dealId;

        ZohoDealResponse crmResponse;
        try {
            crmResponse = apiClient.get(url, ZohoDealResponse.class);
        } catch (Exception e) {
            log.error("Failed to fetch deal ID {} from Zoho CRM", dealId, e);
            throw new CustomException("Failed to synchronize deal from Zoho CRM due to integration error: " + e.getMessage(), HttpStatus.BAD_GATEWAY, e);
        }

        Map<String, Object> summaryMap = new HashMap<>();
        summaryMap.put("dealsFetched", 0);
        summaryMap.put("buyersCreated", 0);
        summaryMap.put("buyersUpdated", 0);
        summaryMap.put("buyersSkipped", 0);
        summaryMap.put("projectsCreated", 0);
        summaryMap.put("projectsUpdated", 0);
        summaryMap.put("workflowsCreated", 0);
        summaryMap.put("workflowsUpdated", 0);

        if (crmResponse == null || crmResponse.getData() == null || crmResponse.getData().isEmpty()) {
            log.warn("Deal ID {} not found in Zoho CRM", dealId);
            summaryMap.put("buyersSkipped", 1);
        } else {
            summaryMap.put("dealsFetched", 1);
            ZohoDealResponse.ZohoDeal crmDeal = crmResponse.getData().get(0);
            log.info("Invoking processSingleDeal for Deal ID: {}", dealId);
            processSingleDeal(crmDeal, summaryMap);
        }

        log.info("Webhook single Deal sync completed. Deal ID: {}", dealId);
        log.info("Buyers created: {}, Buyers updated: {}, Buyers skipped: {}", 
                 summaryMap.get("buyersCreated"), summaryMap.get("buyersUpdated"), summaryMap.get("buyersSkipped"));

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("summary", summaryMap);
        return response;
    }

    private void processSingleDeal(ZohoDealResponse.ZohoDeal crmDeal, Map<String, Object> summary) {
        log.info(">>> ENTER processSingleDeal");
        String dealId = crmDeal.getId();
        if (dealId == null || dealId.trim().isEmpty()) {
            summary.put("buyersSkipped", (int) summary.get("buyersSkipped") + 1);
            return;
        }

        // Extract Deal attributes
        String email = crmDeal.getEmail();
        String buyerName = crmDeal.getContactName() != null ? crmDeal.getContactName().getName() : null;
        String phone = crmDeal.getPhone();
        String stageName = crmDeal.getStage();

        // Fetch the related Contact if email/phone details are missing from Deal directly
        if ((email == null || email.trim().isEmpty() || phone == null || phone.trim().isEmpty())
                && crmDeal.getContactName() != null && crmDeal.getContactName().getId() != null) {
            String contactId = crmDeal.getContactName().getId();
            String contactUrl = properties.getCrmApiUrl() + "/Contacts/" + contactId;
            try {
                ZohoContactResponse contactResponse = apiClient.get(contactUrl, ZohoContactResponse.class);
                if (contactResponse != null && contactResponse.getData() != null && !contactResponse.getData().isEmpty()) {
                    ZohoContactResponse.ZohoContact contact = contactResponse.getData().get(0);
                    if (email == null || email.trim().isEmpty()) {
                        email = contact.getEmail();
                    }
                    if (buyerName == null || buyerName.trim().isEmpty() || "Unknown Name".equalsIgnoreCase(buyerName)) {
                        buyerName = contact.getResolvedFullName();
                    }
                    if (phone == null || phone.trim().isEmpty()) {
                        phone = contact.getPhone();
                    }
                }
            } catch (Exception e) {
                log.error("Zoho API error fetching related Contact ID: {} for Deal ID: {}", contactId, dealId, e);
            }
        }

        // If a Deal has no Contact/Email information, skip it and log the reason
        if (email == null || email.trim().isEmpty()) {
            log.info("Skip reason: Deal ID {} has no email or contact name resolved.", dealId);
            summary.put("buyersSkipped", (int) summary.get("buyersSkipped") + 1);
            return;
        }

        // 1. User Creation/Lookup (matches onboarding logic)
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        User user;
        boolean isNewUser = false;
        if (userOpt.isEmpty()) {
            isNewUser = true;
            user = new User();
            user.setEmail(email);
            user.setFullName(buyerName != null ? buyerName : email);
            user.setPassword(passwordEncoder.encode("GoodEarth@123"));
            user.setRole(UserRole.CLIENT);
            user.setEnabled(true);
            user.setEmailVerified(true);
            user.setAccountLocked(false);
            user.setFailedLoginAttempts(0);
            user.setFirstLoginCompleted(false);
            user.setPasswordChangeRequired(false);
            user.setPortalActivated(true);
            user.setAccountActivated(false);
            user.setOnboardingStage(OnboardingStage.PROFILE_PENDING);
            log.info("Saving User entity for email: {}", email);
            userRepository.save(user);
            log.info("User created for email: {}", email);
            activationTokenService.generateToken(user);
        } else {
            user = userOpt.get();
            user.setPortalActivated(true);
            user.setEnabled(true);
            log.info("Saving User entity for email: {}", email);
            userRepository.save(user);
            log.info("User updated for email: {}", email);
        }

        // 2. Buyer Creation/Lookup (Search by Zoho Contact ID, then by Zoho Deal ID, then by Email as fallback)
        String contactId = crmDeal.getContactName() != null ? crmDeal.getContactName().getId() : null;
        Optional<Buyer> buyerOpt = Optional.empty();
        if (contactId != null && !contactId.trim().isEmpty()) {
            buyerOpt = buyerRepository.findByZohoContactId(contactId);
        }
        if (buyerOpt.isEmpty()) {
            buyerOpt = buyerRepository.findByZohoDealId(dealId);
        }
        if (buyerOpt.isEmpty()) {
            buyerOpt = buyerRepository.findByEmailIgnoreCase(email);
        }

        boolean isNewBuyer = false;
        Buyer buyer;
        if (buyerOpt.isPresent()) {
            isNewBuyer = false;
            buyer = buyerOpt.get();
            buyer.setFullName(buyerName != null ? buyerName : buyer.getFullName());
            buyer.setEmail(email);
            buyer.setPhone(phone != null ? phone : buyer.getPhone());
            buyer.setZohoContactId(crmDeal.getContactName() != null && crmDeal.getContactName().getId() != null
                    ? crmDeal.getContactName().getId() : buyer.getZohoContactId());
            buyer.setZohoDealId(dealId);
            buyer.setStatus(stageName != null ? stageName : buyer.getStatus());
            buyer.setPortalActivated(true);
            buyer.setLastSyncAt(LocalDateTime.now());
            buyer.setCoApplicantName(crmDeal.getResolvedCoApplicantName() != null 
                    ? crmDeal.getResolvedCoApplicantName() : buyer.getCoApplicantName());
            buyer.setUnitName(crmDeal.getUnitName() != null && crmDeal.getUnitName().getName() != null 
                    ? crmDeal.getUnitName().getName() : buyer.getUnitName());
            log.info("Saving Buyer entity for email: {}", email);
            buyerRepository.save(buyer);
            summary.put("buyersUpdated", (int) summary.get("buyersUpdated") + 1);
            log.info("Buyer updated for email: {}", email);
        } else {
            isNewBuyer = true;
            buyer = new Buyer();
            buyer.setZohoContactId(crmDeal.getContactName() != null && crmDeal.getContactName().getId() != null
                    ? crmDeal.getContactName().getId() : "ZOHO_DEAL_" + dealId);
            buyer.setFullName(buyerName != null ? buyerName : email);
            buyer.setEmail(email);
            buyer.setPhone(phone);
            buyer.setStatus(stageName);
            buyer.setZohoDealId(dealId);
            buyer.setPortalActivated(true);
            buyer.setLastSyncAt(LocalDateTime.now());
            buyer.setSyncStatus("PENDING");
            buyer.setCoApplicantName(crmDeal.getResolvedCoApplicantName());
            buyer.setUnitName(crmDeal.getUnitName() != null ? crmDeal.getUnitName().getName() : null);
            log.info("Saving Buyer entity for email: {}", email);
            buyerRepository.save(buyer);
            summary.put("buyersCreated", (int) summary.get("buyersCreated") + 1);
            log.info("Buyer created for email: {}", email);
        }

        // 3. Project Creation/Lookup
        String projectName = crmDeal.getDealName();
        if (projectName == null || projectName.trim().isEmpty()) {
            projectName = crmDeal.getProjectName();
        }
        String projectCode = crmDeal.getProjectCode();
        if (projectCode == null || projectCode.trim().isEmpty()) {
            if (projectName != null) {
                projectCode = projectName.toUpperCase().replaceAll("[^A-Z]", "");
                if (projectCode.length() > 5) {
                    projectCode = projectCode.substring(0, 5);
                }
            } else {
                projectCode = "DEAL";
            }
        }
        if (projectName == null || projectName.trim().isEmpty()) {
            projectName = "Project " + projectCode;
        }

        String location = crmDeal.getLocation();

        Project project;
        Optional<Project> projOpt = projectRepository.findByZohoDealId(dealId);
        if (projOpt.isEmpty()) {
            projOpt = projectRepository.findByProjectNameIgnoreCase(projectName);
        }

        if (projOpt.isPresent()) {
            project = projOpt.get();
            project.setProjectName(projectName);
            project.setProjectCode(projectCode);
            project.setZohoDealId(dealId);
            project.setLocation(location != null ? location : project.getLocation());
            project.setStatus(stageName != null ? stageName : project.getStatus());
            projectRepository.save(project);
            summary.put("projectsUpdated", (int) summary.get("projectsUpdated") + 1);
        } else {
            project = new Project();
            project.setProjectName(projectName);
            project.setProjectCode(projectCode);
            project.setZohoDealId(dealId);
            project.setLocation(location);
            project.setStatus(stageName != null ? stageName : "ACTIVE");
            projectRepository.save(project);
            summary.put("projectsCreated", (int) summary.get("projectsCreated") + 1);
            log.info("Created new Project record: {} ({})", projectName, project.getProjectCode());
        }

        // 4. Workflow Creation/Update
        Optional<Workflow> workflowOpt = workflowRepository.findByBuyerId(buyer.getId()).stream()
                .filter(w -> w.getProject().getId().equals(project.getId()))
                .findFirst();

        Stage resolvedStage = stageRepository.findByCode(stageName)
                .orElseGet(() -> stageRepository.findByCode("BOOKING_CONFIRMED").orElse(null));

        if (workflowOpt.isPresent()) {
            Workflow workflow = workflowOpt.get();
            if (resolvedStage != null) {
                workflow.setCurrentStageId(resolvedStage.getId());
            }
            workflowRepository.save(workflow);
            summary.put("workflowsUpdated", (int) summary.get("workflowsUpdated") + 1);
        } else {
            Workflow workflow = new Workflow();
            workflow.setBuyer(buyer);
            workflow.setProject(project);
            workflow.setStatus(WorkflowStatus.ACTIVE);
            workflow.setStartedAt(LocalDateTime.now());
            if (resolvedStage != null) {
                workflow.setCurrentStageId(resolvedStage.getId());
            }
            workflowRepository.save(workflow);
            summary.put("workflowsCreated", (int) summary.get("workflowsCreated") + 1);
            log.info("Created new Workflow for Buyer: {} on Project: {}", email, projectName);
        }

        // 5. Send Welcome Email
        log.info("ENTER processSingleDeal");
        log.info("isNewBuyer={}", isNewBuyer);
        log.info("welcomeEmailSent={}", buyer.isWelcomeEmailSent());
        log.info("Email decision reached");
        if (isNewBuyer && !buyer.isWelcomeEmailSent()) {
            log.info(">>> CALLING sendWelcomeEmail");
            sendWelcomeEmail(buyer);
        } else {
            log.info("Skipping welcome email send from processSingleDeal because: isNewBuyer={} or welcomeEmailSent={}", isNewBuyer, buyer.isWelcomeEmailSent());
            buyer.setSyncStatus("SUCCESS");
            buyerRepository.save(buyer);
        }
        log.info(">>> EXIT processSingleDeal");
    }

    private void sendWelcomeEmail(Buyer buyer) {
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
            log.info(">>> EXIT sendWelcomeEmail");
            return;
        }

        try {
            String activationUrl = "https://goodearth-postsales-platform.vercel.app/activate?token=" + (activationToken != null ? activationToken : "");
            log.info("Generated activation URL");
            String subject = "Welcome to GoodEarth Homeowner Portal";
            String body = String.format(
                    "Dear %s,\n\n" +
                    "Welcome to GoodEarth.\n\n" +
                    "Your homeowner portal has been created.\n\n" +
                    "Please activate your account by clicking below.\n\n" +
                    "%s\n\n" +
                    "This link expires in 24 hours.\n\n" +
                    "If you did not request this account, ignore this email.\n\n" +
                    "Regards,\n" +
                    "GoodEarth Team",
                    buyer.getFullName(),
                    activationUrl
            );
            log.info("Preparing EmailRequest");
            log.info("Calling EmailService.sendEmail()");
            emailService.sendEmail(buyer.getEmail(), subject, body);
            log.info("EmailService returned successfully");
            log.info("Updating buyer.welcomeEmailSent=true");
            buyer.setWelcomeEmailSent(true);
            buyer.setSyncStatus("SUCCESS");
            buyerRepository.save(buyer);
            log.info("Buyer saved after email");
        } catch (Exception ex) {
            log.error("Email sending failed with complete exception and stack trace:", ex);
            buyer.setWelcomeEmailSent(false);
            buyer.setSyncStatus("EMAIL_FAILED");
            buyerRepository.save(buyer);
        }
        log.info(">>> EXIT sendWelcomeEmail");
    }
}
