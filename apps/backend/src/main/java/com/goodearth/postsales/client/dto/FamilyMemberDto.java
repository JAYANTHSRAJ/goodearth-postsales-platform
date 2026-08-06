package com.goodearth.postsales.client.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FamilyMemberDto {
    private UUID id;
    private String name;
    private String relation;
    private String email;
    private String phone;
    private String role;
    private String status;
    private String invitationStatus;
    private LocalDateTime createdDate;
    private LocalDateTime lastLogin;
    private String notes;
    private List<String> permissions;
}
