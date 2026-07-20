package com.goodearth.postsales.auth.entity;

import com.goodearth.postsales.audit.BaseEntity;
import com.goodearth.postsales.common.enumeration.UserRole;
import com.goodearth.postsales.common.enumeration.OnboardingStage;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User extends BaseEntity {

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 50)
    private UserRole role;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "password_changed_at")
    private Instant passwordChangedAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "account_locked", nullable = false)
    private boolean accountLocked = false;

    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts = 0;

    @Column(name = "password_change_required", nullable = false)
    private boolean passwordChangeRequired = false;

    @Column(name = "portal_activated", nullable = false)
    private boolean portalActivated = false;

    @Column(name = "account_activated", nullable = false)
    private boolean accountActivated = false;

    @Column(name = "first_login_completed", nullable = false)
    private boolean firstLoginCompleted = false;

    @Column(name = "last_password_change")
    private LocalDateTime lastPasswordChange;

    @Column(name = "activation_token")
    private String activationToken;

    @Column(name = "activation_token_expiry")
    private LocalDateTime activationTokenExpiry;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "onboarding_stage", nullable = false, length = 50)
    private OnboardingStage onboardingStage = OnboardingStage.COMPLETED;
}
