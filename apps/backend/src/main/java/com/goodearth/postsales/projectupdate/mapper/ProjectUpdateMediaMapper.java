package com.goodearth.postsales.projectupdate.mapper;

import com.goodearth.postsales.projectupdate.dto.ProjectUpdateMediaDto;
import com.goodearth.postsales.projectupdate.entity.ProjectUpdateMedia;
import org.springframework.stereotype.Component;

@Component
public class ProjectUpdateMediaMapper {

    public ProjectUpdateMediaDto toDto(ProjectUpdateMedia media) {
        if (media == null) {
            return null;
        }

        ProjectUpdateMediaDto dto = new ProjectUpdateMediaDto();
        dto.setId(media.getId());
        if (media.getProjectUpdate() != null) {
            dto.setProjectUpdateId(media.getProjectUpdate().getId());
        }
        dto.setWorkdriveFileId(media.getWorkdriveFileId());
        dto.setMediaType(media.getMediaType().name());
        dto.setThumbnailUrl(media.getThumbnailUrl());
        dto.setPreviewUrl(media.getPreviewUrl());
        dto.setDownloadUrl(media.getDownloadUrl());
        dto.setUploadedBy(media.getUploadedBy());
        dto.setUploadedAt(media.getUploadedAt());

        return dto;
    }
}
