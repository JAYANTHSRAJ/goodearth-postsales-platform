package com.goodearth.postsales.auth.repository;

import com.goodearth.postsales.auth.entity.UserOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserOtpRepository extends JpaRepository<UserOtp, UUID> {
    Optional<UserOtp> findFirstByEmailIgnoreCaseAndPurposeAndUsedFalseOrderByCreatedAtDesc(String email, String purpose);
    List<UserOtp> findByEmailIgnoreCaseAndCreatedAtAfter(String email, LocalDateTime timestamp);
}
