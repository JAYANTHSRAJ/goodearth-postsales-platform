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
public class ClientDocumentSummaryDto {
    private UUID id;
    private String fileName;
    private String documentType;
    private LocalDateTime uploadedAt;
    private Long fileSize;
    private String uploadedBy;
    private String status;
}
