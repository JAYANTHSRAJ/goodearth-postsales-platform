package com.goodearth.postsales.config;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class TemporaryPasswordResetSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(TemporaryPasswordResetSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public TemporaryPasswordResetSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("Running temporary password reset utility...");
        resetAndActivate("admin@goodearth.com");
        resetAndActivate("team@goodearth.org.in");
    }

    private void resetAndActivate(String email) {
        userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            user.setPassword(passwordEncoder.encode("GoodEarth@123"));
            user.setAccountActivated(true);
            user.setEnabled(true);
            user.setEmailVerified(true);
            user.setAccountLocked(false);
            userRepository.save(user);
            log.info("Password reset completed.");
            System.out.println("Password reset completed.");
        });
    }
}
