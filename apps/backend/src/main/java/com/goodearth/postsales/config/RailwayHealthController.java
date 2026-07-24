package com.goodearth.postsales.config;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RailwayHealthController {

    @GetMapping({"/health", "/api/v1/health", "/actuator/health", "/actuator/health/liveness", "/actuator/health/readiness"})
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "postsales-backend",
                "timestamp", System.currentTimeMillis()
        ));
    }
}
