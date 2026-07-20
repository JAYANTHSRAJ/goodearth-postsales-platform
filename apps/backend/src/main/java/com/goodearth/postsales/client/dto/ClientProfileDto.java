package com.goodearth.postsales.client.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ClientProfileDto {
    private String fullName;
    private String email;
    private String phone;
    private String panNumber;
    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private int completionPercent;
    private String onboardingStage;
}
