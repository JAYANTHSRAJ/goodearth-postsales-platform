package com.goodearth.postsales.notification.controller;

import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.notification.dto.NotificationDto;
import com.goodearth.postsales.notification.dto.NotificationPreferenceDto;
import com.goodearth.postsales.notification.service.NotificationPreferenceService;
import com.goodearth.postsales.notification.service.NotificationService;
import com.goodearth.postsales.security.user.CustomUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping
public class NotificationController {

    private static final Logger log = LoggerFactory.getLogger(NotificationController.class);

    private final NotificationService notificationService;
    private final NotificationPreferenceService preferenceService;

    public NotificationController(
            NotificationService notificationService,
            NotificationPreferenceService preferenceService) {
        this.notificationService = notificationService;
        this.preferenceService = preferenceService;
    }

    private String resolveUserRole(CustomUserDetails userDetails) {
        return userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(auth -> auth.startsWith("ROLE_") ? auth.substring(5) : auth)
                .findFirst()
                .orElse("CLIENT");
    }

    // 1. GET /api/v1/notifications (with filters, pagination, infinite scroll support)
    @GetMapping({"/api/v1/notifications", "/notifications"})
    @PreAuthorize("hasAnyRole('CLIENT', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<NotificationDto>>> getNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Boolean isRead,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        long startTime = System.currentTimeMillis();
        String role = resolveUserRole(userDetails);
        
        Page<NotificationDto> response = notificationService.getNotifications(
                userDetails.getId(), role, type, category, priority, isRead, pageable);
        
        log.info("Endpoint: GET /api/v1/notifications, Execution Time: {}ms, User: {}",
                System.currentTimeMillis() - startTime, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    // 2. GET /api/v1/notifications/unread (alias 1)
    @GetMapping({"/api/v1/notifications/unread", "/notifications/unread"})
    @PreAuthorize("hasAnyRole('CLIENT', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getUnreadNotificationsList(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        long startTime = System.currentTimeMillis();
        String role = resolveUserRole(userDetails);
        
        Page<NotificationDto> response = notificationService.getNotifications(
                userDetails.getId(), role, null, null, null, false, PageRequest.of(0, 100));
        
        log.info("Endpoint: GET /api/v1/notifications/unread, Execution Time: {}ms, User: {}",
                System.currentTimeMillis() - startTime, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(response.getContent()));
    }

    // 2b. GET /api/v1/notifications/unread-count (alias 2)
    @GetMapping({"/api/v1/notifications/unread-count", "/notifications/unread-count"})
    @PreAuthorize("hasAnyRole('CLIENT', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Long>> getUnreadNotificationsCount(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        long startTime = System.currentTimeMillis();
        String role = resolveUserRole(userDetails);
        
        long count = notificationService.getUnreadCount(userDetails.getId(), role);
        
        log.info("Endpoint: GET /api/v1/notifications/unread-count, Execution Time: {}ms, User: {}",
                System.currentTimeMillis() - startTime, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(count));
    }

    // 3. GET /api/v1/notifications/latest (dropdown bell latest 10)
    @GetMapping({"/api/v1/notifications/latest", "/notifications/latest"})
    @PreAuthorize("hasAnyRole('CLIENT', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getLatestNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "10") int limit) {
        long startTime = System.currentTimeMillis();
        String role = resolveUserRole(userDetails);
        
        List<NotificationDto> response = notificationService.getLatestNotifications(userDetails.getId(), role, limit);
        
        log.info("Endpoint: GET /api/v1/notifications/latest, Execution Time: {}ms, User: {}",
                System.currentTimeMillis() - startTime, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    // 4. PATCH /api/v1/notifications/{id}/read
    @PatchMapping({"/api/v1/notifications/{id}/read", "/notifications/{id}/read"})
    @PreAuthorize("hasAnyRole('CLIENT', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> markAsRead(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        notificationService.markAsRead(userDetails.getId(), id);
        
        log.info("Endpoint: PATCH /api/v1/notifications/{}/read, Execution Time: {}ms, User: {}",
                id, System.currentTimeMillis() - startTime, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>("Notification marked as read successfully."));
    }

    // 5. PATCH /api/v1/notifications/read-all
    @PatchMapping({"/api/v1/notifications/read-all", "/notifications/read-all"})
    @PreAuthorize("hasAnyRole('CLIENT', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        long startTime = System.currentTimeMillis();
        String role = resolveUserRole(userDetails);
        notificationService.markAllAsRead(userDetails.getId(), role);
        
        log.info("Endpoint: PATCH /api/v1/notifications/read-all, Execution Time: {}ms, User: {}",
                System.currentTimeMillis() - startTime, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>("All notifications marked as read."));
    }

    // 6. DELETE /api/v1/notifications/{id} (soft-delete)
    @DeleteMapping({"/api/v1/notifications/{id}", "/notifications/{id}"})
    @PreAuthorize("hasAnyRole('CLIENT', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteNotification(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        long startTime = System.currentTimeMillis();
        notificationService.softDelete(userDetails.getId(), id, userDetails.getUsername());
        
        log.info("Endpoint: DELETE /api/v1/notifications/{}, Execution Time: {}ms, User: {}",
                id, System.currentTimeMillis() - startTime, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>("Notification deleted successfully."));
    }

    // 7. GET /api/v1/notification-preferences (alias 1)
    @GetMapping({"/api/v1/notification-preferences", "/notification-preferences"})
    @PreAuthorize("hasAnyRole('CLIENT', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<NotificationPreferenceDto>> getPreferences(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        long startTime = System.currentTimeMillis();
        NotificationPreferenceDto response = preferenceService.getPreferences(userDetails.getId());
        
        log.info("Endpoint: GET /api/v1/notification-preferences, Execution Time: {}ms, User: {}",
                System.currentTimeMillis() - startTime, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    // 7b. GET /api/v1/notifications/preferences (alias 2)
    @GetMapping({"/api/v1/notifications/preferences", "/notifications/preferences"})
    @PreAuthorize("hasAnyRole('CLIENT', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<NotificationPreferenceDto>> getNotificationsPreferences(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        long startTime = System.currentTimeMillis();
        NotificationPreferenceDto response = preferenceService.getPreferences(userDetails.getId());
        
        log.info("Endpoint: GET /api/v1/notifications/preferences, Execution Time: {}ms, User: {}",
                System.currentTimeMillis() - startTime, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    // 8. PATCH /api/v1/notification-preferences (alias 1)
    @PatchMapping({"/api/v1/notification-preferences", "/notification-preferences"})
    @PreAuthorize("hasAnyRole('CLIENT', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<NotificationPreferenceDto>> updatePreferences(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody NotificationPreferenceDto requestDto) {
        long startTime = System.currentTimeMillis();
        NotificationPreferenceDto response = preferenceService.updatePreferences(userDetails.getId(), requestDto);
        
        log.info("Endpoint: PATCH /api/v1/notification-preferences, Execution Time: {}ms, User: {}",
                System.currentTimeMillis() - startTime, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(response));
    }

    // 8b. PATCH /api/v1/notifications/preferences (alias 2)
    @PatchMapping({"/api/v1/notifications/preferences", "/notifications/preferences"})
    @PreAuthorize("hasAnyRole('CLIENT', 'CRM', 'DESIGN_STUDIO', 'FINANCE', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<NotificationPreferenceDto>> updateNotificationsPreferences(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody NotificationPreferenceDto requestDto) {
        long startTime = System.currentTimeMillis();
        NotificationPreferenceDto response = preferenceService.updatePreferences(userDetails.getId(), requestDto);
        
        log.info("Endpoint: PATCH /api/v1/notifications/preferences, Execution Time: {}ms, User: {}",
                System.currentTimeMillis() - startTime, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}
