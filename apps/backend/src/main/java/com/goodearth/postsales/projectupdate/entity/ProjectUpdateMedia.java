package com.goodearth.postsales.projectupdate.entity;

import com.goodearth.postsales.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "project_update_media")
@Getter
@Setter
@NoArgsConstructor
public class ProjectUpdateMedia extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_update_id", nullable = false)
    private ProjectUpdate projectUpdate;

    @Column(name = "workdrive_file_id", nullable = false)
    private String workdriveFileId;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 50)
    private MediaType mediaType;

    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    @Column(name = "preview_url", length = 1000)
    private String previewUrl;

    @Column(name = "download_url", length = 1000)
    private String downloadUrl;

    @Column(name = "uploaded_by")
    private String uploadedBy;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;
}
