package com.goodearth.postsales.client.entity;

import com.goodearth.postsales.audit.BaseEntity;
import com.goodearth.postsales.document.entity.Document;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "document_versions")
@Getter
@Setter
@NoArgsConstructor
public class DocumentVersion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", referencedColumnName = "id")
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyc_application_id", referencedColumnName = "id")
    private KycApplication kycApplication;

    @Column(name = "applicant_type", length = 50)
    private String applicantType; // PRIMARY, CO_APPLICANT, THIRD_APPLICANT

    @Column(name = "document_type", length = 50)
    private String documentType; // AADHAAR, PAN, VOTER_ID, ADDRESS_PROOF, BANK_PROOF

    @Column(name = "version")
    private int version = 1;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "workdrive_file_id", length = 100)
    private String workDriveFileId;
}
