package com.goodearth.postsales.workdrive.repository;

import com.goodearth.postsales.workdrive.entity.WorkDriveFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkDriveFolderRepository extends JpaRepository<WorkDriveFolder, UUID> {
    Optional<WorkDriveFolder> findByWorkflowId(UUID workflowId);
    Optional<WorkDriveFolder> findByFolderId(String folderId);
}
