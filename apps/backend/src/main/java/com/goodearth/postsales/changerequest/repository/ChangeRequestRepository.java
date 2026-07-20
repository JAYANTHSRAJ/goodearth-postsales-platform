package com.goodearth.postsales.changerequest.repository;

import com.goodearth.postsales.changerequest.entity.ChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChangeRequestRepository extends JpaRepository<ChangeRequest, UUID> {
    List<ChangeRequest> findByWorkflowId(UUID workflowId);
}
