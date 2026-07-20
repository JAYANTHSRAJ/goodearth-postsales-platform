package com.goodearth.postsales.workdrive.entity;

import com.goodearth.postsales.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "workdrive_file_versions")
@Getter
@Setter
@NoArgsConstructor
public class WorkDriveFileVersion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workdrive_file_id", nullable = false)
    private WorkDriveFile workDriveFile;

    @Column(name = "version", nullable = false)
    private int version;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "preview_url", length = 1000)
    private String previewUrl;

    @Column(name = "download_url", length = 1000)
    private String downloadUrl;

    @Column(name = "uploaded_by")
    private String uploadedBy;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;
}
