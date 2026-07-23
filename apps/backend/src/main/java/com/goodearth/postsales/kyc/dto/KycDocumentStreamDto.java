package com.goodearth.postsales.kyc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycDocumentStreamDto {
    private String fileName;
    private String mimeType;
    private long fileSize;
    private byte[] content;
}
