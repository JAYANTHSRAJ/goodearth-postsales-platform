package com.goodearth.postsales.project.repository;

import com.goodearth.postsales.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Optional<Project> findByZohoDealId(String zohoDealId);
    boolean existsByZohoDealId(String zohoDealId);
    Optional<Project> findByProjectNameIgnoreCase(String projectName);
    java.util.List<Project> findByProjectCodeIgnoreCase(String projectCode);
}
