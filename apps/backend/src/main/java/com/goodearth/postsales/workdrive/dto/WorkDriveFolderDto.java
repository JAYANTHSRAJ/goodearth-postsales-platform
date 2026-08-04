package com.goodearth.postsales.workdrive.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class WorkDriveFolderDto {
    private UUID id;
    private UUID workflowId;
    private String folderId;
    private String folderName;
    private String bookingId;
    private String projectName;
    private String unitNumber;
    private String teamFolderId;
    private String projectFolderId;
    private String unitFolderId;
    private String floorPlansFolderId;
    private String architecturalFolderId;
    private String structuralFolderId;
    private String electricalFolderId;
    private String plumbingFolderId;
    private String interiorFolderId;
    private String sitePhotosFolderId;
    private String approvalsFolderId;
    private String documentsFolderId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
