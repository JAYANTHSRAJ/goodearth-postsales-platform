package com.goodearth.postsales.workdrive.service;

import com.goodearth.postsales.workdrive.dto.WorkDriveFileDto;

import java.util.UUID;

public interface WorkDriveSyncService {
    void syncFolder(UUID workflowId);
    void syncFiles(UUID workflowId);
    void syncVersions(String fileId);
    WorkDriveFileDto linkFileToChangeRequest(UUID fileId, UUID changeRequestId);
    WorkDriveFileDto linkFileToDocument(UUID fileId, UUID documentId);
}
