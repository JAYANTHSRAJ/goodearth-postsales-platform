package com.goodearth.postsales.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordValidateResponseDto {
    private boolean valid;
    private String email;
    private String fullName;
    private String message;
}
