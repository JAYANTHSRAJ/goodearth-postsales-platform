package com.goodearth.postsales.auth.service;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
public class ActivationTokenServiceImpl implements ActivationTokenService {

    private static final Logger log = LoggerFactory.getLogger(ActivationTokenServiceImpl.class);

    private final UserRepository userRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public ActivationTokenServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public String generateToken(User user) {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        
        user.setActivationToken(token);
        user.setActivationTokenExpiry(LocalDateTime.now().plusHours(24));
        user.setAccountActivated(false);
        userRepository.save(user);
        
        return token;
    }

    @Override
    @Transactional(readOnly = true)
    public User validateToken(String token) {
        log.info("Entering validateToken. Token={}", token);
        
        log.info("Checking if token is null or empty");
        if (token == null || token.trim().isEmpty()) {
            log.info("Token validation failed: Token is null or empty");
            throw new CustomException("Token not found", HttpStatus.NOT_FOUND);
        }
        log.info("Token is not null/empty. Querying database for token={}", token);
        
        Optional<User> userOpt = userRepository.findByActivationToken(token);
        if (userOpt.isEmpty()) {
            log.info("Token validation failed: No user found in database with token={}", token);
            throw new CustomException("Token not found", HttpStatus.NOT_FOUND);
        }
        
        User user = userOpt.get();
        log.info("User found matching token: {}. Expiry: {}", user.getEmail(), user.getActivationTokenExpiry());
        
        log.info("Checking if token is expired");
        if (user.getActivationTokenExpiry() == null || user.getActivationTokenExpiry().isBefore(LocalDateTime.now())) {
            log.info("Token validation failed: Token is expired. Expiry: {}, CurrentTime: {}", user.getActivationTokenExpiry(), LocalDateTime.now());
            throw new CustomException("Token expired", HttpStatus.GONE);
        }
        log.info("Token check successful. Token is not expired.");
        
        log.info("Leaving validateToken. Returning user={}", user.getEmail());
        return user;
    }

    @Override
    @Transactional
    public void markActivated(User user) {
        user.setAccountActivated(true);
        user.setActivatedAt(LocalDateTime.now());
        clearToken(user);
    }

    @Override
    @Transactional
    public void clearToken(User user) {
        user.setActivationToken(null);
        user.setActivationTokenExpiry(null);
        userRepository.save(user);
    }
}
