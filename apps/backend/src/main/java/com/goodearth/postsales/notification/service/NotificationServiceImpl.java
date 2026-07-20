package com.goodearth.postsales.notification.service;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.common.enumeration.UserRole;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.notification.dto.NotificationDto;
import com.goodearth.postsales.notification.entity.*;
import com.goodearth.postsales.notification.mapper.NotificationMapper;
import com.goodearth.postsales.notification.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final NotificationRepository notificationRepository;
    private final NotificationTemplateRepository templateRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final NotificationDeliveryLogRepository deliveryLogRepository;
    private final UserNotificationStateRepository stateRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final WhatsAppService whatsAppService;
    private final SmsService smsService;
    private final NotificationMapper mapper;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            NotificationTemplateRepository templateRepository,
            NotificationPreferenceRepository preferenceRepository,
            NotificationDeliveryLogRepository deliveryLogRepository,
            UserNotificationStateRepository stateRepository,
            UserRepository userRepository,
            EmailService emailService,
            WhatsAppService whatsAppService,
            SmsService smsService,
            NotificationMapper mapper) {
        this.notificationRepository = notificationRepository;
        this.templateRepository = templateRepository;
        this.preferenceRepository = preferenceRepository;
        this.deliveryLogRepository = deliveryLogRepository;
        this.stateRepository = stateRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.whatsAppService = whatsAppService;
        this.smsService = smsService;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDto> getNotifications(UUID userId, String role, String type, String category, String priority, Boolean isRead, Pageable pageable) {
        List<Notification> activeNotifications = notificationRepository.findActiveNotificationsForUser(userId, role, LocalDateTime.now());

        List<NotificationDto> dtoList = activeNotifications.stream()
                .map(n -> {
                    UserNotificationState state = stateRepository.findByUserIdAndNotificationId(userId, n.getId()).orElse(null);
                    boolean read = state != null && state.isRead();
                    LocalDateTime readAt = state != null ? state.getReadAt() : null;
                    return mapper.toDto(n, read, readAt);
                })
                .filter(dto -> type == null || dto.getNotificationType().equalsIgnoreCase(type))
                .filter(dto -> category == null || dto.getNotificationCategory().equalsIgnoreCase(category))
                .filter(dto -> priority == null || dto.getPriority().equalsIgnoreCase(priority))
                .filter(dto -> isRead == null || dto.isRead() == isRead)
                .sorted(Comparator.comparing(NotificationDto::getCreatedAt).reversed())
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), dtoList.size());
        List<NotificationDto> subList = (start >= dtoList.size()) ? Collections.emptyList() : dtoList.subList(start, end);

        return new PageImpl<>(subList, pageable, dtoList.size());
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId, String role) {
        return notificationRepository.countUnreadNotificationsForUser(userId, role, LocalDateTime.now());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getLatestNotifications(UUID userId, String role, int limit) {
        Page<NotificationDto> page = getNotifications(userId, role, null, null, null, null, PageRequest.of(0, limit));
        return page.getContent();
    }

    @Override
    @Transactional
    public void markAsRead(UUID userId, UUID notificationId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new CustomException("Notification not found", HttpStatus.NOT_FOUND));

        UserNotificationState state = stateRepository.findByUserIdAndNotificationId(userId, notificationId)
                .orElseGet(() -> {
                    UserNotificationState newState = new UserNotificationState();
                    newState.setUser(user);
                    newState.setNotification(notification);
                    return newState;
                });

        state.setRead(true);
        state.setReadAt(LocalDateTime.now());
        stateRepository.save(state);
    }

    @Override
    @Transactional
    public void markAllAsRead(UUID userId, String role) {
        List<Notification> activeNotifications = notificationRepository.findActiveNotificationsForUser(userId, role, LocalDateTime.now());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        for (Notification n : activeNotifications) {
            UserNotificationState state = stateRepository.findByUserIdAndNotificationId(userId, n.getId()).orElse(null);
            if (state == null) {
                state = new UserNotificationState();
                state.setUser(user);
                state.setNotification(n);
                state.setRead(true);
                state.setReadAt(LocalDateTime.now());
                stateRepository.save(state);
            } else if (!state.isRead()) {
                state.setRead(true);
                state.setReadAt(LocalDateTime.now());
                stateRepository.save(state);
            }
        }
    }

    @Override
    @Transactional
    public void softDelete(UUID userId, UUID notificationId, String actorEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new CustomException("Notification not found", HttpStatus.NOT_FOUND));

        UserNotificationState state = stateRepository.findByUserIdAndNotificationId(userId, notificationId)
                .orElseGet(() -> {
                    UserNotificationState newState = new UserNotificationState();
                    newState.setUser(user);
                    newState.setNotification(notification);
                    return newState;
                });

        state.setDeletedAt(LocalDateTime.now());
        state.setDeletedBy(actorEmail);
        stateRepository.save(state);
    }

    @Override
    @Transactional
    public void createAndSendNotification(Notification notification) {
        // Save the notification base first (for In-App channel display)
        Notification saved = notificationRepository.save(notification);

        // Resolve target users based on targeting attributes
        List<User> recipients = new ArrayList<>();
        if (saved.isBroadcast()) {
            recipients = userRepository.findAll();
        } else if (saved.getTargetRole() != null) {
            String roleName = saved.getTargetRole();
            recipients = userRepository.findAll().stream()
                    .filter(u -> u.getRole() != null && u.getRole().name().equalsIgnoreCase(roleName))
                    .collect(Collectors.toList());
        } else if (saved.getUser() != null) {
            recipients.add(saved.getUser());
        }

        // Deliver to each resolved recipient depending on preferences and channels
        for (User recipient : recipients) {
            NotificationPreference pref = preferenceRepository.findByUserId(recipient.getId())
                    .orElseGet(() -> {
                        NotificationPreference newPref = new NotificationPreference();
                        newPref.setUser(recipient);
                        return preferenceRepository.save(newPref);
                    });

            // 1. Outbound: Email
            if (pref.isEmailEnabled() && recipient.getEmail() != null) {
                sendOutboundChannel(saved, NotificationChannel.EMAIL, recipient.getEmail());
            }

            // 2. Outbound: WhatsApp
            if (pref.isWhatsappEnabled()) {
                // Assuming we use phone number as target
                sendOutboundChannel(saved, NotificationChannel.WHATSAPP, recipient.getEmail()); 
            }

            // 3. Outbound: SMS
            if (pref.isSmsEnabled()) {
                sendOutboundChannel(saved, NotificationChannel.SMS, recipient.getEmail());
            }

            // 4. In-App and Push readiness
            if (pref.isPushEnabled()) {
                sendOutboundChannel(saved, NotificationChannel.PUSH, recipient.getEmail());
            }
        }
    }

    private void sendOutboundChannel(Notification notification, NotificationChannel channel, String destination) {
        NotificationDeliveryLog logEntry = new NotificationDeliveryLog();
        logEntry.setNotification(notification);
        logEntry.setChannel(channel);
        logEntry.setAttempt(1);
        logEntry.setSentAt(LocalDateTime.now());

        try {
            switch (channel) {
                case EMAIL:
                    emailService.sendEmail(destination, notification.getTitle(), notification.getMessage());
                    break;
                case WHATSAPP:
                    whatsAppService.sendWhatsAppMessage(destination, notification.getMessage());
                    break;
                case SMS:
                    smsService.sendSmsMessage(destination, notification.getMessage());
                    break;
                case PUSH:
                    log.info("[PUSH NOTIFICATION] Readied push to: {} | Title: {}", destination, notification.getTitle());
                    break;
                default:
                    break;
            }
            logEntry.setStatus(DeliveryStatus.SENT);
            logEntry.setProviderResponse("Success response from simulated mock provider.");
        } catch (Exception e) {
            log.error("Failed to send notification via channel: {}", channel, e);
            logEntry.setStatus(DeliveryStatus.FAILED);
            logEntry.setFailureReason(e.getMessage());
        }

        deliveryLogRepository.save(logEntry);
    }
}
