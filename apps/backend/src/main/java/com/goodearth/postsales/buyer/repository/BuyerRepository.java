package com.goodearth.postsales.buyer.repository;

import com.goodearth.postsales.buyer.entity.Buyer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BuyerRepository extends JpaRepository<Buyer, UUID> {
    Optional<Buyer> findFirstByZohoContactIdOrderByIdDesc(String zohoContactId);
    Optional<Buyer> findByZohoContactId(String zohoContactId);
    boolean existsByZohoContactId(String zohoContactId);

    Optional<Buyer> findFirstByEmailIgnoreCaseOrderByIdDesc(String email);
    Optional<Buyer> findByEmailIgnoreCase(String email);
    List<Buyer> findAllByEmailIgnoreCase(String email);

    Optional<Buyer> findFirstByZohoDealId(String zohoDealId);
    Optional<Buyer> findByZohoDealId(String zohoDealId);
}
