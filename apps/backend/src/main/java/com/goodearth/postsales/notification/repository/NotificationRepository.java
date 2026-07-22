package com.goodearth.postsales.notification.repository;

import com.goodearth.postsales.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    java.util.Optional<Notification> findFirstByTitle(String title);

    @Query("SELECT n FROM Notification n WHERE " +
           "(n.user.id = :userId OR n.targetRole = :role OR n.isBroadcast = true) AND " +
           "(n.expiresAt IS NULL OR n.expiresAt > :now) AND " +
           "(n.scheduledTime IS NULL OR n.scheduledTime <= :now) AND " +
           "NOT EXISTS (SELECT s FROM UserNotificationState s WHERE s.notification.id = n.id AND s.user.id = :userId AND s.deletedAt IS NOT NULL)")
    Page<Notification> findActiveNotificationsForUser(
            @Param("userId") UUID userId,
            @Param("role") String role,
            @Param("now") LocalDateTime now,
            Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE " +
           "(n.user.id = :userId OR n.targetRole = :role OR n.isBroadcast = true) AND " +
           "(n.expiresAt IS NULL OR n.expiresAt > :now) AND " +
           "(n.scheduledTime IS NULL OR n.scheduledTime <= :now) AND " +
           "NOT EXISTS (SELECT s FROM UserNotificationState s WHERE s.notification.id = n.id AND s.user.id = :userId AND s.deletedAt IS NOT NULL)")
    List<Notification> findActiveNotificationsForUser(
            @Param("userId") UUID userId,
            @Param("role") String role,
            @Param("now") LocalDateTime now);

    @Query("SELECT count(n) FROM Notification n WHERE " +
           "(n.user.id = :userId OR n.targetRole = :role OR n.isBroadcast = true) AND " +
           "(n.expiresAt IS NULL OR n.expiresAt > :now) AND " +
           "(n.scheduledTime IS NULL OR n.scheduledTime <= :now) AND " +
           "NOT EXISTS (SELECT s FROM UserNotificationState s WHERE s.notification.id = n.id AND s.user.id = :userId AND (s.isRead = true OR s.deletedAt IS NOT NULL))")
    long countUnreadNotificationsForUser(
            @Param("userId") UUID userId,
            @Param("role") String role,
            @Param("now") LocalDateTime now);
}
