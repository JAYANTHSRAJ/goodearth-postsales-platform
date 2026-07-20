package com.goodearth.postsales.notification.dto;

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
public class NotificationDto {
    private UUID id;
    private UUID userId;
    private String targetRole;
    private boolean isBroadcast;
    private String title;
    private String message;
    private String notificationType;
    private String notificationCategory;
    private String priority;
    private String referenceType;
    private UUID referenceId;
    private String targetUrl;
    private String icon;
    private String primaryActionLabel;
    private String primaryActionUrl;
    private String secondaryActionLabel;
    private String secondaryActionUrl;
    private LocalDateTime expiresAt;
    private LocalDateTime scheduledTime;
    private LocalDateTime createdAt;
    private boolean isRead;
    private LocalDateTime readAt;
}
