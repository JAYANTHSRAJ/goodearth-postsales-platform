package com.goodearth.postsales.client.entity;

import com.goodearth.postsales.audit.BaseEntity;
import com.goodearth.postsales.document.entity.Document;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

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

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "is_deleted")
    private boolean isDeleted = false;

    // WorkDrive Phase 6 Sync Fields
    @Column(name = "workdrive_file_id", length = 100)
    private String workDriveFileId;

    @Column(name = "workdrive_folder_id", length = 100)
    private String workDriveFolderId;

    @Column(name = "workdrive_upload_status", length = 50)
    private String workDriveUploadStatus = "PENDING"; // PENDING, SUCCESS, FAILED

    @Column(name = "workdrive_uploaded_at")
    private LocalDateTime workDriveUploadedAt;

    @Column(name = "workdrive_last_error", columnDefinition = "TEXT")
    private String workDriveLastError;
}
