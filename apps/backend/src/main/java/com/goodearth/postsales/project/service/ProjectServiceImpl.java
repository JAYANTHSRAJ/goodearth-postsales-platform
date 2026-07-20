package com.goodearth.postsales.project.service;

import com.goodearth.postsales.project.dto.ProjectDto;
import com.goodearth.postsales.project.entity.Project;
import com.goodearth.postsales.project.repository.ProjectRepository;
import com.goodearth.postsales.workflow.entity.WorkflowStatus;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final WorkflowRepository workflowRepository;

    public ProjectServiceImpl(
            ProjectRepository projectRepository,
            WorkflowRepository workflowRepository) {
        this.projectRepository = projectRepository;
        this.workflowRepository = workflowRepository;
    }

    @Override
    public List<ProjectDto> getAllProjects() {
        List<Project> projects = projectRepository.findAll();
        List<ProjectDto> dtos = new ArrayList<>();
        for (Project project : projects) {
            dtos.add(mapToDto(project));
        }
        return dtos;
    }

    @Override
    public ProjectDto getProjectById(java.util.UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new com.goodearth.postsales.common.exception.CustomException("Project not found", org.springframework.http.HttpStatus.NOT_FOUND));
        return mapToDto(project);
    }

    @Override
    @Transactional
    public ProjectDto createProject(ProjectDto dto) {
        Project project = new Project();
        project.setProjectName(dto.getName());
        project.setProjectCode(dto.getCode());
        project.setLocation(dto.getLocation());
        project.setStatus(dto.getStatus() != null ? dto.getStatus().toUpperCase() : "PLANNING");
        project.setZohoDealId("local_" + java.util.UUID.randomUUID().toString().substring(0, 8));
        Project saved = projectRepository.save(project);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public ProjectDto updateProject(java.util.UUID id, ProjectDto dto) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new com.goodearth.postsales.common.exception.CustomException("Project not found", org.springframework.http.HttpStatus.NOT_FOUND));
        project.setProjectName(dto.getName());
        project.setProjectCode(dto.getCode());
        project.setLocation(dto.getLocation());
        if (dto.getStatus() != null) {
            project.setStatus(dto.getStatus().toUpperCase());
        }
        Project saved = projectRepository.save(project);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public void deleteProject(java.util.UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new com.goodearth.postsales.common.exception.CustomException("Project not found", org.springframework.http.HttpStatus.NOT_FOUND));
        projectRepository.delete(project);
    }

    private ProjectDto mapToDto(Project project) {
        ProjectDto dto = new ProjectDto();
        dto.setId(project.getId());
        dto.setName(project.getProjectName());
        dto.setCode(project.getProjectCode());
        dto.setLocation(project.getLocation());
        
        long totalUnits = workflowRepository.countByProjectId(project.getId());
        long activeWorkflows = workflowRepository.countByProjectIdAndStatus(project.getId(), com.goodearth.postsales.workflow.entity.WorkflowStatus.ACTIVE);
        
        dto.setTotalUnits((int) totalUnits);
        dto.setActiveWorkflows((int) activeWorkflows);
        dto.setStatus(project.getStatus() != null ? project.getStatus().toLowerCase() : "planning");
        dto.setCommencementDate(project.getCreatedAt() != null ? project.getCreatedAt().toLocalDate().toString() : "");
        return dto;
    }
}
