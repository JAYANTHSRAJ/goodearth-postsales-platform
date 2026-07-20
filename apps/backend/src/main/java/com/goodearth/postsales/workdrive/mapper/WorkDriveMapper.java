package com.goodearth.postsales.workdrive.mapper;

import com.goodearth.postsales.workdrive.dto.WorkDriveFileDto;
import com.goodearth.postsales.workdrive.dto.WorkDriveFolderDto;
import com.goodearth.postsales.workdrive.dto.WorkDriveFileVersionDto;
import com.goodearth.postsales.workdrive.entity.WorkDriveFile;
import com.goodearth.postsales.workdrive.entity.WorkDriveFolder;
import com.goodearth.postsales.workdrive.entity.WorkDriveFileVersion;
import org.springframework.stereotype.Component;

@Component
public class WorkDriveMapper {

    public WorkDriveFolderDto toDto(WorkDriveFolder folder) {
        if (folder == null) {
            return null;
        }
        WorkDriveFolderDto dto = new WorkDriveFolderDto();
        dto.setId(folder.getId());
        if (folder.getWorkflow() != null) {
            dto.setWorkflowId(folder.getWorkflow().getId());
        }
        dto.setFolderId(folder.getFolderId());
        dto.setFolderName(folder.getFolderName());
        return dto;
    }

    public WorkDriveFileDto toDto(WorkDriveFile file) {
        if (file == null) {
            return null;
        }
        WorkDriveFileDto dto = new WorkDriveFileDto();
        dto.setId(file.getId());
        if (file.getFolder() != null) {
            dto.setFolderId(file.getFolder().getId());
        }
        if (file.getDocument() != null) {
            dto.setDocumentId(file.getDocument().getId());
        }
        if (file.getChangeRequest() != null) {
            dto.setChangeRequestId(file.getChangeRequest().getId());
        }
        dto.setFileId(file.getFileId());
        dto.setFileName(file.getFileName());
        dto.setMimeType(file.getMimeType());
        dto.setStatus(file.getStatus());
        return dto;
    }

    public WorkDriveFileVersionDto toDto(WorkDriveFileVersion version) {
        if (version == null) {
            return null;
        }
        WorkDriveFileVersionDto dto = new WorkDriveFileVersionDto();
        dto.setId(version.getId());
        if (version.getWorkDriveFile() != null) {
            dto.setWorkDriveFileId(version.getWorkDriveFile().getId());
        }
        dto.setVersion(version.getVersion());
        dto.setFileName(version.getFileName());
        dto.setMimeType(version.getMimeType());
        dto.setPreviewUrl(version.getPreviewUrl());
        dto.setDownloadUrl(version.getDownloadUrl());
        dto.setUploadedBy(version.getUploadedBy());
        dto.setUploadedAt(version.getUploadedAt());
        return dto;
    }
}
