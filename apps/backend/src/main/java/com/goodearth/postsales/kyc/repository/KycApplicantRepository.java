package com.goodearth.postsales.kyc.repository;

import com.goodearth.postsales.kyc.entity.ApplicantType;
import com.goodearth.postsales.kyc.entity.KycApplicant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KycApplicantRepository extends JpaRepository<KycApplicant, UUID> {
    List<KycApplicant> findByKycApplicationId(UUID kycApplicationId);
    Optional<KycApplicant> findByKycApplicationIdAndApplicantType(UUID kycApplicationId, ApplicantType applicantType);
}
