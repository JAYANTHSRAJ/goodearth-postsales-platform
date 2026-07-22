package com.goodearth.postsales.workdrive.repository;

import com.goodearth.postsales.workdrive.entity.WorkDriveFileVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkDriveFileVersionRepository extends JpaRepository<WorkDriveFileVersion, UUID> {
    List<WorkDriveFileVersion> findByWorkDriveFileIdOrderByVersionAsc(UUID workDriveFileId);
    Optional<WorkDriveFileVersion> findFirstByWorkDriveFileIdOrderByVersionDesc(UUID workDriveFileId);
    Optional<WorkDriveFileVersion> findByWorkDriveFileIdAndVersion(UUID workDriveFileId, Integer version);
}
