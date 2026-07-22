package com.goodearth.postsales.client.controller;

import com.goodearth.postsales.client.entity.ZohoSyncLog;
import com.goodearth.postsales.client.service.ZohoWorkDriveSyncService;
import com.goodearth.postsales.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/kyc/workdrive")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class ZohoWorkDriveSyncAdminController {

    private final ZohoWorkDriveSyncService workDriveSyncService;

    public ZohoWorkDriveSyncAdminController(ZohoWorkDriveSyncService workDriveSyncService) {
        this.workDriveSyncService = workDriveSyncService;
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<ZohoSyncLog>>> getWorkDriveSyncLogs(@RequestParam UUID kycId) {
        List<ZohoSyncLog> logs = workDriveSyncService.getWorkDriveSyncLogs(kycId);
        return ResponseEntity.ok(new ApiResponse<>(logs));
    }

    @PostMapping("/{syncLogId}/retry")
    public ResponseEntity<ApiResponse<ZohoSyncLog>> manualRetryWorkDriveSync(@PathVariable UUID syncLogId) {
        ZohoSyncLog log = workDriveSyncService.manualRetryWorkDriveSync(syncLogId);
        return ResponseEntity.ok(new ApiResponse<>(log));
    }
}
