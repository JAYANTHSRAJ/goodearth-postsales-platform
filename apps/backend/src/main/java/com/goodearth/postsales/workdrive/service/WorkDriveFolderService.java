package com.goodearth.postsales.workdrive.service;

import com.goodearth.postsales.workdrive.dto.WorkDriveFolderDto;

import java.util.UUID;

public interface WorkDriveFolderService {
    WorkDriveFolderDto getFolderByWorkflow(UUID workflowId);
    WorkDriveFolderDto registerFolder(UUID workflowId, String folderId, String folderName);
}
