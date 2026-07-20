package com.goodearth.postsales.client.service;

import com.goodearth.postsales.client.dto.ClientProfileDto;

public interface ClientProfileService {
    ClientProfileDto getProfile(String email);
    ClientProfileDto updateProfile(String email, ClientProfileDto dto);
}
