package com.goodearth.postsales.projectupdate.service;

import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.projectupdate.dto.ProjectProgressDto;
import com.goodearth.postsales.projectupdate.dto.ProjectUpdateDto;
import com.goodearth.postsales.projectupdate.dto.ProjectUpdateMediaDto;
import com.goodearth.postsales.projectupdate.dto.ProjectUpdateSummaryDto;
import com.goodearth.postsales.projectupdate.entity.*;
import com.goodearth.postsales.projectupdate.event.ProjectUpdateEvents;
import com.goodearth.postsales.projectupdate.mapper.ProjectUpdateMapper;
import com.goodearth.postsales.projectupdate.mapper.ProjectUpdateMediaMapper;
import com.goodearth.postsales.projectupdate.repository.ProjectUpdateMediaRepository;
import com.goodearth.postsales.projectupdate.repository.ProjectUpdateRepository;
import com.goodearth.postsales.stage.entity.Stage;
import com.goodearth.postsales.stage.repository.StageRepository;
import com.goodearth.postsales.workdrive.dto.WorkDriveFileVersionDto;
import com.goodearth.postsales.workdrive.entity.WorkDriveFile;
import com.goodearth.postsales.workdrive.repository.WorkDriveFileRepository;
import com.goodearth.postsales.workdrive.service.WorkDriveVersionService;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProjectUpdateServiceImpl implements ProjectUpdateService {

    private final ProjectUpdateRepository repository;
    private final ProjectUpdateMediaRepository mediaRepository;
    private final WorkflowRepository workflowRepository;
    private final StageRepository stageRepository;
    private final WorkDriveFileRepository workDriveFileRepository;
    private final WorkDriveVersionService workDriveVersionService;
    private final ProjectUpdateMapper mapper;
    private final ProjectUpdateMediaMapper mediaMapper;
    private final ApplicationEventPublisher eventPublisher;

    public ProjectUpdateServiceImpl(
            ProjectUpdateRepository repository,
            ProjectUpdateMediaRepository mediaRepository,
            WorkflowRepository workflowRepository,
            StageRepository stageRepository,
            WorkDriveFileRepository workDriveFileRepository,
            WorkDriveVersionService workDriveVersionService,
            ProjectUpdateMapper mapper,
            ProjectUpdateMediaMapper mediaMapper,
            ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.mediaRepository = mediaRepository;
        this.workflowRepository = workflowRepository;
        this.stageRepository = stageRepository;
        this.workDriveFileRepository = workDriveFileRepository;
        this.workDriveVersionService = workDriveVersionService;
        this.mapper = mapper;
        this.mediaMapper = mediaMapper;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public ProjectUpdateDto createUpdate(UUID workflowId, UUID stageId, String title, String description, String updateType, BigDecimal progressPercentage, String location) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new CustomException("Workflow not found", HttpStatus.NOT_FOUND));
        Stage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new CustomException("Stage not found", HttpStatus.NOT_FOUND));

        ProjectUpdate update = new ProjectUpdate();
        update.setWorkflow(workflow);
        update.setStage(stage);
        update.setTitle(title);
        update.setDescription(description);
        update.setUpdateType(UpdateType.valueOf(updateType.toUpperCase()));
        update.setProgressPercentage(progressPercentage);
        update.setLocation(location);

        ProjectUpdate saved = repository.save(update);
        ProjectUpdateDto dto = mapper.toDto(saved);

        // Fire event
        eventPublisher.publishEvent(new ProjectUpdateEvents.ProjectUpdateCreatedEvent(
                saved.getId(), saved.getTitle(), workflowId
        ));

        return dto;
    }

    @Override
    @Transactional
    public ProjectUpdateDto editUpdate(UUID id, String title, String description, String updateType, BigDecimal progressPercentage, String location) {
        ProjectUpdate update = repository.findById(id)
                .orElseThrow(() -> new CustomException("Project update not found", HttpStatus.NOT_FOUND));

        update.setTitle(title);
        update.setDescription(description);
        update.setUpdateType(UpdateType.valueOf(updateType.toUpperCase()));
        update.setProgressPercentage(progressPercentage);
        update.setLocation(location);

        ProjectUpdate saved = repository.save(update);
        return mapper.toDto(saved);
    }

    @Override
    @Transactional
    public void deleteUpdate(UUID id) {
        ProjectUpdate update = repository.findById(id)
                .orElseThrow(() -> new CustomException("Project update not found", HttpStatus.NOT_FOUND));
        repository.delete(update);
    }

    @Override
    @Transactional
    public ProjectUpdateDto publishUpdate(UUID id, String publishedBy) {
        ProjectUpdate update = repository.findById(id)
                .orElseThrow(() -> new CustomException("Project update not found", HttpStatus.NOT_FOUND));

        update.setVisibleToClient(true);
        update.setPublishedAt(LocalDateTime.now());
        update.setPublishedBy(publishedBy);

        ProjectUpdate saved = repository.save(update);
        ProjectUpdateDto dto = mapper.toDto(saved);

        // Fire event
        eventPublisher.publishEvent(new ProjectUpdateEvents.ProjectUpdatePublishedEvent(
                saved.getId(), saved.getTitle(), saved.getDescription(),
                saved.getWorkflow().getId(), saved.getStage().getId(),
                true, saved.getProgressPercentage(), publishedBy, saved.getPublishedAt()
        ));

        return dto;
    }

    @Override
    @Transactional
    public ProjectUpdateDto hideUpdate(UUID id) {
        ProjectUpdate update = repository.findById(id)
                .orElseThrow(() -> new CustomException("Project update not found", HttpStatus.NOT_FOUND));

        update.setVisibleToClient(false);
        ProjectUpdate saved = repository.save(update);
        ProjectUpdateDto dto = mapper.toDto(saved);

        // Fire event
        eventPublisher.publishEvent(new ProjectUpdateEvents.ProjectUpdateHiddenEvent(
                saved.getId(), saved.getWorkflow().getId()
        ));

        return dto;
    }

    @Override
    @Transactional
    public ProjectUpdateMediaDto uploadMediaMetadata(UUID updateId, String workdriveFileId, String mediaType, String uploadedBy) {
        ProjectUpdate update = repository.findById(updateId)
                .orElseThrow(() -> new CustomException("Project update not found", HttpStatus.NOT_FOUND));

        ProjectUpdateMedia media = new ProjectUpdateMedia();
        media.setProjectUpdate(update);
        media.setWorkdriveFileId(workdriveFileId);
        media.setMediaType(MediaType.valueOf(mediaType.toUpperCase()));
        media.setUploadedBy(uploadedBy);
        media.setUploadedAt(LocalDateTime.now());

        // Resolve URLs using WorkDriveVersionService if available
        Optional<WorkDriveFile> wdFileOpt = workDriveFileRepository.findByFileId(workdriveFileId);
        if (wdFileOpt.isPresent()) {
            WorkDriveFileVersionDto versionDto = workDriveVersionService.getLatestVersion(wdFileOpt.get().getId());
            if (versionDto != null) {
                media.setPreviewUrl(versionDto.getPreviewUrl());
                media.setDownloadUrl(versionDto.getDownloadUrl());
                media.setThumbnailUrl(versionDto.getPreviewUrl()); // Fallback thumbnail
            }
        } else {
            // Placeholder/mock defaults if WorkDrive has not finished syncing
            media.setPreviewUrl("https://workdrive.zoho.in/file/preview/" + workdriveFileId);
            media.setDownloadUrl("https://workdrive.zoho.in/file/download/" + workdriveFileId);
            media.setThumbnailUrl("https://workdrive.zoho.in/file/preview/" + workdriveFileId);
        }

        ProjectUpdateMedia saved = mediaRepository.save(media);
        return mediaMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectUpdateSummaryDto> listWorkflowUpdates(UUID workflowId, boolean clientOnly) {
        List<ProjectUpdate> updates = clientOnly 
                ? repository.findByWorkflowIdAndIsVisibleToClientOrderByPublishedAtDesc(workflowId, true)
                : repository.findByWorkflowIdOrderByPublishedAtDesc(workflowId);

        return updates.stream()
                .map(this::mapToSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectUpdateSummaryDto> listLatestUpdates(int limit) {
        return repository.findAll().stream()
                .filter(ProjectUpdate::isVisibleToClient)
                .sorted(Comparator.comparing(ProjectUpdate::getPublishedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(limit)
                .map(this::mapToSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectUpdateSummaryDto getUpdateDetail(UUID id) {
        ProjectUpdate update = repository.findById(id)
                .orElseThrow(() -> new CustomException("Project update not found", HttpStatus.NOT_FOUND));
        return mapToSummary(update);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectUpdateMediaDto> getUpdateMedia(UUID id) {
        return mediaRepository.findByProjectUpdateId(id).stream()
                .map(mediaMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectProgressDto calculateProgress(UUID workflowId) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new CustomException("Workflow not found", HttpStatus.NOT_FOUND));

        List<Stage> allStages = stageRepository.findAll().stream()
                .sorted(Comparator.comparingInt(Stage::getSequenceOrder))
                .collect(Collectors.toList());

        List<String> completed = new ArrayList<>();
        List<String> remaining = new ArrayList<>();
        double progressPercentage = 0.0;

        if (workflow.getCurrentStageId() != null) {
            Stage currentStage = stageRepository.findById(workflow.getCurrentStageId()).orElse(null);
            if (currentStage != null) {
                int currentSeq = currentStage.getSequenceOrder();
                for (Stage s : allStages) {
                    if (s.getSequenceOrder() < currentSeq) {
                        completed.add(s.getName());
                    } else {
                        remaining.add(s.getName());
                    }
                }
                if (!allStages.isEmpty()) {
                    progressPercentage = Math.round(((double) completed.size() / allStages.size()) * 1000.0) / 10.0;
                }
            }
        }

        return new ProjectProgressDto(completed, remaining, progressPercentage);
    }

    private ProjectUpdateSummaryDto mapToSummary(ProjectUpdate update) {
        ProjectUpdateDto dto = mapper.toDto(update);
        List<ProjectUpdateMediaDto> mediaList = mediaRepository.findByProjectUpdateId(update.getId()).stream()
                .map(mediaMapper::toDto)
                .collect(Collectors.toList());
        return new ProjectUpdateSummaryDto(dto, mediaList);
    }
}
