package com.goodearth.postsales.client.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClientTimelineEventDto {
    private LocalDateTime timestamp;
    private String type; // WORKFLOW, CHANGE_REQUEST, DOCUMENT, PAYMENT, NOTIFICATION
    private String title;
    private String description;
    private String status;
}
