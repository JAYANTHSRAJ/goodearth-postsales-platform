package com.goodearth.postsales.projectupdate.repository;

import com.goodearth.postsales.projectupdate.entity.ProjectUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectUpdateRepository extends JpaRepository<ProjectUpdate, UUID> {
    List<ProjectUpdate> findByWorkflowId(UUID workflowId);
    List<ProjectUpdate> findByWorkflowIdAndIsVisibleToClient(UUID workflowId, boolean isVisibleToClient);
    List<ProjectUpdate> findByWorkflowIdOrderByPublishedAtDesc(UUID workflowId);
    List<ProjectUpdate> findByWorkflowIdAndIsVisibleToClientOrderByPublishedAtDesc(UUID workflowId, boolean isVisibleToClient);
    List<ProjectUpdate> findByStageId(UUID stageId);
}
