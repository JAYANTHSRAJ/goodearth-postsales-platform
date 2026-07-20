package com.goodearth.postsales.auth.service;

import com.goodearth.postsales.auth.entity.User;

public interface ActivationTokenService {
    String generateToken(User user);
    User validateToken(String token);
    void markActivated(User user);
    void clearToken(User user);
}
