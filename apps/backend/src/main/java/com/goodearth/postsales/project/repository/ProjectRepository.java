package com.goodearth.postsales.project.repository;

import com.goodearth.postsales.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Optional<Project> findFirstByZohoDealId(String zohoDealId);
    Optional<Project> findByZohoDealId(String zohoDealId);
    boolean existsByZohoDealId(String zohoDealId);

    Optional<Project> findFirstByProjectNameIgnoreCaseOrderByIdDesc(String projectName);
    Optional<Project> findByProjectNameIgnoreCase(String projectName);

    List<Project> findByProjectCodeIgnoreCase(String projectCode);
}
