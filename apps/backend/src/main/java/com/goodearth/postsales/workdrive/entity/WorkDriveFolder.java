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

    @Column(name = "project_name")
    private String projectName;

    @Column(name = "unit_number")
    private String unitNumber;

    @Column(name = "team_folder_id")
    private String teamFolderId;

    @Column(name = "test_sandbox_folder_id")
    private String testSandboxFolderId;

    @Column(name = "project_folder_id")
    private String projectFolderId;

    @Column(name = "unit_folder_id")
    private String unitFolderId;

    @Column(name = "floor_plans_folder_id")
    private String floorPlansFolderId;

    @Column(name = "architectural_folder_id")
    private String architecturalFolderId;

    @Column(name = "structural_folder_id")
    private String structuralFolderId;

    @Column(name = "electrical_folder_id")
    private String electricalFolderId;

    @Column(name = "plumbing_folder_id")
    private String plumbingFolderId;

    @Column(name = "interior_folder_id")
    private String interiorFolderId;

    @Column(name = "site_photos_folder_id")
    private String sitePhotosFolderId;

    @Column(name = "approvals_folder_id")
    private String approvalsFolderId;

    @Column(name = "documents_folder_id")
    private String documentsFolderId;

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
