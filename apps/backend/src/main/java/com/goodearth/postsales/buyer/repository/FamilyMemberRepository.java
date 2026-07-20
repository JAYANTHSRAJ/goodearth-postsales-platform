package com.goodearth.postsales.buyer.repository;

import com.goodearth.postsales.buyer.entity.FamilyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FamilyMemberRepository extends JpaRepository<FamilyMember, UUID> {
    List<FamilyMember> findByBuyerId(UUID buyerId);
    long countByBuyerId(UUID buyerId);
}
