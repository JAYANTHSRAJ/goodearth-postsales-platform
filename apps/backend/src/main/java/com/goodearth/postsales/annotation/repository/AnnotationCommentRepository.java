package com.goodearth.postsales.annotation.repository;

import com.goodearth.postsales.annotation.entity.AnnotationComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnotationCommentRepository extends JpaRepository<AnnotationComment, UUID> {
    List<AnnotationComment> findByAnnotationIdOrderByCreatedAtAsc(UUID annotationId);
}
