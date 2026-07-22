package com.goodearth.postsales.client.entity;

import com.goodearth.postsales.audit.BaseEntity;
import com.goodearth.postsales.auth.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "kyc_audit_logs")
@Getter
@Setter
@NoArgsConstructor
public class KycAuditLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyc_application_id", referencedColumnName = "id", nullable = false)
    private KycApplication kycApplication;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_user_id", referencedColumnName = "id")
    private User performedByUser;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "previous_status", length = 50)
    private String previousStatus;

    @Column(name = "new_status", length = 50)
    private String newStatus;

    @Column(name = "snapshot_data", columnDefinition = "TEXT")
    private String snapshotData;
}
