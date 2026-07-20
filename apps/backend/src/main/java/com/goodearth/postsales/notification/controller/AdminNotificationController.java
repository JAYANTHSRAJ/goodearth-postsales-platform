package com.goodearth.postsales.notification.controller;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.common.response.ApiResponse;
import com.goodearth.postsales.notification.dto.TestNotificationRequest;
import com.goodearth.postsales.notification.entity.*;
import com.goodearth.postsales.notification.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/notifications")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminNotificationController {

    private static final Logger log = LoggerFactory.getLogger(AdminNotificationController.class);

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public AdminNotificationController(
            NotificationService notificationService,
            UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @PostMapping("/send-test")
    public ResponseEntity<ApiResponse<String>> sendTestNotification(@RequestBody TestNotificationRequest request) {
        long startTime = System.currentTimeMillis();
        
        User user = null;
        if (request.getEmail() != null) {
            user = userRepository.findByEmailIgnoreCase(request.getEmail()).orElse(null);
        }

        Notification notif = new Notification();
        notif.setUser(user);
        notif.setTitle(request.getTitle() != null ? request.getTitle() : "Test Diagnostic Notice");
        notif.setMessage(request.getMessage() != null ? request.getMessage() : "This is a verification alert sent by Super Admin.");
        notif.setNotificationType(NotificationType.SYSTEM);
        notif.setNotificationCategory(NotificationCategory.INFORMATION);
        notif.setPriority(NotificationPriority.HIGH);
        notif.setIcon("warning");

        if (user == null && request.getEmail() != null) {
            log.warn("Target user not found in database for email: {}. Processing direct mock send.", request.getEmail());
        }

        notificationService.createAndSendNotification(notif);

        log.info("Endpoint: POST /api/v1/admin/notifications/send-test, Execution Time: {}ms",
                System.currentTimeMillis() - startTime);
        return ResponseEntity.ok(new ApiResponse<>("Test notification processed successfully."));
    }
}
