package com.goodearth.postsales.stage.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.stage.dto.StageDto;
import com.goodearth.postsales.stage.service.StageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/stages")
public class StageController {

    private static final Logger log = LoggerFactory.getLogger(StageController.class);

    private final StageService stageService;

    public StageController(StageService stageService) {
        this.stageService = stageService;
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<StageDto>> createStage(@RequestBody StageDto requestDto) {
        long startTime = System.currentTimeMillis();
        StageDto response = stageService.createStage(requestDto);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/stages, Execution Time: {}ms, Stage ID: {}",
                duration, response.getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<StageDto>> updateStage(@PathVariable UUID id, @RequestBody StageDto requestDto) {
        long startTime = System.currentTimeMillis();
        StageDto response = stageService.updateStage(id, requestDto);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: PATCH /api/v1/stages/{}, Execution Time: {}ms, Stage ID: {}",
                id, duration, response.getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'CLIENT')")
    public ResponseEntity<ApiResponse<List<StageDto>>> listStages() {
        long startTime = System.currentTimeMillis();
        List<StageDto> response = stageService.listStages();
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/stages, Execution Time: {}ms, Stage ID: N/A", duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'CLIENT')")
    public ResponseEntity<ApiResponse<StageDto>> getStage(@PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        StageDto response = stageService.getStage(id);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/stages/{}, Execution Time: {}ms, Stage ID: {}",
                id, duration, response.getId());

        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}
