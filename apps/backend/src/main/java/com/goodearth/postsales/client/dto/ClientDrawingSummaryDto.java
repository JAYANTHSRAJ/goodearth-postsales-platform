package com.goodearth.postsales.client.dto;

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
public class ClientDrawingSummaryDto {
    private UUID id;
    private String fileName;
    private int version;
    private String mimeType;
    private String previewUrl;
    private String downloadUrl;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
}
