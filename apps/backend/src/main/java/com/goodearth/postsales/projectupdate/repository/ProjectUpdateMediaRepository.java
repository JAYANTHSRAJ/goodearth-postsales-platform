package com.goodearth.postsales.projectupdate.repository;

import com.goodearth.postsales.projectupdate.entity.ProjectUpdateMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectUpdateMediaRepository extends JpaRepository<ProjectUpdateMedia, UUID> {
    List<ProjectUpdateMedia> findByProjectUpdateId(UUID projectUpdateId);
}
