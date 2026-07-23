package com.goodearth.postsales.kyc.repository;

import com.goodearth.postsales.kyc.entity.KycApplication;
import com.goodearth.postsales.kyc.entity.KycApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KycApplicationRepository extends JpaRepository<KycApplication, UUID> {
    Optional<KycApplication> findByBookingId(String bookingId);
    List<KycApplication> findByStatus(KycApplicationStatus status);
    Page<KycApplication> findByStatus(KycApplicationStatus status, Pageable pageable);
    long countByStatus(KycApplicationStatus status);
}
