package com.goodearth.postsales.workdrive.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.workdrive.dto.WorkDriveFileDto;
import com.goodearth.postsales.workdrive.dto.WorkDriveFileVersionDto;
import com.goodearth.postsales.workdrive.dto.WorkDriveFolderDto;
import com.goodearth.postsales.workdrive.service.WorkDriveFolderService;
import com.goodearth.postsales.workdrive.service.WorkDriveSyncService;
import com.goodearth.postsales.workdrive.service.WorkDriveVersionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workdrive")
public class WorkDriveSyncController {

    private static final Logger log = LoggerFactory.getLogger(WorkDriveSyncController.class);

    private final WorkDriveSyncService syncService;
    private final WorkDriveFolderService folderService;
    private final WorkDriveVersionService versionService;

    public WorkDriveSyncController(
            WorkDriveSyncService syncService,
            WorkDriveFolderService folderService,
            WorkDriveVersionService versionService) {
        this.syncService = syncService;
        this.folderService = folderService;
        this.versionService = versionService;
    }

    @PostMapping("/sync/folder")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<String>> syncFolder(@RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        UUID workflowId = UUID.fromString(request.get("workflowId"));
        syncService.syncFolder(workflowId);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/workdrive/sync/folder, Execution Time: {}ms", duration);

        return ResponseEntity.ok(new ApiResponse<>("WorkDrive folder synchronized successfully."));
    }

    @PostMapping("/register-folder")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<WorkDriveFolderDto>> registerFolder(@RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        UUID workflowId = UUID.fromString(request.get("workflowId"));
        String folderId = request.get("folderId");
        String folderName = request.get("folderName");

        WorkDriveFolderDto response = folderService.registerFolder(workflowId, folderId, folderName);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/workdrive/register-folder, Execution Time: {}ms", duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/sync/files")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<String>> syncFiles(@RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        UUID workflowId = UUID.fromString(request.get("workflowId"));
        syncService.syncFiles(workflowId);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/workdrive/sync/files, Execution Time: {}ms", duration);

        return ResponseEntity.ok(new ApiResponse<>("WorkDrive files synchronized successfully."));
    }

    @PostMapping("/sync/versions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<String>> syncVersions(@RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        String fileId = request.get("fileId");
        syncService.syncVersions(fileId);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/workdrive/sync/versions, Execution Time: {}ms", duration);

        return ResponseEntity.ok(new ApiResponse<>("WorkDrive file versions synchronized successfully."));
    }

    @GetMapping("/files/{fileId}/versions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT', 'DESIGN_STUDIO', 'FINANCE')")
    public ResponseEntity<ApiResponse<List<WorkDriveFileVersionDto>>> getVersionHistory(@PathVariable UUID fileId) {
        long startTime = System.currentTimeMillis();
        List<WorkDriveFileVersionDto> response = versionService.getVersionHistory(fileId);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/workdrive/files/{}/versions, Execution Time: {}ms", fileId, duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @GetMapping("/files/{fileId}/latest")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM', 'CLIENT', 'DESIGN_STUDIO', 'FINANCE')")
    public ResponseEntity<ApiResponse<WorkDriveFileVersionDto>> getLatestVersion(@PathVariable UUID fileId) {
        long startTime = System.currentTimeMillis();
        WorkDriveFileVersionDto response = versionService.getLatestVersion(fileId);
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: GET /api/v1/workdrive/files/{}/latest, Execution Time: {}ms", fileId, duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/files/{fileId}/link")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CRM')")
    public ResponseEntity<ApiResponse<WorkDriveFileDto>> linkFile(
            @PathVariable UUID fileId,
            @RequestBody Map<String, String> request) {
        long startTime = System.currentTimeMillis();
        String changeRequestIdStr = request.get("changeRequestId");
        String documentIdStr = request.get("documentId");

        WorkDriveFileDto response;
        if (changeRequestIdStr != null) {
            UUID changeRequestId = UUID.fromString(changeRequestIdStr);
            response = syncService.linkFileToChangeRequest(fileId, changeRequestId);
        } else {
            UUID documentId = UUID.fromString(documentIdStr);
            response = syncService.linkFileToDocument(fileId, documentId);
        }
        long duration = System.currentTimeMillis() - startTime;

        log.info("Endpoint: POST /api/v1/workdrive/files/{}/link, Execution Time: {}ms", fileId, duration);

        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}
