package com.goodearth.postsales.sign.repository;

import com.goodearth.postsales.sign.entity.ZohoSignRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ZohoSignRequestRepository extends JpaRepository<ZohoSignRequest, UUID> {
    Optional<ZohoSignRequest> findByRequestId(String requestId);
    List<ZohoSignRequest> findByWorkflowId(UUID workflowId);
    List<ZohoSignRequest> findByDocumentId(UUID documentId);
    Optional<ZohoSignRequest> findTopByWorkflowIdOrderByCreatedAtDesc(UUID workflowId);
    Optional<ZohoSignRequest> findTopByOrderByCreatedAtDesc();
}
