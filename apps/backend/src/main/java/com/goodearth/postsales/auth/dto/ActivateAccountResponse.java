package com.goodearth.postsales.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ActivateAccountResponse {
    private boolean valid;
    private boolean expired;
    private String email;
    private String name;
}
