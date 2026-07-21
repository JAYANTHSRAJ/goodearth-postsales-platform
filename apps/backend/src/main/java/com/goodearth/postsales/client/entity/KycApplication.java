package com.goodearth.postsales.client.entity;

import com.goodearth.postsales.audit.BaseEntity;
import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.buyer.entity.Buyer;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "kyc_applications")
@Getter
@Setter
@NoArgsConstructor
public class KycApplication extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", referencedColumnName = "id")
    private Buyer buyer;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "DRAFT";

    @Column(name = "draft_data", columnDefinition = "TEXT")
    private String draftData;

    @Column(name = "is_verified")
    private boolean isVerified = false;

    @Column(name = "is_locked")
    private boolean isLocked = false;

    @Column(name = "version")
    private int version = 1;

    @Column(name = "parent_kyc_id")
    private UUID parentKycId;

    @Column(name = "is_current_version")
    private boolean isCurrentVersion = true;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}
