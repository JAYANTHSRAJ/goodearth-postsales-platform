package com.goodearth.postsales.notification.entity;

import com.goodearth.postsales.audit.BaseEntity;
import com.goodearth.postsales.auth.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "target_role", length = 50)
    private String targetRole;

    @Column(name = "is_broadcast", nullable = false)
    private boolean isBroadcast = false;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 50)
    private NotificationType notificationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_category", nullable = false, length = 50)
    private NotificationCategory notificationCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 50)
    private NotificationPriority priority;

    @Column(name = "reference_type", length = 100)
    private String referenceType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "target_url", length = 1000)
    private String targetUrl;

    @Column(name = "icon", length = 100)
    private String icon;

    @Column(name = "primary_action_label", length = 100)
    private String primaryActionLabel;

    @Column(name = "primary_action_url", length = 1000)
    private String primaryActionUrl;

    @Column(name = "secondary_action_label", length = 100)
    private String secondaryActionLabel;

    @Column(name = "secondary_action_url", length = 1000)
    private String secondaryActionUrl;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "scheduled_time")
    private LocalDateTime scheduledTime;
}
