package com.goodearth.postsales.auth.repository;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.common.enumeration.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    Optional<User> findByActivationToken(String activationToken);

    boolean existsByRole(UserRole role);

    java.util.List<User> findByRole(UserRole role);
}
