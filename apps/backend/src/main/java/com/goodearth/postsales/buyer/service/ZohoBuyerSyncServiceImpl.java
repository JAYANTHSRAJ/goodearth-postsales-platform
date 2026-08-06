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
    private final com.goodearth.postsales.workdrive.service.WorkDriveSyncService workDriveSyncService;

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
            ActivationTokenService activationTokenService,
            com.goodearth.postsales.workdrive.service.WorkDriveSyncService workDriveSyncService) {
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
        this.workDriveSyncService = workDriveSyncService;
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
        log.info(">>> ENTER processSingleDeal for Deal ID: {}", crmDeal.getId());
        String dealId = crmDeal.getId();
        if (dealId == null || dealId.trim().isEmpty()) {
            summary.put("buyersSkipped", (int) summary.get("buyersSkipped") + 1);
            return;
        }

        // Extract Deal attributes
        String email = crmDeal.getEmail();
        String contactId = crmDeal.getResolvedContactId();
        String buyerName = crmDeal.getResolvedContactName();
        String phone = crmDeal.getPhone();
        String stageName = crmDeal.getStage();

        log.info("[DEAL_SYNC_TRACE] Deal ID: {}, Deal Direct Email: '{}', Contact Lookup ID: '{}', Contact Name in Deal: '{}'",
                dealId, email, contactId, buyerName);

        // Fetch the related Contact if email or phone details are missing from Deal directly
        if ((email == null || email.trim().isEmpty() || phone == null || phone.trim().isEmpty() || buyerName == null || buyerName.trim().isEmpty())
                && contactId != null && !contactId.trim().isEmpty()) {
            String contactUrl = properties.getCrmApiUrl() + "/Contacts/" + contactId;
            log.info("[DEAL_SYNC_TRACE] Querying Zoho Contact API for Contact ID: {} via URL: {}", contactId, contactUrl);
            try {
                ZohoContactResponse contactResponse = apiClient.get(contactUrl, ZohoContactResponse.class);
                if (contactResponse != null && contactResponse.getData() != null && !contactResponse.getData().isEmpty()) {
                    ZohoContactResponse.ZohoContact contact = contactResponse.getData().get(0);
                    log.info("[DEAL_SYNC_TRACE] Contact API Response for ID {}: FullName='{}', Email='{}', Phone='{}', Status='{}'",
                            contactId, contact.getResolvedFullName(), contact.getEmail(), contact.getPhone(), contact.getStatus());

                    if (email == null || email.trim().isEmpty()) {
                        email = contact.getEmail();
                    }
                    if (buyerName == null || buyerName.trim().isEmpty() || "Unknown Name".equalsIgnoreCase(buyerName)) {
                        buyerName = contact.getResolvedFullName();
                    }
                    if (phone == null || phone.trim().isEmpty()) {
                        phone = contact.getPhone();
                    }
                } else {
                    log.warn("[DEAL_SYNC_TRACE] Contact API returned empty or null data list for Contact ID: {}", contactId);
                }
            } catch (Exception e) {
                log.error("[DEAL_SYNC_TRACE] Exception fetching related Contact ID: {} for Deal ID: {}: {}", contactId, dealId, e.getMessage(), e);
            }
        } else if (contactId == null || contactId.trim().isEmpty()) {
            log.info("[DEAL_SYNC_TRACE] No linked Contact ID found on Deal ID: {}. Direct Deal Email: '{}'", dealId, email);
        }

        log.info("[DEAL_SYNC_TRACE] Resolution Summary for Deal ID {}: Resolved Email='{}', Resolved Buyer Name='{}', Resolved Phone='{}'",
                dealId, email, buyerName, phone);

        // If a Deal has no Contact/Email information, skip it and log the reason
        if (email == null || email.trim().isEmpty()) {
            log.info("Skip reason: Deal ID {} has no email or contact name resolved. (Direct Deal Email='{}', Contact Lookup ID='{}')",
                    dealId, crmDeal.getEmail(), contactId);
            summary.put("buyersSkipped", (int) summary.get("buyersSkipped") + 1);
            return;
        }

        // 1. User Creation/Lookup
        Optional<User> userOpt = userRepository.findFirstByEmailIgnoreCaseOrderByIdDesc(email);
        User user;
        if (userOpt.isEmpty()) {
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

        // 2. Buyer Creation/Lookup (Search by Zoho Deal ID first, then by Zoho Contact ID, then by Email as fallback)
        if (contactId == null || contactId.trim().isEmpty()) {
            contactId = crmDeal.getResolvedContactId();
        }
        Optional<Buyer> buyerOpt = Optional.empty();
        if (dealId != null && !dealId.trim().isEmpty()) {
            buyerOpt = buyerRepository.findFirstByZohoDealId(dealId);
        }
        if (buyerOpt.isEmpty() && contactId != null && !contactId.trim().isEmpty()) {
            buyerOpt = buyerRepository.findFirstByZohoContactIdOrderByIdDesc(contactId);
        }
        if (buyerOpt.isEmpty()) {
            buyerOpt = buyerRepository.findFirstByEmailIgnoreCaseOrderByIdDesc(email);
        }

        Buyer buyer;
        if (buyerOpt.isPresent()) {
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
            String resolvedUnit = crmDeal.getUnitName() != null ? crmDeal.getUnitName().getName() : null;
            if (resolvedUnit == null || resolvedUnit.isBlank()) {
                resolvedUnit = crmDeal.getDealName();
            }
            buyer.setUnitName(resolvedUnit);
            log.info("Saving Buyer entity for email: {}", email);
            buyerRepository.save(buyer);
            summary.put("buyersUpdated", (int) summary.get("buyersUpdated") + 1);
            log.info("Buyer updated for email: {}", email);
        } else {
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
            
            String resolvedUnit = crmDeal.getUnitName() != null ? crmDeal.getUnitName().getName() : null;
            if (resolvedUnit == null || resolvedUnit.isBlank()) {
                resolvedUnit = crmDeal.getDealName();
            }
            buyer.setUnitName(resolvedUnit);
            log.info("Saving Buyer entity for email: {}", email);
            buyerRepository.save(buyer);
            summary.put("buyersCreated", (int) summary.get("buyersCreated") + 1);
            log.info("Buyer created for email: {}", email);
        }

        log.info("[TRACE_IDENTIFIER]\nStage: Webhook / Zoho Deal Sync -> processSingleDeal()\nBuyer Email: {}\nBuyer ID: {}\nUnit Name: {}\nDeal Name: {}\nZoho Deal Record ID: {}",
                email, buyer.getId(), buyer.getUnitName(), crmDeal.getDealName(), dealId);

        // 3. Project Creation/Lookup (Fallback to Deal_Name or GoodEarth Community if Project_Site is null/blank)
        String projectName = crmDeal.getProjectName();
        if (projectName == null || projectName.isBlank()) {
            projectName = crmDeal.getDealName();
        }
        if (projectName == null || projectName.isBlank()) {
            projectName = "GoodEarth Community";
        }
        projectName = projectName.trim();

        String projectCode = crmDeal.getProjectCode();
        if (projectCode == null || projectCode.trim().isEmpty()) {
            projectCode = projectName.toUpperCase().replaceAll("[^A-Z]", "");
            if (projectCode.length() > 5) {
                projectCode = projectCode.substring(0, 5);
            }
            if (projectCode.isBlank()) {
                projectCode = "GEPRJ";
            }
        }

        String location = crmDeal.getLocation();

        Project project;
        Optional<Project> projOpt = projectRepository.findFirstByZohoDealId(dealId);
        if (projOpt.isEmpty()) {
            projOpt = projectRepository.findFirstByProjectNameIgnoreCaseOrderByIdDesc(projectName);
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
                .filter(w -> w.getProject() != null && w.getProject().getId().equals(project.getId()))
                .findFirst();

        Stage resolvedStage = stageRepository.findByCode(stageName)
                .orElseGet(() -> stageRepository.findByCode("BOOKING_CONFIRMED").orElse(null));

        Workflow targetWorkflow;
        if (workflowOpt.isPresent()) {
            targetWorkflow = workflowOpt.get();
            if (resolvedStage != null) {
                targetWorkflow.setCurrentStageId(resolvedStage.getId());
            }
            targetWorkflow = workflowRepository.save(targetWorkflow);
            summary.put("workflowsUpdated", (int) summary.get("workflowsUpdated") + 1);
        } else {
            targetWorkflow = new Workflow();
            targetWorkflow.setBuyer(buyer);
            targetWorkflow.setProject(project);
            targetWorkflow.setStatus(WorkflowStatus.ACTIVE);
            targetWorkflow.setStartedAt(LocalDateTime.now());
            if (resolvedStage != null) {
                targetWorkflow.setCurrentStageId(resolvedStage.getId());
            }
            targetWorkflow = workflowRepository.save(targetWorkflow);
            summary.put("workflowsCreated", (int) summary.get("workflowsCreated") + 1);
            log.info("Created new Workflow for Buyer: {} on Project: {}", email, projectName);
        }

        // Auto-provision WorkDrive folder hierarchy immediately upon Deal/Booking unit sync
        try {
            String unitName = (buyer.getUnitName() != null && !buyer.getUnitName().isBlank()) 
                    ? buyer.getUnitName() 
                    : (crmDeal.getDealName() != null ? crmDeal.getDealName() : dealId);
            if (unitName != null && !unitName.isBlank() && project.getProjectName() != null) {
                log.info("Auto-provisioning WorkDrive unit folder for Project '{}', Unit '{}'", project.getProjectName(), unitName);
                com.goodearth.postsales.workdrive.entity.WorkDriveFolder wdFolder = workDriveSyncService.syncUnitFolder(project.getProjectName(), unitName);
                if (wdFolder.getWorkflow() == null && targetWorkflow != null) {
                    wdFolder.setWorkflow(targetWorkflow);
                }
            }
        } catch (Exception ex) {
            log.error("WorkDrive folder auto-provisioning exception for unit {}: {}", buyer.getUnitName(), ex.getMessage(), ex);
        }

        // 5. Send Welcome Email (Triggers whenever welcomeEmailSent is false)
        log.info("Evaluating welcome email condition for buyer: {}, welcomeEmailSent={}", email, buyer.isWelcomeEmailSent());
        if (!buyer.isWelcomeEmailSent()) {
            log.info(">>> CALLING sendWelcomeEmail for buyer: {}", email);
            sendWelcomeEmail(buyer);
        } else {
            log.info("Skipping welcome email send because welcomeEmailSent=true for buyer: {}", email);
            buyer.setSyncStatus("SUCCESS");
            buyerRepository.save(buyer);
        }
        log.info(">>> EXIT processSingleDeal for Deal ID: {}", dealId);
    }

    private void sendWelcomeEmail(Buyer buyer) {
        log.info("ENTER sendWelcomeEmail for buyer email: {}", buyer.getEmail());
        if (buyer.getEmail() == null || buyer.getEmail().isBlank()) {
            log.info("Skipping welcome email: buyer email is null or blank");
            return;
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(buyer.getEmail());
        String activationToken = null;
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getActivationToken() == null || user.getActivationToken().isBlank() ||
                (user.getActivationTokenExpiry() != null && user.getActivationTokenExpiry().isBefore(LocalDateTime.now()))) {
                activationToken = activationTokenService.generateToken(user);
            } else {
                activationToken = user.getActivationToken();
            }
        } else {
            User user = new User();
            user.setEmail(buyer.getEmail());
            user.setFullName(buyer.getFullName() != null ? buyer.getFullName() : buyer.getEmail());
            user.setPassword(passwordEncoder.encode("GoodEarth@123"));
            user.setRole(UserRole.CLIENT);
            user.setEnabled(true);
            user.setEmailVerified(true);
            user.setPortalActivated(true);
            userRepository.save(user);
            activationToken = activationTokenService.generateToken(user);
        }

        try {
            String activationUrl = "https://goodearth-postsales-platform.vercel.app/activate?token=" + activationToken;
            log.info("Generated activation URL: {}", activationUrl);
            String subject = "Welcome to GoodEarth Homeowner Portal";
            String body = String.format(
                    "Dear %s,\n\n" +
                    "Welcome to GoodEarth.\n\n" +
                    "Your homeowner portal has been created.\n\n" +
                    "Please activate your account by clicking below:\n\n" +
                    "%s\n\n" +
                    "This link expires in 24 hours.\n\n" +
                    "If you did not request this account, please ignore this email.\n\n" +
                    "Regards,\n" +
                    "GoodEarth Team",
                    buyer.getFullName(),
                    activationUrl
            );
            emailService.sendEmail(buyer.getEmail(), subject, body);
            log.info("EmailService.sendEmail completed successfully for {}", buyer.getEmail());
            buyer.setWelcomeEmailSent(true);
            buyer.setSyncStatus("SUCCESS");
            buyerRepository.save(buyer);
        } catch (Exception ex) {
            log.error("Email sending failed for buyer {}: {}", buyer.getEmail(), ex.getMessage(), ex);
            buyer.setWelcomeEmailSent(false);
            buyer.setSyncStatus("EMAIL_FAILED");
            buyerRepository.save(buyer);
        }
        log.info(">>> EXIT sendWelcomeEmail for buyer: {}", buyer.getEmail());
    }
}
