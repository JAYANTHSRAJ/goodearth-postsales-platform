package com.goodearth.postsales.client.repository;

import com.goodearth.postsales.client.entity.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, UUID> {
    List<DocumentVersion> findByKycApplicationId(UUID kycApplicationId);
    List<DocumentVersion> findByKycApplicationIdAndApplicantTypeAndDocumentTypeOrderByVersionDesc(
            UUID kycApplicationId, String applicantType, String documentType);
}
