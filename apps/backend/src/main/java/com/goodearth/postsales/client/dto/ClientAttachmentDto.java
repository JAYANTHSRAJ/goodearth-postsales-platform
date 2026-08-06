package com.goodearth.postsales.client.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClientAttachmentDto {
    private UUID id;
    private String attachmentId;
    private String fileName;
    private String category;
    private int version;
    private String mimeType;
    private String fileType;
    private long fileSize;
    private boolean isPreviewable;
    private String previewUrl;
    private String downloadUrl;
    private String uploadedBy;
    private String uploadedTime;
    private LocalDateTime uploadedAt;
    private List<ClientAttachmentDto> revisions;
}
