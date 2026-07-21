package com.goodearth.postsales.buyer.entity;

import com.goodearth.postsales.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "buyers")
@Getter
@Setter
@NoArgsConstructor
public class Buyer extends BaseEntity {

    @Column(name = "zoho_contact_id", unique = true, nullable = false)
    private String zohoContactId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "status")
    private String status;

    @Column(name = "zoho_deal_id")
    private String zohoDealId;

    @Column(name = "portal_activated")
    private boolean portalActivated = false;

    @Column(name = "last_sync_at")
    private java.time.LocalDateTime lastSyncAt;

    @Column(name = "sync_status")
    private String syncStatus;

    @Column(name = "welcome_email_sent")
    private boolean welcomeEmailSent = false;

    @Column(name = "co_applicant_name")
    private String coApplicantName;

    @Column(name = "unit_name")
    private String unitName;

    @Column(name = "kyc_application_id")
    private java.util.UUID kycApplicationId;
}
