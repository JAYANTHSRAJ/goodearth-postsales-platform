package com.goodearth.postsales.workdrive.service;

import com.goodearth.postsales.workdrive.dto.WorkDriveFolderDto;
import com.goodearth.postsales.workdrive.entity.WorkDriveFolder;
import com.goodearth.postsales.workdrive.mapper.WorkDriveMapper;
import com.goodearth.postsales.workdrive.repository.WorkDriveFolderRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class WorkDriveFolderServiceImpl implements WorkDriveFolderService {

    private final WorkDriveFolderRepository folderRepository;
    private final WorkflowRepository workflowRepository;
    private final WorkDriveMapper mapper;

    public WorkDriveFolderServiceImpl(
            WorkDriveFolderRepository folderRepository,
            WorkflowRepository workflowRepository,
            WorkDriveMapper mapper) {
        this.folderRepository = folderRepository;
        this.workflowRepository = workflowRepository;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkDriveFolderDto getFolderByWorkflow(UUID workflowId) {
        WorkDriveFolder folder = folderRepository.findByWorkflowId(workflowId)
                .orElseThrow(() -> new CustomException("WorkDrive folder not registered for this workflow.", HttpStatus.NOT_FOUND));
        return mapper.toDto(folder);
    }

    @Override
    @Transactional
    public WorkDriveFolderDto registerFolder(UUID workflowId, String folderId, String folderName) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new CustomException("Workflow not found.", HttpStatus.NOT_FOUND));

        folderRepository.findByWorkflowId(workflowId).ifPresent(f -> {
            throw new CustomException("WorkDrive folder already registered for this workflow.", HttpStatus.CONFLICT);
        });

        WorkDriveFolder folder = new WorkDriveFolder();
        folder.setWorkflow(workflow);
        folder.setFolderId(folderId);
        folder.setFolderName(folderName);

        WorkDriveFolder savedFolder = folderRepository.save(folder);
        return mapper.toDto(savedFolder);
    }
}
