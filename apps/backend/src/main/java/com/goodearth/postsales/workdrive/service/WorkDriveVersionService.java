package com.goodearth.postsales.workdrive.service;

import com.goodearth.postsales.workdrive.dto.WorkDriveFileVersionDto;

import java.util.List;
import java.util.UUID;

public interface WorkDriveVersionService {
    List<WorkDriveFileVersionDto> getVersionHistory(UUID fileId);
    WorkDriveFileVersionDto getLatestVersion(UUID fileId);
}
