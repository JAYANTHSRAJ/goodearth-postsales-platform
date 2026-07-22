package com.goodearth.postsales.annotation.repository;

import com.goodearth.postsales.annotation.entity.Annotation;
import com.goodearth.postsales.annotation.entity.AnnotationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnotationRepository extends JpaRepository<Annotation, UUID> {
    java.util.Optional<Annotation> findByWorkflowIdAndWorkdriveFileIdAndTitle(UUID workflowId, String workdriveFileId, String title);
    List<Annotation> findByDocumentId(UUID documentId);
    List<Annotation> findByWorkflowId(UUID workflowId);
    List<Annotation> findByDocumentIdAndStatus(UUID documentId, AnnotationStatus status);
    List<Annotation> findByWorkflowIdAndStatus(UUID workflowId, AnnotationStatus status);
}
