package com.goodearth.postsales.workdrive.entity;

import com.goodearth.postsales.audit.BaseEntity;
import com.goodearth.postsales.workflow.entity.Workflow;
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
@Table(name = "workdrive_folders")
@Getter
@Setter
@NoArgsConstructor
public class WorkDriveFolder extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

    @Column(name = "folder_id", unique = true, nullable = false)
    private String folderId;

    @Column(name = "folder_name", nullable = false)
    private String folderName;
}
