package com.goodearth.postsales.kyc.entity;

import com.goodearth.postsales.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "kyc_applicants")
@Getter
@Setter
@NoArgsConstructor
public class KycApplicant extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "kyc_application_id", nullable = false)
    private KycApplication kycApplication;

    @Enumerated(EnumType.STRING)
    @Column(name = "applicant_type", nullable = false, length = 50)
    private ApplicantType applicantType;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "email")
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "relation", length = 50)
    private String relation;

    @Column(name = "pan_number", length = 20)
    private String panNumber;

    @Column(name = "aadhaar_number", length = 20)
    private String aadhaarNumber;

    @Column(name = "address_street", length = 500)
    private String addressStreet;

    @Column(name = "address_city", length = 100)
    private String addressCity;

    @Column(name = "address_state", length = 100)
    private String addressState;

    @Column(name = "address_pincode", length = 20)
    private String addressPincode;

    @Column(name = "address_country", length = 100)
    private String addressCountry;
}
