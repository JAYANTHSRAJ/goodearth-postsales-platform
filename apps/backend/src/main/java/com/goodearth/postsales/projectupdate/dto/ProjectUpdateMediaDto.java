package com.goodearth.postsales.projectupdate.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectUpdateMediaDto {
    private UUID id;
    private UUID projectUpdateId;
    private String workdriveFileId;
    private String mediaType;
    private String thumbnailUrl;
    private String previewUrl;
    private String downloadUrl;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
}
