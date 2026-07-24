package com.goodearth.postsales.document.entity;

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

import java.time.LocalDateTime;

@Entity
@Table(name = "document_versions")
@Getter
@Setter
@NoArgsConstructor
public class DocumentVersion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "workdrive_file_id", nullable = false)
    private String workDriveFileId;

    @Column(name = "workdrive_permalink", length = 1000)
    private String workDrivePermalink;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "checksum_sha256", length = 64)
    private String checksumSha256;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private DocumentVersionStatus status;

    @Column(name = "rejection_reason_code", length = 100)
    private String rejectionReasonCode;

    @Column(name = "rejection_comments", columnDefinition = "TEXT")
    private String rejectionComments;

    @Column(name = "uploaded_by")
    private String uploadedBy;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @Column(name = "is_current", nullable = false)
    private Boolean isCurrent = true;

    @jakarta.persistence.Lob
    @Column(name = "file_bytes")
    private byte[] fileBytes;
}
