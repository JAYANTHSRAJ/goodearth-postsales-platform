package com.goodearth.postsales.buyer.entity;

import com.goodearth.postsales.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
}
