package com.goodearth.postsales.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDownloadResponseDto {

    private UUID documentId;
    private Integer versionNumber;
    private String fileName;
    private String mimeType;
    private String downloadUrl;
    private LocalDateTime expiresAt;
}
