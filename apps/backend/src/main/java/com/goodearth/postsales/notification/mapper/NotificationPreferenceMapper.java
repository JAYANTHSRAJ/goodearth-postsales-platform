package com.goodearth.postsales.notification.mapper;

import com.goodearth.postsales.notification.dto.NotificationPreferenceDto;
import com.goodearth.postsales.notification.entity.NotificationPreference;
import org.springframework.stereotype.Component;

@Component
public class NotificationPreferenceMapper {

    public NotificationPreferenceDto toDto(NotificationPreference pref) {
        if (pref == null) {
            return null;
        }

        NotificationPreferenceDto dto = new NotificationPreferenceDto();
        dto.setId(pref.getId());
        if (pref.getUser() != null) {
            dto.setUserId(pref.getUser().getId());
        }
        dto.setEmailEnabled(pref.isEmailEnabled());
        dto.setSmsEnabled(pref.isSmsEnabled());
        dto.setWhatsappEnabled(pref.isWhatsappEnabled());
        dto.setInAppEnabled(pref.isInAppEnabled());
        dto.setPushEnabled(pref.isPushEnabled());

        return dto;
    }
}
