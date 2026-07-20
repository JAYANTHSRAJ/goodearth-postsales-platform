package com.goodearth.postsales.projectupdate.service;

import com.goodearth.postsales.projectupdate.dto.ProjectProgressDto;
import com.goodearth.postsales.projectupdate.dto.ProjectUpdateDto;
import com.goodearth.postsales.projectupdate.dto.ProjectUpdateMediaDto;
import com.goodearth.postsales.projectupdate.dto.ProjectUpdateSummaryDto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ProjectUpdateService {
    ProjectUpdateDto createUpdate(UUID workflowId, UUID stageId, String title, String description, String updateType, BigDecimal progressPercentage, String location);
    ProjectUpdateDto editUpdate(UUID id, String title, String description, String updateType, BigDecimal progressPercentage, String location);
    void deleteUpdate(UUID id);
    ProjectUpdateDto publishUpdate(UUID id, String publishedBy);
    ProjectUpdateDto hideUpdate(UUID id);
    ProjectUpdateMediaDto uploadMediaMetadata(UUID updateId, String workdriveFileId, String mediaType, String uploadedBy);
    List<ProjectUpdateSummaryDto> listWorkflowUpdates(UUID workflowId, boolean clientOnly);
    List<ProjectUpdateSummaryDto> listLatestUpdates(int limit);
    ProjectUpdateSummaryDto getUpdateDetail(UUID id);
    List<ProjectUpdateMediaDto> getUpdateMedia(UUID id);
    ProjectProgressDto calculateProgress(UUID workflowId);
}
