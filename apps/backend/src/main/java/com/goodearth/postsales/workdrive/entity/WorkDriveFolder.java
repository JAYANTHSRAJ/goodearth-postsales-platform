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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id")
    private Workflow workflow;

    @Column(name = "folder_id")
    private String folderId;

    @Column(name = "folder_name")
    private String folderName;

    @Column(name = "booking_id")
    private String bookingId;

    @Column(name = "project_folder_id")
    private String projectFolderId;

    @Column(name = "booking_folder_id")
    private String bookingFolderId;

    @Column(name = "kyc_subfolder_id")
    private String kycSubfolderId;

    @Column(name = "agreements_subfolder_id")
    private String agreementsSubfolderId;

    @Column(name = "payments_subfolder_id")
    private String paymentsSubfolderId;

    @Column(name = "handover_subfolder_id")
    private String handoverSubfolderId;
}
