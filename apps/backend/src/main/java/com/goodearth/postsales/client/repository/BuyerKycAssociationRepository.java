package com.goodearth.postsales.client.repository;

import com.goodearth.postsales.client.entity.BuyerKycAssociation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BuyerKycAssociationRepository extends JpaRepository<BuyerKycAssociation, UUID> {
    Optional<BuyerKycAssociation> findFirstByBuyerIdAndStatusOrderByAssociatedAtDesc(UUID buyerId, String status);
    List<BuyerKycAssociation> findByBuyerIdOrderByVersionDesc(UUID buyerId);
    List<BuyerKycAssociation> findByKycApplicationId(UUID kycApplicationId);
}
