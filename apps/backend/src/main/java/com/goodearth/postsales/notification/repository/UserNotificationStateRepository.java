package com.goodearth.postsales.notification.repository;

import com.goodearth.postsales.notification.entity.UserNotificationState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserNotificationStateRepository extends JpaRepository<UserNotificationState, UUID> {
    Optional<UserNotificationState> findByUserIdAndNotificationId(UUID userId, UUID notificationId);
    List<UserNotificationState> findByUserId(UUID userId);
}
