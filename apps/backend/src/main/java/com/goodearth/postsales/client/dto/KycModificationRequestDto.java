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
public class KycModificationRequestDto {
    private UUID id;
    private UUID buyerId;
    private String unitName;
    private String projectName;
    private String customerName;
    private String customerEmail;
    private String reason;
    private String status;
    private LocalDateTime requestedAt;
    private LocalDateTime reviewedAt;
    private String reviewedBy;
}
