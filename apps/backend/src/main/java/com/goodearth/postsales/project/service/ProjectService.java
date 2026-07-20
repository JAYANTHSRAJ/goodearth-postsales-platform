package com.goodearth.postsales.project.service;

import com.goodearth.postsales.project.dto.ProjectDto;
import java.util.List;

public interface ProjectService {
    List<ProjectDto> getAllProjects();
    ProjectDto getProjectById(java.util.UUID id);
    ProjectDto createProject(ProjectDto dto);
    ProjectDto updateProject(java.util.UUID id, ProjectDto dto);
    void deleteProject(java.util.UUID id);
}
