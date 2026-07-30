package com.goodearth.postsales.offerletter.repository;

import com.goodearth.postsales.offerletter.entity.OfferLetterAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OfferLetterAuditRepository extends JpaRepository<OfferLetterAudit, UUID> {
    Optional<OfferLetterAudit> findByBookingId(String bookingId);
    Optional<OfferLetterAudit> findByBookingIdOrDealRecordId(String bookingId, String dealRecordId);
}
