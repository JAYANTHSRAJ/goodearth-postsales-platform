package com.goodearth.postsales.document.entity;

import com.goodearth.postsales.audit.BaseEntity;
import com.goodearth.postsales.kyc.entity.ApplicantType;
import com.goodearth.postsales.kyc.entity.KycApplicant;
import com.goodearth.postsales.kyc.entity.KycApplication;
import com.goodearth.postsales.workflow.entity.Workflow;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
public class Document extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id")
    private Workflow workflow;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyc_application_id")
    private KycApplication kycApplication;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyc_applicant_id")
    private KycApplicant kycApplicant;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 50)
    private DocumentCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "applicant_type", length = 50)
    private ApplicantType applicantType;

    @Column(name = "is_required")
    private Boolean isRequired = true;

    @Column(name = "workdrive_file_id")
    private String workDriveFileId;

    @Column(name = "version")
    private int version;

    @Column(name = "file_name")
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 50)
    private DocumentType documentType;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "uploaded_by")
    private String uploadedBy;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private DocumentStatus status;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DocumentVersion> versions = new ArrayList<>();
}
