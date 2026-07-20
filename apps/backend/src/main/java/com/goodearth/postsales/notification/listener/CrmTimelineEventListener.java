package com.goodearth.postsales.notification.listener;

import com.goodearth.postsales.notification.event.NotificationEvents;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class CrmTimelineEventListener {

    private static final Logger log = LoggerFactory.getLogger(CrmTimelineEventListener.class);

    @EventListener
    public void handleBuyerSynced(NotificationEvents.BuyerSyncedEvent event) {
        log.info("[CRM ACTIVITY RECORDED] Zoho Buyer Synchronized | Contact Name: {} | Email: {}", event.buyerName(), event.email());
    }

    @EventListener
    public void handleProjectSynced(NotificationEvents.ProjectSyncedEvent event) {
        log.info("[CRM ACTIVITY RECORDED] Zoho Project Synchronized | Name: {}", event.projectName());
    }

    @EventListener
    public void handleWorkflowCreated(NotificationEvents.WorkflowCreatedEvent event) {
        log.info("[CRM ACTIVITY RECORDED] Post-Sales Workflow initialized for Customer: {} on Project: {}", event.customerName(), event.projectName());
    }

    @EventListener
    public void handleChangeRequestSubmitted(NotificationEvents.ChangeRequestSubmittedEvent event) {
        log.info("[CRM ACTIVITY RECORDED] Change Request Raised by Customer: {} | Annotation ID: {}", event.customerName(), event.annotationId());
    }

    @EventListener
    public void handleChangeRequestApproved(NotificationEvents.ChangeRequestApprovedEvent event) {
        log.info("[CRM ACTIVITY RECORDED] Customization Request Approved by CRM | Annotation ID: {}", event.annotationId());
    }

    @EventListener
    public void handleQuotationPublished(NotificationEvents.QuotationPublishedEvent event) {
        log.info("[CRM ACTIVITY RECORDED] Quotation published for Customer: {} | Amount: ₹{}", event.customerName(), event.quotationAmount());
    }

    @EventListener
    public void handleQuotationAccepted(NotificationEvents.QuotationAcceptedEvent event) {
        log.info("[CRM ACTIVITY RECORDED] Quotation accepted by Customer: {} | Amount: ₹{}", event.customerName(), event.quotationAmount());
    }

    @EventListener
    public void handleFamilyMemberAdded(NotificationEvents.FamilyMemberAddedEvent event) {
        log.info("[CRM ACTIVITY RECORDED] Family member registration confirmed | Member: {} | Buyer: {}", event.memberName(), event.customerName());
    }

    @EventListener
    public void handleProjectUpdatePublished(com.goodearth.postsales.projectupdate.event.ProjectUpdateEvents.ProjectUpdatePublishedEvent event) {
        log.info("[CRM ACTIVITY RECORDED] Project progress update published: {} | Actor: {} | Target Workflow: {}", event.title(), event.publishedBy(), event.workflowId());
    }

    @EventListener
    public void handleAnnotationCreated(com.goodearth.postsales.annotation.event.AnnotationEvents.AnnotationCreatedEvent event) {
        log.info("[CRM ACTIVITY RECORDED] Blueprint markup submitted | Author: {} | Annotation ID: {} | Workflow ID: {}", event.authorName(), event.annotationId(), event.workflowId());
    }

    @EventListener
    public void handleAnnotationApproved(com.goodearth.postsales.annotation.event.AnnotationEvents.AnnotationApprovedEvent event) {
        log.info("[CRM ACTIVITY RECORDED] Blueprint markup approved | Annotation ID: {} | Workflow ID: {} | CR Spawned: {}", event.annotationId(), event.workflowId(), event.changeRequestId());
    }
}
