package com.goodearth.postsales.sign.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class ZohoSignCreateRequest {
    private UUID workflowId;
    private UUID documentId;
    private String bookingId;
    private String dealRecordId;
    
    @NotBlank(message = "Document name is required")
    private String documentName;

    @NotBlank(message = "Recipient email is required")
    @Email(message = "Valid recipient email is required")
    private String recipientEmail;

    @NotBlank(message = "Recipient name is required")
    private String recipientName;

    private String recipientRole;
}
