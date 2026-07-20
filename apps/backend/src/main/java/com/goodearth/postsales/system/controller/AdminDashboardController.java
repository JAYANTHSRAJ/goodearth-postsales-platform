package com.goodearth.postsales.system.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.security.user.CustomUserDetails;
import com.goodearth.postsales.system.dto.AdminDashboardDto;
import com.goodearth.postsales.system.service.AdminDashboardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class AdminDashboardController {

    private static final Logger log = LoggerFactory.getLogger(AdminDashboardController.class);

    private final AdminDashboardService dashboardService;

    public AdminDashboardController(AdminDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping({"", "/stats"})
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<AdminDashboardDto>> getDashboardStats(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        long startTime = System.currentTimeMillis();
        AdminDashboardDto stats = dashboardService.getDashboardStats();
        long duration = System.currentTimeMillis() - startTime;

        String username = userDetails != null ? userDetails.getUsername() : "system";
        log.info("Endpoint: GET /api/v1/admin/dashboard, Execution Time: {}ms, User: {}",
                duration, username);
        log.info("Dashboard Response:\n{}", stats);

        return ResponseEntity.ok(new ApiResponse<>(stats));
    }
}
