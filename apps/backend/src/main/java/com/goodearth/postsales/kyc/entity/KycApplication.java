package com.goodearth.postsales.kyc.entity;

import com.goodearth.postsales.audit.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "kyc_applications")
@Getter
@Setter
@NoArgsConstructor
public class KycApplication extends BaseEntity {

    @Column(name = "booking_id", nullable = false)
    private String bookingId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private KycApplicationStatus status = KycApplicationStatus.DRAFT;

    @Column(name = "completion_percentage", nullable = false)
    private Integer completionPercentage = 0;

    @Column(name = "client_notes", columnDefinition = "TEXT")
    private String clientNotes;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "verified_by")
    private String verifiedBy;

    @OneToMany(mappedBy = "kycApplication", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<KycApplicant> applicants = new ArrayList<>();
}
