package com.goodearth.postsales.notification.listener;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.common.enumeration.UserRole;
import com.goodearth.postsales.notification.entity.*;
import com.goodearth.postsales.notification.event.NotificationEvents;
import com.goodearth.postsales.notification.repository.NotificationTemplateRepository;
import com.goodearth.postsales.notification.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class NotificationEventListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final NotificationTemplateRepository templateRepository;

    public NotificationEventListener(
            NotificationService notificationService,
            UserRepository userRepository,
            NotificationTemplateRepository templateRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.templateRepository = templateRepository;
    }

    private User findUserByEmail(String email) {
        if (email == null) return null;
        return userRepository.findByEmailIgnoreCase(email).orElse(null);
    }

    private String resolveMessage(String templateCode, Map<String, String> variables, String defaultMessage) {
        Optional<NotificationTemplate> templateOpt = templateRepository.findByCodeAndChannelAndActive(templateCode, NotificationChannel.IN_APP, true);
        if (templateOpt.isPresent()) {
            String body = templateOpt.get().getBody();
            for (Map.Entry<String, String> entry : variables.entrySet()) {
                body = body.replace("{/" + entry.getKey() + "/}", entry.getValue() != null ? entry.getValue() : "");
                body = body.replace("{{" + entry.getKey() + "}}", entry.getValue() != null ? entry.getValue() : "");
            }
            return body;
        }
        return defaultMessage;
    }

    @Async
    @EventListener
    public void handleBuyerSynced(NotificationEvents.BuyerSyncedEvent event) {
        log.info("Handling BuyerSyncedEvent for: {}", event.buyerName());
        User user = findUserByEmail(event.email());
        
        Map<String, String> vars = new HashMap<>();
        vars.put("customerName", event.buyerName());

        Notification notif = new Notification();
        notif.setUser(user);
        notif.setTitle("Customer Account Synced");
        notif.setMessage(resolveMessage("BUYER_SYNCED", vars, "Welcome " + event.buyerName() + "! Your post-sales portal access is now ready."));
        notif.setNotificationType(NotificationType.SYSTEM);
        notif.setNotificationCategory(NotificationCategory.SUCCESS);
        notif.setPriority(NotificationPriority.NORMAL);
        notif.setIcon("success");
        notif.setReferenceType("BUYER");
        notif.setReferenceId(event.buyerId());
        notif.setTargetUrl("/client/dashboard");

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handleProjectSynced(NotificationEvents.ProjectSyncedEvent event) {
        log.info("Handling ProjectSyncedEvent for: {}", event.projectName());

        Notification notif = new Notification();
        notif.setBroadcast(true);
        notif.setTitle("Project Added to System");
        notif.setMessage("A new residential community project: " + event.projectName() + " has been synchronized.");
        notif.setNotificationType(NotificationType.SYSTEM);
        notif.setNotificationCategory(NotificationCategory.INFORMATION);
        notif.setPriority(NotificationPriority.LOW);
        notif.setIcon("success");
        notif.setReferenceType("PROJECT");
        notif.setReferenceId(event.projectId());

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handleWorkflowCreated(NotificationEvents.WorkflowCreatedEvent event) {
        log.info("Handling WorkflowCreatedEvent for: {}", event.customerName());
        User user = findUserByEmail(event.email());

        Map<String, String> vars = new HashMap<>();
        vars.put("customerName", event.customerName());
        vars.put("projectName", event.projectName());

        Notification notif = new Notification();
        notif.setUser(user);
        notif.setTitle("Workflow Initialized");
        notif.setMessage(resolveMessage("WORKFLOW_CREATED", vars, "Your post-sales workflow journey for " + event.projectName() + " has begun."));
        notif.setNotificationType(NotificationType.WORKFLOW);
        notif.setNotificationCategory(NotificationCategory.SUCCESS);
        notif.setPriority(NotificationPriority.NORMAL);
        notif.setIcon("workflow");
        notif.setReferenceType("WORKFLOW");
        notif.setReferenceId(event.workflowId());
        notif.setTargetUrl("/client/dashboard");

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handleStageChanged(NotificationEvents.StageChangedEvent event) {
        log.info("Handling StageChangedEvent for stage: {}", event.stageName());
        User user = findUserByEmail(event.email());

        Map<String, String> vars = new HashMap<>();
        vars.put("customerName", event.customerName());
        vars.put("projectName", event.projectName());
        vars.put("stageName", event.stageName());

        Notification notif = new Notification();
        notif.setUser(user);
        notif.setTitle("Stage Updated: " + event.stageName());
        notif.setMessage(resolveMessage("STAGE_CHANGED", vars, "Your villa project stage has updated to: " + event.stageName()));
        notif.setNotificationType(NotificationType.WORKFLOW);
        notif.setNotificationCategory(NotificationCategory.INFORMATION);
        notif.setPriority(NotificationPriority.HIGH);
        notif.setIcon("workflow");
        notif.setReferenceType("WORKFLOW");
        notif.setReferenceId(event.workflowId());
        notif.setTargetUrl("/client/dashboard");

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handleDocumentUploaded(NotificationEvents.DocumentUploadedEvent event) {
        log.info("Handling DocumentUploadedEvent for file: {}", event.fileName());
        User user = findUserByEmail(event.email());

        Map<String, String> vars = new HashMap<>();
        vars.put("customerName", event.customerName());
        vars.put("projectName", event.projectName());
        vars.put("fileName", event.fileName());

        Notification notif = new Notification();
        notif.setUser(user);
        notif.setTitle("New Document Uploaded");
        notif.setMessage(resolveMessage("DOCUMENT_UPLOADED", vars, "A new document (" + event.fileName() + ") has been uploaded."));
        notif.setNotificationType(NotificationType.DOCUMENT);
        notif.setNotificationCategory(NotificationCategory.INFORMATION);
        notif.setPriority(NotificationPriority.NORMAL);
        notif.setIcon("document");
        notif.setReferenceType("DOCUMENT");
        notif.setReferenceId(event.workflowId());
        notif.setTargetUrl("/client/documents");

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handleChangeRequestSubmitted(NotificationEvents.ChangeRequestSubmittedEvent event) {
        log.info("Handling ChangeRequestSubmittedEvent (ID: {})", event.annotationId());
        
        // Notify CRM team
        Notification notif = new Notification();
        notif.setTargetRole(UserRole.CRM.name());
        notif.setTitle("New Customization Requested");
        notif.setMessage("Customer " + event.customerName() + " has requested customizations (Annotation ID: " + event.annotationId() + ").");
        notif.setNotificationType(NotificationType.CHANGE_REQUEST);
        notif.setNotificationCategory(NotificationCategory.ACTION_REQUIRED);
        notif.setPriority(NotificationPriority.HIGH);
        notif.setIcon("warning");
        notif.setReferenceType("CHANGE_REQUEST");
        notif.setReferenceId(event.changeRequestId());
        notif.setTargetUrl("/admin/change-requests");

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handleChangeRequestApproved(NotificationEvents.ChangeRequestApprovedEvent event) {
        log.info("Handling ChangeRequestApprovedEvent (ID: {})", event.annotationId());
        User user = findUserByEmail(event.email());

        Map<String, String> vars = new HashMap<>();
        vars.put("customerName", event.customerName());
        vars.put("projectName", event.projectName());

        Notification notif = new Notification();
        notif.setUser(user);
        notif.setTitle("Customization Request Approved");
        notif.setMessage(resolveMessage("CHANGE_REQUEST_APPROVED", vars, "Your customization request (Annotation ID: " + event.annotationId() + ") has been approved."));
        notif.setNotificationType(NotificationType.CHANGE_REQUEST);
        notif.setNotificationCategory(NotificationCategory.SUCCESS);
        notif.setPriority(NotificationPriority.HIGH);
        notif.setIcon("success");
        notif.setReferenceType("CHANGE_REQUEST");
        notif.setReferenceId(event.changeRequestId());
        notif.setTargetUrl("/client/dashboard");

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handleQuotationPublished(NotificationEvents.QuotationPublishedEvent event) {
        log.info("Handling QuotationPublishedEvent");
        User user = findUserByEmail(event.email());

        Map<String, String> vars = new HashMap<>();
        vars.put("customerName", event.customerName());
        vars.put("projectName", event.projectName());
        vars.put("quotationAmount", event.quotationAmount().toString());

        Notification notif = new Notification();
        notif.setUser(user);
        notif.setTitle("Quotation Published");
        notif.setMessage(resolveMessage("QUOTATION_PUBLISHED", vars, "A quotation of ₹" + event.quotationAmount() + " is ready for your review."));
        notif.setNotificationType(NotificationType.FINANCE);
        notif.setNotificationCategory(NotificationCategory.ACTION_REQUIRED);
        notif.setPriority(NotificationPriority.CRITICAL);
        notif.setIcon("finance");
        notif.setReferenceType("QUOTATION");
        notif.setReferenceId(event.quoteId());
        notif.setTargetUrl("/client/dashboard");
        notif.setPrimaryActionLabel("Review Quotation");
        notif.setPrimaryActionUrl("/client/dashboard");

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handleQuotationAccepted(NotificationEvents.QuotationAcceptedEvent event) {
        log.info("Handling QuotationAcceptedEvent");

        Notification notif = new Notification();
        notif.setTargetRole(UserRole.FINANCE.name());
        notif.setTitle("Quotation Accepted by Customer");
        notif.setMessage("Quotation (ID: " + event.quoteId() + ") has been accepted by client: " + event.customerName());
        notif.setNotificationType(NotificationType.FINANCE);
        notif.setNotificationCategory(NotificationCategory.SUCCESS);
        notif.setPriority(NotificationPriority.HIGH);
        notif.setIcon("finance");
        notif.setReferenceType("QUOTATION");
        notif.setReferenceId(event.quoteId());

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handleInvoiceGenerated(NotificationEvents.InvoiceGeneratedEvent event) {
        log.info("Handling InvoiceGeneratedEvent");
        User user = findUserByEmail(event.email());

        Map<String, String> vars = new HashMap<>();
        vars.put("customerName", event.customerName());
        vars.put("projectName", event.projectName());
        vars.put("invoiceAmount", event.invoiceAmount().toString());

        Notification notif = new Notification();
        notif.setUser(user);
        notif.setTitle("New Milestone Invoice Generated");
        notif.setMessage(resolveMessage("INVOICE_GENERATED", vars, "A milestone invoice for ₹" + event.invoiceAmount() + " is due."));
        notif.setNotificationType(NotificationType.PAYMENT);
        notif.setNotificationCategory(NotificationCategory.ACTION_REQUIRED);
        notif.setPriority(NotificationPriority.CRITICAL);
        notif.setIcon("payment");
        notif.setReferenceType("INVOICE");
        notif.setReferenceId(event.invoiceId());
        notif.setTargetUrl("/client/finance");
        notif.setPrimaryActionLabel("Pay Now");
        notif.setPrimaryActionUrl("/client/finance");

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handlePaymentReceived(NotificationEvents.PaymentReceivedEvent event) {
        log.info("Handling PaymentReceivedEvent");
        User user = findUserByEmail(event.email());

        Map<String, String> vars = new HashMap<>();
        vars.put("customerName", event.customerName());
        vars.put("projectName", event.projectName());

        Notification notif = new Notification();
        notif.setUser(user);
        notif.setTitle("Payment Confirmed");
        notif.setMessage(resolveMessage("PAYMENT_RECEIVED", vars, "Payment confirmation receipt for ₹" + event.paymentAmount() + " has been issued."));
        notif.setNotificationType(NotificationType.PAYMENT);
        notif.setNotificationCategory(NotificationCategory.SUCCESS);
        notif.setPriority(NotificationPriority.HIGH);
        notif.setIcon("success");
        notif.setReferenceType("RECEIPT");
        notif.setReferenceId(event.paymentId());
        notif.setTargetUrl("/client/finance");

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handleProjectUpdateAdded(NotificationEvents.ProjectUpdateAddedEvent event) {
        log.info("Handling ProjectUpdateAddedEvent for project: {}", event.projectName());

        // Notify all clients and family members (simulated via broadcast to CLIENT role)
        Notification notif = new Notification();
        notif.setTargetRole(UserRole.CLIENT.name());
        notif.setTitle("New Construction Site Photos Uploaded");
        notif.setMessage("Visual updates posted: " + event.caption());
        notif.setNotificationType(NotificationType.PROJECT_UPDATE);
        notif.setNotificationCategory(NotificationCategory.INFORMATION);
        notif.setPriority(NotificationPriority.NORMAL);
        notif.setIcon("design");
        notif.setReferenceType("PROJECT_UPDATE");
        notif.setReferenceId(event.projectId());
        notif.setTargetUrl("/client/dashboard");

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handleFamilyMemberAdded(NotificationEvents.FamilyMemberAddedEvent event) {
        log.info("Handling FamilyMemberAddedEvent");
        User user = findUserByEmail(event.email());

        Notification notif = new Notification();
        notif.setUser(user);
        notif.setTitle("Family Member Portal Access Added");
        notif.setMessage("Portal access credentials sent to family member: " + event.memberName() + " (" + event.relation() + ")");
        notif.setNotificationType(NotificationType.SYSTEM);
        notif.setNotificationCategory(NotificationCategory.SUCCESS);
        notif.setPriority(NotificationPriority.LOW);
        notif.setIcon("success");
        notif.setReferenceType("FAMILY");
        notif.setReferenceId(event.buyerId());

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handleProjectUpdateCreated(com.goodearth.postsales.projectupdate.event.ProjectUpdateEvents.ProjectUpdateCreatedEvent event) {
        log.info("Project update draft created: {} (Workflow ID: {})", event.title(), event.workflowId());
    }

    @Async
    @EventListener
    public void handleProjectUpdatePublished(com.goodearth.postsales.projectupdate.event.ProjectUpdateEvents.ProjectUpdatePublishedEvent event) {
        log.info("Project update published: {} (Workflow ID: {})", event.title(), event.workflowId());
        
        Notification notif = new Notification();
        notif.setTargetRole(UserRole.CLIENT.name());
        notif.setTitle("New Project Update: " + event.title());
        notif.setMessage(event.description() != null ? event.description() : "A new progress update has been posted.");
        notif.setNotificationType(NotificationType.PROJECT_UPDATE);
        notif.setNotificationCategory(NotificationCategory.INFORMATION);
        notif.setPriority(NotificationPriority.NORMAL);
        notif.setIcon("design");
        notif.setReferenceType("PROJECT_UPDATE");
        notif.setReferenceId(event.updateId());
        notif.setTargetUrl("/client/dashboard");
        notif.setPrimaryActionLabel("View Details");
        notif.setPrimaryActionUrl("/client/dashboard");

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handleProjectUpdateHidden(com.goodearth.postsales.projectupdate.event.ProjectUpdateEvents.ProjectUpdateHiddenEvent event) {
        log.info("Project update hidden: {} (Workflow ID: {})", event.updateId(), event.workflowId());
    }

    @Async
    @EventListener
    public void handleAnnotationCreated(com.goodearth.postsales.annotation.event.AnnotationEvents.AnnotationCreatedEvent event) {
        log.info("Annotation created: {} (Workflow ID: {})", event.annotationId(), event.workflowId());
        
        Notification notif = new Notification();
        notif.setTargetRole(UserRole.DESIGN_STUDIO.name());
        notif.setTitle("New Blueprint Markup");
        notif.setMessage("A new drawing annotation markup has been submitted by " + event.authorName());
        notif.setNotificationType(NotificationType.DESIGN);
        notif.setNotificationCategory(NotificationCategory.ACTION_REQUIRED);
        notif.setPriority(NotificationPriority.NORMAL);
        notif.setIcon("design");
        notif.setReferenceType("ANNOTATION");
        notif.setReferenceId(event.annotationId());
        notif.setTargetUrl("/admin/annotations");

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handleAnnotationUpdated(com.goodearth.postsales.annotation.event.AnnotationEvents.AnnotationUpdatedEvent event) {
        log.info("Annotation updated: {} (Workflow ID: {})", event.annotationId(), event.workflowId());
    }

    @Async
    @EventListener
    public void handleAnnotationResolved(com.goodearth.postsales.annotation.event.AnnotationEvents.AnnotationResolvedEvent event) {
        log.info("Annotation resolved: {} (Workflow ID: {})", event.annotationId(), event.workflowId());
        
        Notification notif = new Notification();
        notif.setTargetRole(UserRole.CLIENT.name());
        notif.setTitle("Blueprint Markup Resolved");
        notif.setMessage("An outstanding blueprint pin/comment was resolved by the design studio.");
        notif.setNotificationType(NotificationType.DESIGN);
        notif.setNotificationCategory(NotificationCategory.SUCCESS);
        notif.setPriority(NotificationPriority.NORMAL);
        notif.setIcon("success");
        notif.setReferenceType("ANNOTATION");
        notif.setReferenceId(event.annotationId());
        notif.setTargetUrl("/client/dashboard");

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handleAnnotationApproved(com.goodearth.postsales.annotation.event.AnnotationEvents.AnnotationApprovedEvent event) {
        log.info("Annotation approved: {} (Workflow ID: {})", event.annotationId(), event.workflowId());
        
        Notification notif = new Notification();
        notif.setTargetRole(UserRole.CLIENT.name());
        notif.setTitle("Blueprint Markup Approved");
        notif.setMessage("Your customization drawing markup has been approved.");
        notif.setNotificationType(NotificationType.DESIGN);
        notif.setNotificationCategory(NotificationCategory.SUCCESS);
        notif.setPriority(NotificationPriority.HIGH);
        notif.setIcon("success");
        notif.setReferenceType("ANNOTATION");
        notif.setReferenceId(event.annotationId());
        notif.setTargetUrl("/client/dashboard");

        notificationService.createAndSendNotification(notif);
    }

    @Async
    @EventListener
    public void handleAnnotationRejected(com.goodearth.postsales.annotation.event.AnnotationEvents.AnnotationRejectedEvent event) {
        log.info("Annotation rejected: {} (Workflow ID: {})", event.annotationId(), event.workflowId());
        
        Notification notif = new Notification();
        notif.setTargetRole(UserRole.CLIENT.name());
        notif.setTitle("Blueprint Markup Rejected");
        notif.setMessage("Your customization drawing markup has been reviewed and rejected.");
        notif.setNotificationType(NotificationType.DESIGN);
        notif.setNotificationCategory(NotificationCategory.INFORMATION);
        notif.setPriority(NotificationPriority.NORMAL);
        notif.setIcon("warning");
        notif.setReferenceType("ANNOTATION");
        notif.setReferenceId(event.annotationId());
        notif.setTargetUrl("/client/dashboard");

        notificationService.createAndSendNotification(notif);
    }
}
