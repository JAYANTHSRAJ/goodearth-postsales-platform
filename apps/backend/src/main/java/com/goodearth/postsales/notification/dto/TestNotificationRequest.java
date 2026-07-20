package com.goodearth.postsales.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TestNotificationRequest {
    private String email;
    private String phone;
    private String title;
    private String message;
    private String channel; // EMAIL, SMS, WHATSAPP, IN_APP, PUSH
}
