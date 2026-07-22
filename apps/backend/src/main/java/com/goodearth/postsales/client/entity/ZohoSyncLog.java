package com.goodearth.postsales.client.entity;

import com.goodearth.postsales.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "zoho_sync_logs")
@Getter
@Setter
@NoArgsConstructor
public class ZohoSyncLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyc_application_id", referencedColumnName = "id")
    private KycApplication kycApplication;

    @Column(name = "zoho_deal_id", length = 100)
    private String zohoDealId;

    @Column(name = "sync_type", length = 50)
    private String syncType = "CRM_DEAL"; // CRM_DEAL or WORKDRIVE_FILE

    @Column(name = "sync_status", nullable = false, length = 50)
    private String syncStatus; // PENDING, PROCESSING, SUCCESS, FAILED

    @Column(name = "attempt_count")
    private int attemptCount = 0;

    @Column(name = "max_attempts")
    private int maxAttempts = 3;

    @Column(name = "last_attempt_at")
    private LocalDateTime lastAttemptAt;

    @Column(name = "last_error_message", columnDefinition = "TEXT")
    private String lastErrorMessage;

    @Column(name = "payload", columnDefinition = "TEXT")
    private String payload;

    @Column(name = "response_snapshot", columnDefinition = "TEXT")
    private String responseSnapshot;
}
