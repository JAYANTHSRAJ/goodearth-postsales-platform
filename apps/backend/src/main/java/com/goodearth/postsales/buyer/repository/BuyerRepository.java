package com.goodearth.postsales.buyer.repository;

import com.goodearth.postsales.buyer.entity.Buyer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BuyerRepository extends JpaRepository<Buyer, UUID> {
    Optional<Buyer> findByZohoContactId(String zohoContactId);
    boolean existsByZohoContactId(String zohoContactId);
    Optional<Buyer> findByEmailIgnoreCase(String email);
    Optional<Buyer> findByZohoDealId(String zohoDealId);
}
