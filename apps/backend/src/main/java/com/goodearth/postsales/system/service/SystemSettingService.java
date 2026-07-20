package com.goodearth.postsales.system.service;

import com.goodearth.postsales.system.dto.SystemSettingDto;

import java.util.List;

public interface SystemSettingService {
    List<SystemSettingDto> getAllSettings();
    SystemSettingDto getSetting(String key);
    SystemSettingDto updateSetting(String key, String value);
}
