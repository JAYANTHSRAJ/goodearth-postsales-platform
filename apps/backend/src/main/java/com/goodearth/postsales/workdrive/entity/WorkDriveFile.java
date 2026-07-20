package com.goodearth.postsales.workdrive.entity;

import com.goodearth.postsales.audit.BaseEntity;
import com.goodearth.postsales.changerequest.entity.ChangeRequest;
import com.goodearth.postsales.document.entity.Document;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "workdrive_files")
@Getter
@Setter
@NoArgsConstructor
public class WorkDriveFile extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "folder_id", nullable = false)
    private WorkDriveFolder folder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "change_request_id")
    private ChangeRequest changeRequest;

    @Column(name = "file_id", unique = true, nullable = false)
    private String fileId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "status", nullable = false, length = 50)
    private String status;
}
