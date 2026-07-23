package com.goodearth.postsales.document.repository;

import com.goodearth.postsales.document.entity.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, UUID> {
    List<DocumentVersion> findByDocumentIdOrderByVersionNumberDesc(UUID documentId);
    Optional<DocumentVersion> findByDocumentIdAndIsCurrentTrue(UUID documentId);
    Optional<DocumentVersion> findByDocumentIdAndVersionNumber(UUID documentId, Integer versionNumber);
}
