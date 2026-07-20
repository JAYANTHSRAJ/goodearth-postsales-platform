package com.goodearth.postsales.auth.dto;

import com.goodearth.postsales.common.enumeration.UserRole;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDto {
    private UUID id;
    private String email;
    private String fullName;
    private UserRole role;
    private boolean passwordChangeRequired;
    private boolean accountActivated;
    private boolean firstLoginCompleted;
    private String onboardingStage;
}
