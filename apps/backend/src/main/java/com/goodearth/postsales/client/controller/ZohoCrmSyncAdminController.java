package com.goodearth.postsales.client.controller;

import com.goodearth.postsales.client.entity.ZohoSyncLog;
import com.goodearth.postsales.client.service.ZohoCrmSyncService;
import com.goodearth.postsales.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/kyc/sync")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class ZohoCrmSyncAdminController {

    private final ZohoCrmSyncService syncService;

    public ZohoCrmSyncAdminController(ZohoCrmSyncService syncService) {
        this.syncService = syncService;
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<ZohoSyncLog>>> getSyncLogs(@RequestParam UUID kycId) {
        List<ZohoSyncLog> logs = syncService.getSyncLogs(kycId);
        return ResponseEntity.ok(new ApiResponse<>(logs));
    }

    @PostMapping("/{syncLogId}/retry")
    public ResponseEntity<ApiResponse<ZohoSyncLog>> manualRetrySync(@PathVariable UUID syncLogId) {
        ZohoSyncLog log = syncService.manualRetrySync(syncLogId);
        return ResponseEntity.ok(new ApiResponse<>(log));
    }
}
