package com.goodearth.postsales.kyc.dto;

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
public class KycCopySourceDto {
    private UUID workflowId;
    private String bookingId;
    private String unitName;
    private String projectName;
    private String status;
    private LocalDateTime submittedAt;
    private String applicationDate;
}
