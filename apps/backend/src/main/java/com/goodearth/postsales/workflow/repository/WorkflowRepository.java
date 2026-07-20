package com.goodearth.postsales.workflow.repository;

import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.entity.WorkflowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, UUID> {
    boolean existsByBuyerIdAndProjectId(UUID buyerId, UUID projectId);
    boolean existsByBuyerIdAndProjectIdAndStatus(UUID buyerId, UUID projectId, WorkflowStatus status);
    Optional<Workflow> findFirstByBuyerIdAndStatus(UUID buyerId, WorkflowStatus status);
    Optional<Workflow> findFirstByBuyerId(UUID buyerId);
    java.util.List<Workflow> findByBuyerId(UUID buyerId);
    long countByProjectId(UUID projectId);
    long countByProjectIdAndStatus(UUID projectId, WorkflowStatus status);
    long countByStatus(com.goodearth.postsales.workflow.entity.WorkflowStatus status);
}
