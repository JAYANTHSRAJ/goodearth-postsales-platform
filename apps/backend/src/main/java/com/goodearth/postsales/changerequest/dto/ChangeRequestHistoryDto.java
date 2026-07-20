package com.goodearth.postsales.changerequest.dto;

import com.goodearth.postsales.changerequest.entity.ChangeRequestStatus;
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
public class ChangeRequestHistoryDto {
    private UUID id;
    private UUID changeRequestId;
    private String action;
    private String performedBy;
    private ChangeRequestStatus oldStatus;
    private ChangeRequestStatus newStatus;
    private String remarks;
    private LocalDateTime createdAt;
}
