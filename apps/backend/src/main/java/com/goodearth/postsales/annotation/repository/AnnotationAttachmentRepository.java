package com.goodearth.postsales.annotation.repository;

import com.goodearth.postsales.annotation.entity.AnnotationAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnotationAttachmentRepository extends JpaRepository<AnnotationAttachment, UUID> {
    List<AnnotationAttachment> findByAnnotationId(UUID annotationId);
}
