package com.goodearth.postsales.kyc.repository;

import com.goodearth.postsales.kyc.entity.KycAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KycAuditLogRepository extends JpaRepository<KycAuditLog, UUID> {
    List<KycAuditLog> findByKycApplicationIdOrderByCreatedAtDesc(UUID kycApplicationId);
}
