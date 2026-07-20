package com.goodearth.postsales.security.user;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service implementation providing database-backed user principal resolution
 * lookup for Spring Security verification.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("[AUTH_LOG] CustomUserDetailsService: Username received = " + username);
        java.util.Optional<User> userOpt = userRepository.findByEmailIgnoreCase(username);
        System.out.println("[AUTH_LOG] CustomUserDetailsService: User found? = " + userOpt.isPresent());
        
        User user = userOpt.orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
        System.out.println("[AUTH_LOG] CustomUserDetailsService: Roles returned = " + "ROLE_" + user.getRole().name());

        return new CustomUserDetails(
                user.getId(),
                user.getEmail(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
