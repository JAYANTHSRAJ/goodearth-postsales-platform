package com.goodearth.postsales.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FamilyMemberNotificationDto {
    private UUID memberId;
    private String memberName;
    private String relation;
    private String email;
    private String phone;
    private boolean notifyEnabled;
}
