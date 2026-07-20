package com.goodearth.postsales.notification.service;

import com.goodearth.postsales.notification.dto.NotificationPreferenceDto;

import java.util.UUID;

public interface NotificationPreferenceService {
    NotificationPreferenceDto getPreferences(UUID userId);
    NotificationPreferenceDto updatePreferences(UUID userId, NotificationPreferenceDto dto);
}
