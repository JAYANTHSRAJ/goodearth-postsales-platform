package com.goodearth.postsales.notification.mapper;

import com.goodearth.postsales.notification.dto.NotificationDto;
import com.goodearth.postsales.notification.entity.Notification;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class NotificationMapper {

    public NotificationDto toDto(Notification notification, boolean isRead, LocalDateTime readAt) {
        if (notification == null) {
            return null;
        }

        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        if (notification.getUser() != null) {
            dto.setUserId(notification.getUser().getId());
        }
        dto.setTargetRole(notification.getTargetRole());
        dto.setBroadcast(notification.isBroadcast());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setNotificationType(notification.getNotificationType().name());
        dto.setNotificationCategory(notification.getNotificationCategory().name());
        dto.setPriority(notification.getPriority().name());
        dto.setReferenceType(notification.getReferenceType());
        dto.setReferenceId(notification.getReferenceId());
        dto.setTargetUrl(notification.getTargetUrl());
        dto.setIcon(notification.getIcon());
        dto.setPrimaryActionLabel(notification.getPrimaryActionLabel());
        dto.setPrimaryActionUrl(notification.getPrimaryActionUrl());
        dto.setSecondaryActionLabel(notification.getSecondaryActionLabel());
        dto.setSecondaryActionUrl(notification.getSecondaryActionUrl());
        dto.setExpiresAt(notification.getExpiresAt());
        dto.setScheduledTime(notification.getScheduledTime());
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setRead(isRead);
        dto.setReadAt(readAt);

        return dto;
    }
}
