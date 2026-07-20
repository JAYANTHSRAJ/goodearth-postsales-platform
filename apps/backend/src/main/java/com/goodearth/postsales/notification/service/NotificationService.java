package com.goodearth.postsales.notification.service;

import com.goodearth.postsales.notification.dto.NotificationDto;
import com.goodearth.postsales.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    Page<NotificationDto> getNotifications(UUID userId, String role, String type, String category, String priority, Boolean isRead, Pageable pageable);
    long getUnreadCount(UUID userId, String role);
    List<NotificationDto> getLatestNotifications(UUID userId, String role, int limit);
    void markAsRead(UUID userId, UUID notificationId);
    void markAllAsRead(UUID userId, String role);
    void softDelete(UUID userId, UUID notificationId, String actorEmail);
    void createAndSendNotification(Notification notification);
}
