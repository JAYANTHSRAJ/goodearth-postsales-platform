package com.goodearth.postsales.config;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.common.enumeration.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@org.springframework.core.annotation.Order(1)
public class AdminUserSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminUserSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("[ADMIN_SEEDER_LOG] AdminUserSeeder STARTED execution.");

        java.util.List<User> superAdmins = userRepository.findByRole(UserRole.SUPER_ADMIN);
        log.info("[ADMIN_SEEDER_LOG] Found {} existing SUPER_ADMIN users.", superAdmins.size());

        for (User admin : superAdmins) {
            admin.setAccountActivated(true);
            admin.setPortalActivated(true);
            admin.setEnabled(true);
            admin.setAccountLocked(false);
            admin.setFailedLoginAttempts(0);
            admin.setPassword(passwordEncoder.encode("AdminPassword123!"));
            userRepository.saveAndFlush(admin);
            log.info("[ADMIN_SEEDER_LOG] Updated SUPER_ADMIN user: {}", admin.getEmail());
        }

        User defaultAdmin = userRepository.findByEmailIgnoreCase("admin@goodearth.com").orElse(null);
        if (defaultAdmin == null) {
            log.info("[ADMIN_SEEDER_LOG] Creating default SUPER_ADMIN user admin@goodearth.com...");
            defaultAdmin = new User();
            defaultAdmin.setEmail("admin@goodearth.com");
            defaultAdmin.setPassword(passwordEncoder.encode("AdminPassword123!"));
            defaultAdmin.setFullName("System Administrator");
            defaultAdmin.setRole(UserRole.SUPER_ADMIN);
            defaultAdmin.setEnabled(true);
            defaultAdmin.setEmailVerified(true);
            defaultAdmin.setAccountActivated(true);
            defaultAdmin.setPortalActivated(true);
            defaultAdmin.setAccountLocked(false);
            defaultAdmin.setFailedLoginAttempts(0);
            userRepository.saveAndFlush(defaultAdmin);
            log.info("[ADMIN_SEEDER_LOG] Default SUPER_ADMIN admin@goodearth.com created successfully.");
        } else {
            defaultAdmin.setRole(UserRole.SUPER_ADMIN);
            defaultAdmin.setAccountActivated(true);
            defaultAdmin.setPortalActivated(true);
            defaultAdmin.setEnabled(true);
            defaultAdmin.setAccountLocked(false);
            defaultAdmin.setFailedLoginAttempts(0);
            defaultAdmin.setPassword(passwordEncoder.encode("AdminPassword123!"));
            userRepository.saveAndFlush(defaultAdmin);
            log.info("[ADMIN_SEEDER_LOG] Default SUPER_ADMIN admin@goodearth.com updated successfully with password AdminPassword123!.");
        }
        log.info("[ADMIN_SEEDER_LOG] AdminUserSeeder COMPLETED execution.");
    }
}
