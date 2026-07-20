package com.goodearth.postsales.document.repository;

import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.entity.DocumentStatus;
import com.goodearth.postsales.document.entity.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByWorkflowId(UUID workflowId);
    List<Document> findByWorkflowIdAndStatus(UUID workflowId, DocumentStatus status);
    Optional<Document> findFirstByWorkflowIdAndDocumentTypeOrderByVersionDesc(UUID workflowId, DocumentType documentType);
    Optional<Document> findByWorkflowIdAndDocumentTypeAndStatus(UUID workflowId, DocumentType documentType, DocumentStatus status);
}
