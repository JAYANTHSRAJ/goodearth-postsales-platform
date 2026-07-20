package com.goodearth.postsales.workdrive.repository;

import com.goodearth.postsales.workdrive.entity.WorkDriveFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkDriveFileRepository extends JpaRepository<WorkDriveFile, UUID> {
    Optional<WorkDriveFile> findByFileId(String fileId);
    List<WorkDriveFile> findByFolderId(UUID folderId);
}
