package com.goodearth.postsales.client.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class KycReviewSummaryDto {
    private UUID id;
    private String unitName;
    private String status;
    private boolean isLocked;
    private boolean isVerified;
    private int version;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;

    private KycDraftDto formData;
    private List<DocumentMetadataDto> documents;
}
