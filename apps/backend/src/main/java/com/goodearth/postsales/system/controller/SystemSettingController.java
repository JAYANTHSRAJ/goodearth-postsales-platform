package com.goodearth.postsales.system.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.system.dto.SystemSettingDto;
import com.goodearth.postsales.system.service.SystemSettingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/settings")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SystemSettingController {

    private static final Logger log = LoggerFactory.getLogger(SystemSettingController.class);

    private final SystemSettingService settingService;

    public SystemSettingController(SystemSettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SystemSettingDto>>> getAllSettings() {
        long startTime = System.currentTimeMillis();
        List<SystemSettingDto> response = settingService.getAllSettings();
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/admin/settings, Execution Time: {}ms, Size: {}", duration, response.size());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/{key}")
    public ResponseEntity<ApiResponse<SystemSettingDto>> getSetting(@PathVariable String key) {
        long startTime = System.currentTimeMillis();
        SystemSettingDto response = settingService.getSetting(key);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/admin/settings/{}, Execution Time: {}ms", key, duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PutMapping("/{key}")
    public ResponseEntity<ApiResponse<SystemSettingDto>> updateSetting(
            @PathVariable String key,
            @RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        String value = request.get("value");
        SystemSettingDto response = settingService.updateSetting(key, value);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: PUT /api/v1/admin/settings/{}, Execution Time: {}ms", key, duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}
