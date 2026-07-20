package com.goodearth.postsales.workdrive.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class WorkDriveFileVersionDto {
    private UUID id;
    private UUID workDriveFileId;
    private int version;
    private String fileName;
    private String mimeType;
    private String previewUrl;
    private String downloadUrl;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
}
