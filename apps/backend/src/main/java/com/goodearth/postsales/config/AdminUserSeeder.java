package com.goodearth.postsales.config;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.common.enumeration.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminUserSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminUserSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        User admin = userRepository.findByEmailIgnoreCase("admin@goodearth.com").orElse(null);

        if (admin == null) {
            log.info("Creating default SUPER_ADMIN user...");
            admin = new User();
            admin.setEmail("admin@goodearth.com");
            admin.setPassword(passwordEncoder.encode("AdminPassword123!"));
            admin.setFullName("System Administrator");
            admin.setRole(UserRole.SUPER_ADMIN);
            admin.setEnabled(true);
            admin.setEmailVerified(true);
            admin.setAccountActivated(true);
            admin.setPortalActivated(true);
            admin.setAccountLocked(false);
            admin.setFailedLoginAttempts(0);

            userRepository.save(admin);
            log.info("Default SUPER_ADMIN created successfully. Email: admin@goodearth.com");
        } else {
            admin.setAccountActivated(true);
            admin.setPortalActivated(true);
            admin.setEnabled(true);
            admin.setAccountLocked(false);
            admin.setFailedLoginAttempts(0);
            admin.setPassword(passwordEncoder.encode("AdminPassword123!"));
            userRepository.save(admin);
            log.info("SUPER_ADMIN admin@goodearth.com updated and activated successfully.");
        }
    }
}
