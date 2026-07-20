package com.goodearth.postsales.workdrive.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Getter
@Setter
public class WorkDriveFileDto {
    private UUID id;
    private UUID folderId;
    private UUID documentId;
    private UUID changeRequestId;
    private String fileId;
    private String fileName;
    private String mimeType;
    private String status;
}
