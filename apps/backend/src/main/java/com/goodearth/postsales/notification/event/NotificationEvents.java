package com.goodearth.postsales.notification.event;

import java.math.BigDecimal;
import java.util.UUID;

public final class NotificationEvents {

    private NotificationEvents() {}

    public static record BuyerSyncedEvent(
            UUID buyerId,
            String buyerName,
            String email
    ) {}

    public static record ProjectSyncedEvent(
            UUID projectId,
            String projectName
    ) {}

    public static record WorkflowCreatedEvent(
            UUID workflowId,
            UUID buyerId,
            String customerName,
            String email,
            String projectName
    ) {}

    public static record StageChangedEvent(
            UUID workflowId,
            String stageName,
            String customerName,
            String email,
            String projectName
    ) {}

    public static record DocumentUploadedEvent(
            UUID workflowId,
            String fileName,
            String documentType,
            String customerName,
            String email,
            String projectName
    ) {}

    public static record ChangeRequestSubmittedEvent(
            UUID workflowId,
            UUID changeRequestId,
            String annotationId,
            String customerName,
            String email,
            String projectName
    ) {}

    public static record ChangeRequestApprovedEvent(
            UUID workflowId,
            UUID changeRequestId,
            String annotationId,
            String customerName,
            String email,
            String projectName
    ) {}

    public static record QuotationPublishedEvent(
            UUID workflowId,
            UUID quoteId,
            BigDecimal quotationAmount,
            String customerName,
            String email,
            String projectName
    ) {}

    public static record QuotationAcceptedEvent(
            UUID workflowId,
            UUID quoteId,
            BigDecimal quotationAmount,
            String customerName,
            String email,
            String projectName
    ) {}

    public static record InvoiceGeneratedEvent(
            UUID workflowId,
            UUID invoiceId,
            BigDecimal invoiceAmount,
            String customerName,
            String email,
            String projectName
    ) {}

    public static record PaymentReceivedEvent(
            UUID workflowId,
            UUID paymentId,
            BigDecimal paymentAmount,
            String customerName,
            String email,
            String projectName
    ) {}

    public static record ProjectUpdateAddedEvent(
            UUID projectId,
            String projectName,
            String caption,
            String imageUrl
    ) {}

    public static record FamilyMemberAddedEvent(
            UUID buyerId,
            String memberName,
            String relation,
            String customerName,
            String email
    ) {}
}
