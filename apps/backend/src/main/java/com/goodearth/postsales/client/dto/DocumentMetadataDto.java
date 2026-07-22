package com.goodearth.postsales.client.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class DocumentMetadataDto {
    private UUID id;
    private String applicantType;
    private String documentType;
    private String fileName;
    private String filePath;
    private int version = 1;
    private String mimeType;
    private long sizeBytes;
}
