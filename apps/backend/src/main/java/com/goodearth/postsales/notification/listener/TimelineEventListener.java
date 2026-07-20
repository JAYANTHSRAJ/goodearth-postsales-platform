package com.goodearth.postsales.notification.listener;

import com.goodearth.postsales.notification.event.NotificationEvents;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class TimelineEventListener {

    private static final Logger log = LoggerFactory.getLogger(TimelineEventListener.class);

    @EventListener
    public void handleWorkflowCreated(NotificationEvents.WorkflowCreatedEvent event) {
        log.info("[CLIENT TIMELINE RECORDED] Workflow Created | Customer: {} | Project: {}", event.customerName(), event.projectName());
    }

    @EventListener
    public void handleStageChanged(NotificationEvents.StageChangedEvent event) {
        log.info("[CLIENT TIMELINE RECORDED] Stage Updated to: {} | Customer: {} | Project: {}", event.stageName(), event.customerName(), event.projectName());
    }

    @EventListener
    public void handleDocumentUploaded(NotificationEvents.DocumentUploadedEvent event) {
        log.info("[CLIENT TIMELINE RECORDED] Document Uploaded: {} | Customer: {} | Project: {}", event.fileName(), event.customerName(), event.projectName());
    }

    @EventListener
    public void handleInvoiceGenerated(NotificationEvents.InvoiceGeneratedEvent event) {
        log.info("[CLIENT TIMELINE RECORDED] Milestone Invoice Generated for amount: ₹{} | Customer: {} | Project: {}", event.invoiceAmount(), event.customerName(), event.projectName());
    }

    @EventListener
    public void handlePaymentReceived(NotificationEvents.PaymentReceivedEvent event) {
        log.info("[CLIENT TIMELINE RECORDED] Payment Confirmed for amount: ₹{} | Customer: {} | Project: {}", event.paymentAmount(), event.customerName(), event.projectName());
    }

    @EventListener
    public void handleProjectUpdateAdded(NotificationEvents.ProjectUpdateAddedEvent event) {
        log.info("[CLIENT TIMELINE RECORDED] Project update posted: {} | Project: {}", event.caption(), event.projectName());
    }

    @EventListener
    public void handleProjectUpdatePublished(com.goodearth.postsales.projectupdate.event.ProjectUpdateEvents.ProjectUpdatePublishedEvent event) {
        if (event.isVisibleToClient()) {
            log.info("[CLIENT TIMELINE RECORDED] Project progress update published: {} | Target Workflow: {}", event.title(), event.workflowId());
        }
    }

    @EventListener
    public void handleAnnotationApproved(com.goodearth.postsales.annotation.event.AnnotationEvents.AnnotationApprovedEvent event) {
        log.info("[CLIENT TIMELINE RECORDED] Blueprint annotation markup approved | Annotation ID: {} | Workflow ID: {}", event.annotationId(), event.workflowId());
    }

    @EventListener
    public void handleAnnotationResolved(com.goodearth.postsales.annotation.event.AnnotationEvents.AnnotationResolvedEvent event) {
        log.info("[CLIENT TIMELINE RECORDED] Blueprint annotation markup resolved | Annotation ID: {} | Workflow ID: {}", event.annotationId(), event.workflowId());
    }
}
