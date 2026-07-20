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
        boolean superAdminExists = userRepository.existsByRole(UserRole.SUPER_ADMIN);

        if (!superAdminExists) {
            log.info("No SUPER_ADMIN user found in database. Initializing default admin user...");
            User admin = new User();
            admin.setEmail("admin@goodearth.com");
            admin.setPassword(passwordEncoder.encode("AdminPassword123!"));
            admin.setFullName("System Administrator");
            admin.setRole(UserRole.SUPER_ADMIN);
            admin.setEnabled(true);
            admin.setEmailVerified(true);
            admin.setAccountLocked(false);
            admin.setFailedLoginAttempts(0);
            
            userRepository.save(admin);
            log.info("Default SUPER_ADMIN created successfully. Email: admin@goodearth.com");
        } else {
            log.info("SUPER_ADMIN already exists in database. Skipping seeder.");
        }
    }
}
