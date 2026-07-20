package com.goodearth.postsales.workdrive.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Getter
@Setter
public class WorkDriveFolderDto {
    private UUID id;
    private UUID workflowId;
    private String folderId;
    private String folderName;
}
