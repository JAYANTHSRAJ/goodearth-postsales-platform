package com.goodearth.postsales.client.repository;

import com.goodearth.postsales.client.entity.KycApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KycApplicationRepository extends JpaRepository<KycApplication, UUID> {
    Optional<KycApplication> findByBuyerId(UUID buyerId);
    Optional<KycApplication> findByWorkflowId(UUID workflowId);
    List<KycApplication> findByUserId(UUID userId);
    Optional<KycApplication> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);
}
