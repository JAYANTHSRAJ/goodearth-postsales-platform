package com.goodearth.postsales.client.repository;

import com.goodearth.postsales.client.entity.KycModificationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KycModificationRequestRepository extends JpaRepository<KycModificationRequest, UUID> {
    List<KycModificationRequest> findByBuyerId(UUID buyerId);
    List<KycModificationRequest> findByUserId(UUID userId);
    Optional<KycModificationRequest> findFirstByBuyerIdAndStatusOrderByRequestedAtDesc(UUID buyerId, String status);
    List<KycModificationRequest> findByStatus(String status);
}
