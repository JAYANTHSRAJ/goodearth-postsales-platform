package com.goodearth.postsales.client.entity;

import com.goodearth.postsales.audit.BaseEntity;
import com.goodearth.postsales.buyer.entity.Buyer;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "buyer_kyc_associations")
@Getter
@Setter
@NoArgsConstructor
public class BuyerKycAssociation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private Buyer buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "kyc_application_id", nullable = false)
    private KycApplication kycApplication;

    @Column(name = "version")
    private int version = 1;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "ACTIVE"; // ACTIVE, ARCHIVED

    @Column(name = "associated_at", nullable = false)
    private LocalDateTime associatedAt = LocalDateTime.now();

    @Column(name = "associated_by")
    private String associatedBy;
}
