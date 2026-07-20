package com.goodearth.postsales.notification.service;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.notification.dto.NotificationPreferenceDto;
import com.goodearth.postsales.notification.entity.NotificationPreference;
import com.goodearth.postsales.notification.mapper.NotificationPreferenceMapper;
import com.goodearth.postsales.notification.repository.NotificationPreferenceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class NotificationPreferenceServiceImpl implements NotificationPreferenceService {

    private final NotificationPreferenceRepository repository;
    private final UserRepository userRepository;
    private final NotificationPreferenceMapper mapper;

    public NotificationPreferenceServiceImpl(
            NotificationPreferenceRepository repository,
            UserRepository userRepository,
            NotificationPreferenceMapper mapper) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public NotificationPreferenceDto getPreferences(UUID userId) {
        NotificationPreference pref = repository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreference(userId));
        return mapper.toDto(pref);
    }

    @Override
    @Transactional
    public NotificationPreferenceDto updatePreferences(UUID userId, NotificationPreferenceDto dto) {
        NotificationPreference pref = repository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
                    NotificationPreference newPref = new NotificationPreference();
                    newPref.setUser(user);
                    return newPref;
                });

        pref.setEmailEnabled(dto.isEmailEnabled());
        pref.setSmsEnabled(dto.isSmsEnabled());
        pref.setWhatsappEnabled(dto.isWhatsappEnabled());
        pref.setInAppEnabled(dto.isInAppEnabled());
        pref.setPushEnabled(dto.isPushEnabled());

        NotificationPreference saved = repository.save(pref);
        return mapper.toDto(saved);
    }

    private NotificationPreference createDefaultPreference(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        NotificationPreference pref = new NotificationPreference();
        pref.setUser(user);
        pref.setEmailEnabled(true);
        pref.setSmsEnabled(true);
        pref.setWhatsappEnabled(true);
        pref.setInAppEnabled(true);
        pref.setPushEnabled(true);
        return repository.save(pref);
    }
}
