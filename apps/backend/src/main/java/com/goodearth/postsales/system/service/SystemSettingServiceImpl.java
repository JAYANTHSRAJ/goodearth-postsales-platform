package com.goodearth.postsales.system.service;

import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.system.dto.SystemSettingDto;
import com.goodearth.postsales.system.entity.SystemSetting;
import com.goodearth.postsales.system.repository.SystemSettingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SystemSettingServiceImpl implements SystemSettingService {

    private final SystemSettingRepository repository;

    public SystemSettingServiceImpl(SystemSettingRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SystemSettingDto> getAllSettings() {
        return repository.findAll().stream()
                .map(setting -> new SystemSettingDto(setting.getKey(), setting.getValue(), setting.getDescription()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SystemSettingDto getSetting(String key) {
        SystemSetting setting = repository.findById(key)
                .orElseThrow(() -> new CustomException("Setting not found for key: " + key, HttpStatus.NOT_FOUND));
        return new SystemSettingDto(setting.getKey(), setting.getValue(), setting.getDescription());
    }

    @Override
    @Transactional
    public SystemSettingDto updateSetting(String key, String value) {
        SystemSetting setting = repository.findById(key)
                .orElseThrow(() -> new CustomException("Setting not found for key: " + key, HttpStatus.NOT_FOUND));
        setting.setValue(value);
        SystemSetting saved = repository.save(setting);
        return new SystemSettingDto(saved.getKey(), saved.getValue(), saved.getDescription());
    }
}
