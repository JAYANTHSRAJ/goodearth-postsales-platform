package com.goodearth.postsales.notification.repository;

import com.goodearth.postsales.notification.entity.NotificationChannel;
import com.goodearth.postsales.notification.entity.NotificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, UUID> {
    Optional<NotificationTemplate> findByCodeAndChannel(String code, NotificationChannel channel);
    Optional<NotificationTemplate> findByCodeAndChannelAndActive(String code, NotificationChannel channel, boolean active);
}
