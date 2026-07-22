package com.goodearth.postsales.config;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.common.enumeration.UserRole;
import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.project.entity.Project;
import com.goodearth.postsales.project.repository.ProjectRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.entity.WorkflowStatus;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import com.goodearth.postsales.stage.entity.Stage;
import com.goodearth.postsales.stage.repository.StageRepository;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.document.entity.DocumentStatus;
import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.projectupdate.entity.ProjectUpdate;
import com.goodearth.postsales.projectupdate.entity.UpdateType;
import com.goodearth.postsales.projectupdate.repository.ProjectUpdateRepository;
import com.goodearth.postsales.annotation.entity.Annotation;
import com.goodearth.postsales.annotation.entity.AnnotationType;
import com.goodearth.postsales.annotation.entity.AnnotationStatus;
import com.goodearth.postsales.annotation.repository.AnnotationRepository;
import com.goodearth.postsales.changerequest.entity.ChangeRequest;
import com.goodearth.postsales.changerequest.entity.ChangeRequestStatus;
import com.goodearth.postsales.changerequest.entity.Priority;
import com.goodearth.postsales.changerequest.repository.ChangeRequestRepository;
import com.goodearth.postsales.finance.entity.FinancialQuote;
import com.goodearth.postsales.finance.entity.QuoteStatus;
import com.goodearth.postsales.finance.repository.FinancialQuoteRepository;
import com.goodearth.postsales.finance.entity.PaymentSchedule;
import com.goodearth.postsales.finance.entity.InvoiceStatus;
import com.goodearth.postsales.finance.repository.PaymentScheduleRepository;
import com.goodearth.postsales.finance.entity.PaymentReceipt;
import com.goodearth.postsales.finance.entity.PaymentStatus;
import com.goodearth.postsales.finance.repository.PaymentReceiptRepository;
import com.goodearth.postsales.notification.entity.Notification;
import com.goodearth.postsales.notification.entity.NotificationType;
import com.goodearth.postsales.notification.entity.NotificationCategory;
import com.goodearth.postsales.notification.entity.NotificationPriority;
import com.goodearth.postsales.notification.repository.NotificationRepository;
import com.goodearth.postsales.workdrive.entity.WorkDriveFolder;
import com.goodearth.postsales.workdrive.entity.WorkDriveFile;
import com.goodearth.postsales.workdrive.entity.WorkDriveFileVersion;
import com.goodearth.postsales.workdrive.repository.WorkDriveFolderRepository;
import com.goodearth.postsales.workdrive.repository.WorkDriveFileRepository;
import com.goodearth.postsales.workdrive.repository.WorkDriveFileVersionRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Component
@Order(2)
public class DevelopmentDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevelopmentDataSeeder.class);

    private final UserRepository userRepository;
    private final BuyerRepository buyerRepository;
    private final ProjectRepository projectRepository;
    private final WorkflowRepository workflowRepository;
    private final StageRepository stageRepository;
    private final DocumentRepository documentRepository;
    private final ProjectUpdateRepository projectUpdateRepository;
    private final AnnotationRepository annotationRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final FinancialQuoteRepository financialQuoteRepository;
    private final PaymentScheduleRepository paymentScheduleRepository;
    private final PaymentReceiptRepository paymentReceiptRepository;
    private final NotificationRepository notificationRepository;
    private final WorkDriveFolderRepository workDriveFolderRepository;
    private final WorkDriveFileRepository workDriveFileRepository;
    private final WorkDriveFileVersionRepository workDriveFileVersionRepository;
    private final PasswordEncoder passwordEncoder;

    public DevelopmentDataSeeder(
            UserRepository userRepository,
            BuyerRepository buyerRepository,
            ProjectRepository projectRepository,
            WorkflowRepository workflowRepository,
            StageRepository stageRepository,
            DocumentRepository documentRepository,
            ProjectUpdateRepository projectUpdateRepository,
            AnnotationRepository annotationRepository,
            ChangeRequestRepository changeRequestRepository,
            FinancialQuoteRepository financialQuoteRepository,
            PaymentScheduleRepository paymentScheduleRepository,
            PaymentReceiptRepository paymentReceiptRepository,
            NotificationRepository notificationRepository,
            WorkDriveFolderRepository workDriveFolderRepository,
            WorkDriveFileRepository workDriveFileRepository,
            WorkDriveFileVersionRepository workDriveFileVersionRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.buyerRepository = buyerRepository;
        this.projectRepository = projectRepository;
        this.workflowRepository = workflowRepository;
        this.stageRepository = stageRepository;
        this.documentRepository = documentRepository;
        this.projectUpdateRepository = projectUpdateRepository;
        this.annotationRepository = annotationRepository;
        this.changeRequestRepository = changeRequestRepository;
        this.financialQuoteRepository = financialQuoteRepository;
        this.paymentScheduleRepository = paymentScheduleRepository;
        this.paymentReceiptRepository = paymentReceiptRepository;
        this.notificationRepository = notificationRepository;
        this.workDriveFolderRepository = workDriveFolderRepository;
        this.workDriveFileRepository = workDriveFileRepository;
        this.workDriveFileVersionRepository = workDriveFileVersionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Create SUPER_ADMIN if missing
        createSuperAdminIfMissing();
        if (userRepository.count() <= 1) {
            seedDevelopmentData();
            log.info("DevelopmentDataSeeder completed successfully.");
        } else {
            log.info("Database already seeded with users. Skipping development data seeding.");
        }
    }

    private void createSuperAdminIfMissing() {
        User admin = userRepository.findByEmailIgnoreCase("admin@goodearth.com").orElse(null);
        if (admin == null) {
            log.info("Creating default SUPER_ADMIN user...");
            admin = new User();
            admin.setEmail("admin@goodearth.com");
            admin.setPassword(passwordEncoder.encode("AdminPassword123!"));
            admin.setFullName("System Administrator");
            admin.setRole(UserRole.SUPER_ADMIN);
            admin.setEnabled(true);
            admin.setEmailVerified(true);
            admin.setAccountActivated(true);
            admin.setPortalActivated(true);
            admin.setAccountLocked(false);
            admin.setFailedLoginAttempts(0);
            userRepository.save(admin);
            log.info("Default SUPER_ADMIN created: admin@goodearth.com");
        } else {
            admin.setAccountActivated(true);
            admin.setPortalActivated(true);
            admin.setEnabled(true);
            admin.setAccountLocked(false);
            admin.setFailedLoginAttempts(0);
            admin.setPassword(passwordEncoder.encode("AdminPassword123!"));
            userRepository.save(admin);
        }
    }

    private void seedDevelopmentData() {
        // Create additional system users for realistic authoring/actions
        User crmUser = createSystemUser("crm@goodearth.com", "CRM Coordinator", UserRole.CRM);
        User designerUser = createSystemUser("designer@goodearth.com", "Design Architect", UserRole.DESIGN_STUDIO);
        User financeUser = createSystemUser("finance@goodearth.com", "Finance Executive", UserRole.FINANCE);
        User pmUser = createSystemUser("pm@goodearth.com", "Project Manager", UserRole.PROJECT_MANAGER);

        // Fetch all stages seeded by Liquibase
        List<Stage> stages = stageRepository.findAll();
        stages.sort(Comparator.comparingInt(Stage::getSequenceOrder));
        if (stages.isEmpty()) {
            throw new IllegalStateException("No workflow stages found in the database. Ensure Liquibase migration has run.");
        }

        Map<String, Stage> stageMap = new HashMap<>();
        for (Stage stage : stages) {
            stageMap.put(stage.getCode(), stage);
        }

        // 2. Create 5 Buyers
        List<Buyer> buyers = new ArrayList<>();
        buyers.add(createBuyer("contact_zoho_101", "Arjun Mehta", "arjun.mehta@example.com", "+91 98765 43210"));
        buyers.add(createBuyer("contact_zoho_102", "Priya Sharma", "priya.sharma@example.com", "+91 98765 43211"));
        buyers.add(createBuyer("contact_zoho_103", "Rohan Deshmukh", "rohan.deshmukh@example.com", "+91 98765 43212"));
        buyers.add(createBuyer("contact_zoho_104", "Ananya Iyer", "ananya.iyer@example.com", "+91 98765 43213"));
        buyers.add(createBuyer("contact_zoho_105", "Vikram Reddy", "vikram.reddy@example.com", "+91 98765 43214"));

        // 3. Create Corresponding Client Users
        for (Buyer buyer : buyers) {
            createClientUser(buyer.getEmail(), buyer.getFullName());
        }

        // 4. Create 5 Projects
        List<Project> projects = new ArrayList<>();
        projects.add(createProject("deal_zoho_201", "GoodEarth Malhar Resonance", "GEMR", "Kengeri, Bengaluru"));
        projects.add(createProject("deal_zoho_202", "GoodEarth Malhar Footprints", "GEMF", "Kengeri, Bengaluru"));
        projects.add(createProject("deal_zoho_203", "GoodEarth Malhar Patterns", "GEMP", "Kengeri, Bengaluru"));
        projects.add(createProject("deal_zoho_204", "GoodEarth Pyramids", "GEP", "Whitefield, Bengaluru"));
        projects.add(createProject("deal_zoho_205", "GoodEarth Orchard", "GEO", "Sarjapur, Bengaluru"));

        // 5. Create 5 Workflows & Assign different workflow stages
        List<Workflow> workflows = new ArrayList<>();
        workflows.add(createWorkflow(buyers.get(0), projects.get(0), stageMap.get("BOOKING_CONFIRMED")));
        workflows.add(createWorkflow(buyers.get(1), projects.get(1), stageMap.get("DESIGN_STUDIO")));
        workflows.add(createWorkflow(buyers.get(2), projects.get(2), stageMap.get("CUSTOMER_REVIEW")));
        workflows.add(createWorkflow(buyers.get(3), projects.get(3), stageMap.get("CONSTRUCTION")));
        workflows.add(createWorkflow(buyers.get(4), projects.get(4), stageMap.get("HANDOVER")));

        // 6. Create sample Documents
        // Workflow 1 Documents
        Document docW1_Booking = createDocument(workflows.get(0), "file_booking_1", 1, "Booking_Form_Arjun.pdf", DocumentType.BOOKING_FORM, "application/pdf", 1250000L, crmUser.getFullName());
        
        // Workflow 2 Documents
        Document docW2_Booking = createDocument(workflows.get(1), "file_booking_2", 1, "Booking_Form_Priya.pdf", DocumentType.BOOKING_FORM, "application/pdf", 1320000L, crmUser.getFullName());
        Document docW2_Agreement = createDocument(workflows.get(1), "file_agreement_2", 1, "Agreement_Draft_Priya.pdf", DocumentType.AGREEMENT, "application/pdf", 2450000L, crmUser.getFullName());

        // Workflow 3 Documents
        Document docW3_Booking = createDocument(workflows.get(2), "file_booking_3", 1, "Booking_Form_Rohan.pdf", DocumentType.BOOKING_FORM, "application/pdf", 1280000L, crmUser.getFullName());
        Document docW3_Agreement = createDocument(workflows.get(2), "file_agreement_3", 1, "Agreement_Signed_Rohan.pdf", DocumentType.AGREEMENT, "application/pdf", 2560000L, crmUser.getFullName());
        Document docW3_Design = createDocument(workflows.get(2), "file_design_3", 3, "Villa_Floor_Plan_Rev_3.pdf", DocumentType.DESIGN_PLAN, "application/pdf", 4800000L, designerUser.getFullName());

        // Workflow 4 Documents
        Document docW4_Booking = createDocument(workflows.get(3), "file_booking_4", 1, "Booking_Form_Ananya.pdf", DocumentType.BOOKING_FORM, "application/pdf", 1400000L, crmUser.getFullName());
        Document docW4_Agreement = createDocument(workflows.get(3), "file_agreement_4", 1, "Agreement_Signed_Ananya.pdf", DocumentType.AGREEMENT, "application/pdf", 2800000L, crmUser.getFullName());
        Document docW4_Design = createDocument(workflows.get(3), "file_design_4", 1, "Villa_Floor_Plan_Final.pdf", DocumentType.DESIGN_PLAN, "application/pdf", 5200000L, designerUser.getFullName());

        // Workflow 5 Documents
        Document docW5_Booking = createDocument(workflows.get(4), "file_booking_5", 1, "Booking_Form_Vikram.pdf", DocumentType.BOOKING_FORM, "application/pdf", 1350000L, crmUser.getFullName());
        Document docW5_Agreement = createDocument(workflows.get(4), "file_agreement_5", 1, "Agreement_Signed_Vikram.pdf", DocumentType.AGREEMENT, "application/pdf", 2700000L, crmUser.getFullName());
        Document docW5_Handover = createDocument(workflows.get(4), "file_handover_5", 1, "Handover_Certificate_Vikram.pdf", DocumentType.HANDOVER_CERTIFICATE, "application/pdf", 1150000L, pmUser.getFullName());

        // 7. Create sample Project Updates
        // W4 (Construction) Updates
        ProjectUpdate pu1 = createProjectUpdate(workflows.get(3), stageMap.get("CONSTRUCTION"), "Foundation Work Completed", "The foundation excavation and casting are fully completed for block A villas.", UpdateType.FOUNDATION, new BigDecimal("15.00"), pmUser.getFullName(), "Block A");
        ProjectUpdate pu2 = createProjectUpdate(workflows.get(3), stageMap.get("CONSTRUCTION"), "Plinth Level Reached", "Plinth beam casting completed successfully. Curing is in progress.", UpdateType.PLINTH, new BigDecimal("25.00"), pmUser.getFullName(), "Block A");
        ProjectUpdate pu3 = createProjectUpdate(workflows.get(3), stageMap.get("CONSTRUCTION"), "First-Floor Brickwork Commenced", "Load-bearing wall construction started on the first floor.", UpdateType.WALL, new BigDecimal("40.00"), pmUser.getFullName(), "Block A");

        // W2 (Design Studio) Updates
        ProjectUpdate pu4 = createProjectUpdate(workflows.get(1), stageMap.get("DESIGN_STUDIO"), "First Draft Floor Plan Ready", "The architecture team has completed the first draft. Please review.", UpdateType.GENERAL, new BigDecimal("5.00"), designerUser.getFullName(), "Design Studio");

        // 8. Create sample Annotations
        User rohanUser = userRepository.findByEmailIgnoreCase("rohan.deshmukh@example.com").orElse(crmUser);

        Annotation ann1 = createAnnotation(workflows.get(2), docW3_Design, "file_design_3", rohanUser, "CLIENT", AnnotationType.PIN, new BigDecimal("150.00"), new BigDecimal("200.00"), "Kitchen wall shift", "Shift this wall 2 feet to the left to accommodate a larger refrigerator.", AnnotationStatus.OPEN);
        Annotation ann2 = createAnnotation(workflows.get(2), docW3_Design, "file_design_3", rohanUser, "CLIENT", AnnotationType.PIN, new BigDecimal("280.00"), new BigDecimal("110.00"), "Electrical socket needed", "Add an extra 15A socket here for microwave oven.", AnnotationStatus.APPROVED);

        // 9. Create sample Change Requests
        ChangeRequest cr1 = createChangeRequest(workflows.get(2), docW3_Design, ann1.getId().toString(), "rohan.deshmukh@example.com", "designer@goodearth.com", ChangeRequestStatus.PENDING_CRM_REVIEW, Priority.MEDIUM, new BigDecimal("15000.00"), LocalDateTime.now().plusWeeks(2), "Requires electrical changes re-mapping", "cr_workdrive_file_1");
        ChangeRequest cr2 = createChangeRequest(workflows.get(3), docW4_Design, null, "ananya.iyer@example.com", "designer@goodearth.com", ChangeRequestStatus.QUOTATION_PUBLISHED, Priority.HIGH, new BigDecimal("45000.00"), LocalDateTime.now().plusWeeks(3), "Kitchen counter extension with Italian marble", "cr_workdrive_file_2");

        // 10. Create sample Financial Quotes
        FinancialQuote fq1 = createFinancialQuote(workflows.get(2), buyers.get(2), cr1, "est_zoho_301", new BigDecimal("15000.00"), new BigDecimal("2700.00"), new BigDecimal("0.00"), QuoteStatus.SENT, "Electrical layouts modification estimate");
        FinancialQuote fq2 = createFinancialQuote(workflows.get(3), buyers.get(3), cr2, "est_zoho_302", new BigDecimal("45000.00"), new BigDecimal("8100.00"), new BigDecimal("2000.00"), QuoteStatus.ACCEPTED, "Kitchen counter extension with Italian marble");

        // 11. Create sample Payment Schedules
        // Workflow 3 Payment Schedules
        PaymentSchedule psW3_1 = createPaymentSchedule(workflows.get(2), "inv_zoho_401", new BigDecimal("250000.00"), InvoiceStatus.PAID, LocalDateTime.now().minusMonths(2), "Booking Advance");
        PaymentSchedule psW3_2 = createPaymentSchedule(workflows.get(2), "inv_zoho_402", new BigDecimal("500000.00"), InvoiceStatus.SENT, LocalDateTime.now().plusWeeks(2), "Agreement Sign-off milestone");

        // Workflow 4 Payment Schedules
        PaymentSchedule psW4_1 = createPaymentSchedule(workflows.get(3), "inv_zoho_403", new BigDecimal("250000.00"), InvoiceStatus.PAID, LocalDateTime.now().minusMonths(4), "Booking Advance");
        PaymentSchedule psW4_2 = createPaymentSchedule(workflows.get(3), "inv_zoho_404", new BigDecimal("750000.00"), InvoiceStatus.PAID, LocalDateTime.now().minusMonths(2), "Foundation milestone");
        PaymentSchedule psW4_3 = createPaymentSchedule(workflows.get(3), "inv_zoho_405", new BigDecimal("750000.00"), InvoiceStatus.OVERDUE, LocalDateTime.now().minusWeeks(1), "Plinth milestone");

        // Seed Payment Receipts for paid milestones
        PaymentReceipt pr1 = createPaymentReceipt(workflows.get(2), "pay_zoho_501", new BigDecimal("250000.00"), PaymentStatus.SUCCESS, LocalDateTime.now().minusMonths(2), "Paid booking advance");
        PaymentReceipt pr2 = createPaymentReceipt(workflows.get(3), "pay_zoho_502", new BigDecimal("250000.00"), PaymentStatus.SUCCESS, LocalDateTime.now().minusMonths(4), "Paid booking advance");
        PaymentReceipt pr3 = createPaymentReceipt(workflows.get(3), "pay_zoho_503", new BigDecimal("750000.00"), PaymentStatus.SUCCESS, LocalDateTime.now().minusMonths(2), "Paid foundation milestone");

        // 12. Create sample Notifications
        Notification notifBroadcast = createNotification(null, "CLIENT", true, "System Maintenance", "Client portal will be down for scheduled maintenance on Sunday from 2 AM to 4 AM.", NotificationType.SYSTEM, NotificationCategory.INFORMATION, NotificationPriority.LOW, null, null);
        
        User ananyaUser = userRepository.findByEmailIgnoreCase("ananya.iyer@example.com").orElse(crmUser);
        Notification notifTargeted = createNotification(ananyaUser, "CLIENT", false, "Payment Overdue Notice", "Your payment for Plinth milestone is overdue. Please review outstanding invoice #inv_zoho_405.", NotificationType.PAYMENT, NotificationCategory.ACTION_REQUIRED, NotificationPriority.HIGH, "PaymentSchedule", psW4_3.getId());

        // 13. Create sample Client Portal data (WorkDrive integration mock structures)
        for (int i = 0; i < workflows.size(); i++) {
            Workflow wf = workflows.get(i);
            Buyer buyer = wf.getBuyer();
            
            String folderId = "folder_zoho_" + (i + 1);
            WorkDriveFolder folder = workDriveFolderRepository.findByFolderId(folderId)
                    .orElseGet(WorkDriveFolder::new);
            folder.setWorkflow(wf);
            folder.setFolderId(folderId);
            folder.setFolderName(buyer.getFullName() + " - " + wf.getProject().getProjectCode() + " - Villa Folder");
            workDriveFolderRepository.save(folder);

            // Connect files/versions for documents associated with this workflow
            List<Document> docList = documentRepository.findByWorkflowId(wf.getId());
            for (Document doc : docList) {
                WorkDriveFile file = workDriveFileRepository.findByFileId(doc.getWorkDriveFileId())
                        .orElseGet(WorkDriveFile::new);
                file.setFolder(folder);
                file.setDocument(doc);
                file.setFileId(doc.getWorkDriveFileId());
                file.setFileName(doc.getFileName());
                file.setMimeType(doc.getMimeType());
                file.setStatus("active");
                workDriveFileRepository.save(file);

                // Add version history
                if (doc.getDocumentType() == DocumentType.DESIGN_PLAN) {
                    for (int v = 1; v < doc.getVersion(); v++) {
                        final int ver = v;
                        WorkDriveFileVersion versionHist = workDriveFileVersionRepository.findByWorkDriveFileIdAndVersion(file.getId(), ver)
                                .orElseGet(WorkDriveFileVersion::new);
                        versionHist.setWorkDriveFile(file);
                        versionHist.setVersion(ver);
                        versionHist.setFileName(doc.getFileName().replace("Rev_" + doc.getVersion(), "Rev_" + ver).replace("Final", "Rev_" + ver));
                        versionHist.setMimeType(doc.getMimeType());
                        versionHist.setPreviewUrl("https://workdrive.zoho.in/file/preview/mock-rev" + ver);
                        versionHist.setDownloadUrl("https://workdrive.zoho.in/file/download/mock-rev" + ver);
                        versionHist.setUploadedBy(doc.getUploadedBy());
                        if (versionHist.getUploadedAt() == null) {
                            versionHist.setUploadedAt(doc.getUploadedAt().minusDays((long) (doc.getVersion() - ver) * 15));
                        }
                        workDriveFileVersionRepository.save(versionHist);
                    }

                    WorkDriveFileVersion versionLatest = workDriveFileVersionRepository.findByWorkDriveFileIdAndVersion(file.getId(), doc.getVersion())
                            .orElseGet(WorkDriveFileVersion::new);
                    versionLatest.setWorkDriveFile(file);
                    versionLatest.setVersion(doc.getVersion());
                    versionLatest.setFileName(doc.getFileName());
                    versionLatest.setMimeType(doc.getMimeType());
                    versionLatest.setPreviewUrl("https://workdrive.zoho.in/file/preview/mock-rev" + doc.getVersion());
                    versionLatest.setDownloadUrl("https://workdrive.zoho.in/file/download/mock-rev" + doc.getVersion());
                    versionLatest.setUploadedBy(doc.getUploadedBy());
                    if (versionLatest.getUploadedAt() == null) {
                        versionLatest.setUploadedAt(doc.getUploadedAt());
                    }
                    workDriveFileVersionRepository.save(versionLatest);
                } else {
                    WorkDriveFileVersion versionSingle = workDriveFileVersionRepository.findByWorkDriveFileIdAndVersion(file.getId(), 1)
                            .orElseGet(WorkDriveFileVersion::new);
                    versionSingle.setWorkDriveFile(file);
                    versionSingle.setVersion(1);
                    versionSingle.setFileName(doc.getFileName());
                    versionSingle.setMimeType(doc.getMimeType());
                    versionSingle.setPreviewUrl("https://workdrive.zoho.in/file/preview/mock-file-" + doc.getWorkDriveFileId());
                    versionSingle.setDownloadUrl("https://workdrive.zoho.in/file/download/mock-file-" + doc.getWorkDriveFileId());
                    versionSingle.setUploadedBy(doc.getUploadedBy());
                    if (versionSingle.getUploadedAt() == null) {
                        versionSingle.setUploadedAt(doc.getUploadedAt());
                    }
                    workDriveFileVersionRepository.save(versionSingle);
                }
            }
        }
    }

    private User createSystemUser(String email, String fullName, UserRole role) {
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            user = new User();
            user.setEmail(email);
        }
        user.setPassword(passwordEncoder.encode("Password123!"));
        user.setFullName(fullName);
        user.setRole(role);
        user.setEnabled(true);
        user.setEmailVerified(true);
        user.setAccountActivated(true);
        user.setAccountLocked(false);
        user.setFailedLoginAttempts(0);
        return userRepository.save(user);
    }

    private void createClientUser(String email, String fullName) {
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            user = new User();
            user.setEmail(email);
        }
        user.setPassword(passwordEncoder.encode("Password123!"));
        user.setFullName(fullName);
        user.setRole(UserRole.CLIENT);
        user.setEnabled(true);
        user.setEmailVerified(true);
        user.setAccountActivated(true);
        user.setAccountLocked(false);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);
    }

    private Buyer createBuyer(String zohoContactId, String fullName, String email, String phone) {
        Buyer buyer = buyerRepository.findByZohoContactId(zohoContactId)
                .orElseGet(() -> buyerRepository.findByEmailIgnoreCase(email).orElse(new Buyer()));
        buyer.setZohoContactId(zohoContactId);
        buyer.setFullName(fullName);
        buyer.setEmail(email);
        buyer.setPhone(phone);
        buyer.setStatus("ACTIVE");
        return buyerRepository.save(buyer);
    }

    private Project createProject(String zohoDealId, String projectName, String projectCode, String location) {
        Project project = projectRepository.findByZohoDealId(zohoDealId)
                .orElseGet(() -> projectRepository.findByProjectNameIgnoreCase(projectName).orElse(new Project()));
        project.setZohoDealId(zohoDealId);
        project.setProjectName(projectName);
        project.setProjectCode(projectCode);
        project.setLocation(location);
        project.setStatus("ACTIVE");
        return projectRepository.save(project);
    }

    private Workflow createWorkflow(Buyer buyer, Project project, Stage stage) {
        Workflow workflow = null;
        if (buyer != null && project != null) {
            workflow = workflowRepository.findByBuyerId(buyer.getId()).stream()
                    .filter(w -> w.getProject() != null && project.getId().equals(w.getProject().getId()))
                    .findFirst()
                    .orElse(null);
        }
        if (workflow == null) {
            workflow = new Workflow();
            if (workflow.getStartedAt() == null) {
                workflow.setStartedAt(LocalDateTime.now().minusMonths(6));
            }
        }
        workflow.setBuyer(buyer);
        workflow.setProject(project);
        if (stage != null) {
            workflow.setCurrentStageId(stage.getId());
        }
        workflow.setStatus(WorkflowStatus.ACTIVE);
        return workflowRepository.save(workflow);
    }

    private Document createDocument(Workflow workflow, String fileId, int version, String name, DocumentType type, String mimeType, Long size, String uploadedBy) {
        Document doc = documentRepository.findByWorkDriveFileId(fileId)
                .orElseGet(Document::new);
        doc.setWorkflow(workflow);
        doc.setWorkDriveFileId(fileId);
        doc.setVersion(version);
        doc.setFileName(name);
        doc.setDocumentType(type);
        doc.setMimeType(mimeType);
        doc.setFileSize(size);
        doc.setUploadedBy(uploadedBy);
        if (doc.getUploadedAt() == null) {
            doc.setUploadedAt(LocalDateTime.now().minusWeeks(4));
        }
        doc.setStatus(DocumentStatus.ACTIVE);
        return documentRepository.save(doc);
    }

    private ProjectUpdate createProjectUpdate(Workflow workflow, Stage stage, String title, String description, UpdateType type, BigDecimal progress, String publishedBy, String location) {
        ProjectUpdate update = projectUpdateRepository.findByWorkflowIdAndTitle(workflow.getId(), title)
                .orElseGet(ProjectUpdate::new);
        update.setWorkflow(workflow);
        update.setStage(stage);
        update.setTitle(title);
        update.setDescription(description);
        update.setUpdateType(type);
        update.setProgressPercentage(progress);
        update.setPublishedBy(publishedBy);
        if (update.getPublishedAt() == null) {
            update.setPublishedAt(LocalDateTime.now().minusWeeks(1));
        }
        update.setVisibleToClient(true);
        update.setLocation(location);
        return projectUpdateRepository.save(update);
    }

    private Annotation createAnnotation(Workflow workflow, Document document, String workdriveFileId, User author, String authorRole, AnnotationType type, BigDecimal x, BigDecimal y, String title, String description, AnnotationStatus status) {
        Annotation ann = annotationRepository.findByWorkflowIdAndWorkdriveFileIdAndTitle(workflow.getId(), workdriveFileId, title)
                .orElseGet(Annotation::new);
        ann.setWorkflow(workflow);
        ann.setDocument(document);
        ann.setWorkdriveFileId(workdriveFileId);
        ann.setAuthor(author);
        ann.setAuthorRole(authorRole);
        ann.setAnnotationType(type);
        ann.setXCoordinate(x);
        ann.setYCoordinate(y);
        ann.setPageNumber(1);
        ann.setColor("#FF0000");
        ann.setTitle(title);
        ann.setDescription(description);
        ann.setStatus(status);
        return annotationRepository.save(ann);
    }

    private ChangeRequest createChangeRequest(Workflow workflow, Document document, String annotationId, String requestedBy, String assignedTo, ChangeRequestStatus status, Priority priority, BigDecimal cost, LocalDateTime completionDate, String remarks, String workDriveFileId) {
        ChangeRequest cr = changeRequestRepository.findByWorkflowIdAndWorkDriveFileId(workflow.getId(), workDriveFileId)
                .orElseGet(ChangeRequest::new);
        cr.setWorkflow(workflow);
        cr.setDocument(document);
        cr.setAnnotationId(annotationId);
        cr.setRequestedBy(requestedBy);
        cr.setAssignedTo(assignedTo);
        cr.setStatus(status);
        cr.setPriority(priority);
        cr.setEstimatedCost(cost);
        cr.setEstimatedCompletionDate(completionDate);
        cr.setRemarks(remarks);
        cr.setWorkDriveFileId(workDriveFileId);
        return changeRequestRepository.save(cr);
    }

    private FinancialQuote createFinancialQuote(Workflow workflow, Buyer buyer, ChangeRequest changeRequest, String zohoEstimateId, BigDecimal amount, BigDecimal gst, BigDecimal discount, QuoteStatus status, String remarks) {
        FinancialQuote fq = financialQuoteRepository.findByZohoEstimateId(zohoEstimateId)
                .orElseGet(FinancialQuote::new);
        fq.setWorkflow(workflow);
        fq.setBuyer(buyer);
        fq.setChangeRequest(changeRequest);
        fq.setZohoEstimateId(zohoEstimateId);
        fq.setAmount(amount);
        fq.setGst(gst);
        fq.setDiscount(discount);
        fq.setStatus(status);
        fq.setRemarks(remarks);
        return financialQuoteRepository.save(fq);
    }

    private PaymentSchedule createPaymentSchedule(Workflow workflow, String zohoInvoiceId, BigDecimal amount, InvoiceStatus status, LocalDateTime dueDate, String remarks) {
        PaymentSchedule ps = paymentScheduleRepository.findByZohoInvoiceId(zohoInvoiceId)
                .orElseGet(PaymentSchedule::new);
        ps.setWorkflow(workflow);
        ps.setZohoInvoiceId(zohoInvoiceId);
        ps.setAmount(amount);
        ps.setStatus(status);
        ps.setDueDate(dueDate);
        ps.setRemarks(remarks);
        return paymentScheduleRepository.save(ps);
    }

    private PaymentReceipt createPaymentReceipt(Workflow workflow, String zohoPaymentId, BigDecimal amount, PaymentStatus status, LocalDateTime paidDate, String remarks) {
        PaymentReceipt pr = paymentReceiptRepository.findByZohoPaymentId(zohoPaymentId)
                .orElseGet(PaymentReceipt::new);
        pr.setWorkflow(workflow);
        pr.setZohoPaymentId(zohoPaymentId);
        pr.setAmount(amount);
        pr.setStatus(status);
        pr.setPaidDate(paidDate);
        pr.setRemarks(remarks);
        return paymentReceiptRepository.save(pr);
    }

    private Notification createNotification(User user, String targetRole, boolean isBroadcast, String title, String message, NotificationType type, NotificationCategory category, NotificationPriority priority, String refType, UUID refId) {
        Notification notif = notificationRepository.findFirstByTitle(title)
                .orElseGet(Notification::new);
        notif.setUser(user);
        notif.setTargetRole(targetRole);
        notif.setBroadcast(isBroadcast);
        notif.setTitle(title);
        notif.setMessage(message);
        notif.setNotificationType(type);
        notif.setNotificationCategory(category);
        notif.setPriority(priority);
        notif.setReferenceType(refType);
        notif.setReferenceId(refId);
        if (notif.getExpiresAt() == null) {
            notif.setExpiresAt(LocalDateTime.now().plusMonths(1));
        }
        return notificationRepository.save(notif);
    }
}
