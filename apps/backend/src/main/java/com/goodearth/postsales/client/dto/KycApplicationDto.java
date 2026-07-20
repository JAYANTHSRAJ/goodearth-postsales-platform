package com.goodearth.postsales.client.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class KycApplicationDto {
    private String status;
    private String draftData;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
}
