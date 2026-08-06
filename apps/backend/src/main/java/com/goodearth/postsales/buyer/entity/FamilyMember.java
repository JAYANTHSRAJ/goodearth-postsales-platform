package com.goodearth.postsales.buyer.entity;

import com.goodearth.postsales.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "family_members")
@Getter
@Setter
@NoArgsConstructor
public class FamilyMember extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private Buyer buyer;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "relation", nullable = false)
    private String relation;

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "role")
    private String role = "FAMILY_MEMBER";

    @Column(name = "status")
    private String status = "ACTIVE";

    @Column(name = "invitation_status")
    private String invitationStatus = "ACTIVATED";

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "notes")
    private String notes;

    @Column(name = "permissions")
    private String permissions = "VIEW_MY_HOME,VIEW_FLOOR_PLANS,DOWNLOAD_FLOOR_PLANS,VIEW_DOCUMENTS,DOWNLOAD_DOCUMENTS,VIEW_CONSTRUCTION_UPDATES,VIEW_PAYMENTS,CONTACT_SUPPORT";
}
