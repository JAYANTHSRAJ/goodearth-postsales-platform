package com.goodearth.postsales.workdrive.service;

import com.goodearth.postsales.workdrive.dto.WorkDriveFolderDto;
import com.goodearth.postsales.workdrive.entity.WorkDriveFolder;

import java.util.UUID;

public interface WorkDriveFolderService {
    WorkDriveFolderDto getFolderByWorkflow(UUID workflowId);
    WorkDriveFolderDto registerFolder(UUID workflowId, String folderId, String folderName);
    
    WorkDriveFolder getOrCreateBookingFolder(String bookingId);
    WorkDriveFolderDto getFolderByBooking(String bookingId);
}
