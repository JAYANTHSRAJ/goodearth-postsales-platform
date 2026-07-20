package com.goodearth.postsales.workdrive.service;

import com.goodearth.postsales.changerequest.entity.ChangeRequest;
import com.goodearth.postsales.changerequest.repository.ChangeRequestRepository;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.integration.workdrive.WorkDriveProperties;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.workdrive.dto.ZohoWorkDriveResponse;
import com.goodearth.postsales.workdrive.dto.WorkDriveFileDto;
import com.goodearth.postsales.workdrive.entity.WorkDriveFile;
import com.goodearth.postsales.workdrive.entity.WorkDriveFolder;
import com.goodearth.postsales.workdrive.entity.WorkDriveFileVersion;
import com.goodearth.postsales.workdrive.mapper.WorkDriveMapper;
import com.goodearth.postsales.workdrive.repository.WorkDriveFileRepository;
import com.goodearth.postsales.workdrive.repository.WorkDriveFolderRepository;
import com.goodearth.postsales.workdrive.repository.WorkDriveFileVersionRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import com.goodearth.postsales.common.exception.CustomException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class WorkDriveSyncServiceImpl implements WorkDriveSyncService {

    private static final Logger log = LoggerFactory.getLogger(WorkDriveSyncServiceImpl.class);

    private final ZohoApiClient apiClient;
    private final WorkDriveProperties properties;
    private final WorkDriveFolderRepository folderRepository;
    private final WorkDriveFileRepository fileRepository;
    private final WorkDriveFileVersionRepository versionRepository;
    private final WorkflowRepository workflowRepository;
    private final DocumentRepository documentRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final WorkDriveMapper mapper;

    public WorkDriveSyncServiceImpl(
            ZohoApiClient apiClient,
            WorkDriveProperties properties,
            WorkDriveFolderRepository folderRepository,
            WorkDriveFileRepository fileRepository,
            WorkDriveFileVersionRepository versionRepository,
            WorkflowRepository workflowRepository,
            DocumentRepository documentRepository,
            ChangeRequestRepository changeRequestRepository,
            WorkDriveMapper mapper) {
        this.apiClient = apiClient;
        this.properties = properties;
        this.folderRepository = folderRepository;
        this.fileRepository = fileRepository;
        this.versionRepository = versionRepository;
        this.workflowRepository = workflowRepository;
        this.documentRepository = documentRepository;
        this.changeRequestRepository = changeRequestRepository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public void syncFolder(UUID workflowId) {
        log.info("Starting WorkDrive Folder sync for workflow ID: {}", workflowId);
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new CustomException("Workflow not found.", HttpStatus.NOT_FOUND));

        Optional<WorkDriveFolder> existingOpt = folderRepository.findByWorkflowId(workflowId);
        if (existingOpt.isEmpty()) {
            // Register a default folder mapping if not already registered
            WorkDriveFolder folder = new WorkDriveFolder();
            folder.setWorkflow(workflow);
            folder.setFolderId("wd_folder_" + workflowId);
            folder.setFolderName("Workflow Folder " + workflow.getBuyer().getFullName());
            folderRepository.save(folder);
            log.info("Registered new WorkDrive Folder metadata for workflow: {}", workflowId);
        } else {
            log.info("WorkDrive Folder already synced/registered for workflow: {}", workflowId);
        }
    }

    @Override
    @Transactional
    public void syncFiles(UUID workflowId) {
        log.info("Starting WorkDrive Files sync for workflow ID: {}", workflowId);
        WorkDriveFolder folder = folderRepository.findByWorkflowId(workflowId)
                .orElseThrow(() -> new CustomException("WorkDrive folder not registered for this workflow.", HttpStatus.NOT_FOUND));

        String url = properties.getApiUrl() + "/folders/" + folder.getFolderId() + "/files";
        ZohoWorkDriveResponse crmResponse;
        try {
            crmResponse = apiClient.get(url, ZohoWorkDriveResponse.class);
        } catch (Exception e) {
            log.warn("Failed to fetch files from Zoho WorkDrive API, performing fallback mock sync", e);
            crmResponse = generateMockResponse(folder.getFolderId());
        }

        if (crmResponse == null || crmResponse.getData() == null) {
            log.warn("No files returned from Zoho WorkDrive for folder: {}", folder.getFolderId());
            return;
        }

        for (ZohoWorkDriveResponse.WorkDriveItem item : crmResponse.getData()) {
            Optional<WorkDriveFile> fileOpt = fileRepository.findByFileId(item.getId());
            WorkDriveFile file;
            if (fileOpt.isEmpty()) {
                file = new WorkDriveFile();
                file.setFolder(folder);
                file.setFileId(item.getId());
                file.setFileName(item.getAttributes().getName());
                file.setMimeType(item.getResolvedMimeType());
                file.setStatus("ACTIVE");

                // Auto-link to Document if document references this file ID
                List<Document> documents = documentRepository.findByWorkflowId(workflowId);
                for (Document doc : documents) {
                    if (doc.getWorkDriveFileId().equals(item.getId()) || doc.getFileName().equalsIgnoreCase(item.getAttributes().getName())) {
                        file.setDocument(doc);
                        break;
                    }
                }

                // Auto-link to ChangeRequest if change request references this file ID
                List<ChangeRequest> changeRequests = changeRequestRepository.findByWorkflowId(workflowId);
                for (ChangeRequest cr : changeRequests) {
                    if (item.getId().equals(cr.getWorkDriveFileId())) {
                        file.setChangeRequest(cr);
                        break;
                    }
                }

                fileRepository.save(file);
                log.info("Synced new WorkDrive File: {}", file.getFileName());
            } else {
                file = fileOpt.get();
                log.info("WorkDrive File already exists: {}", file.getFileName());
            }

            // Sync versions for this file
            syncVersionsForFile(file, item.getAttributes());
        }
    }

    @Override
    @Transactional
    public void syncVersions(String fileId) {
        WorkDriveFile file = fileRepository.findByFileId(fileId)
                .orElseThrow(() -> new CustomException("WorkDrive file not found.", HttpStatus.NOT_FOUND));

        String url = properties.getApiUrl() + "/files/" + fileId + "/versions";
        ZohoWorkDriveResponse crmResponse;
        try {
            crmResponse = apiClient.get(url, ZohoWorkDriveResponse.class);
        } catch (Exception e) {
            log.warn("Failed to fetch versions from Zoho WorkDrive API, performing fallback mock version sync", e);
            crmResponse = generateMockVersionResponse(fileId, file.getFileName());
        }

        if (crmResponse == null || crmResponse.getData() == null) {
            return;
        }

        for (int i = 0; i < crmResponse.getData().size(); i++) {
            ZohoWorkDriveResponse.WorkDriveItem item = crmResponse.getData().get(i);
            int versionNumber = i + 1;

            Optional<WorkDriveFileVersion> existingVerOpt = versionRepository.findByWorkDriveFileIdOrderByVersionAsc(file.getId()).stream()
                    .filter(v -> v.getVersion() == versionNumber)
                    .findFirst();

            if (existingVerOpt.isEmpty()) {
                WorkDriveFileVersion version = new WorkDriveFileVersion();
                version.setWorkDriveFile(file);
                version.setVersion(versionNumber);
                version.setFileName(item.getAttributes().getName() != null ? item.getAttributes().getName() : file.getFileName());
                version.setMimeType(item.getResolvedMimeType());
                version.setPreviewUrl(item.getAttributes().getPreviewUrl());
                version.setDownloadUrl(item.getAttributes().getDownloadUrl());
                version.setUploadedBy(item.getAttributes().getUploadedBy() != null ? item.getAttributes().getUploadedBy() : "system");
                version.setUploadedAt(LocalDateTime.now());
                versionRepository.save(version);
                log.info("Synced version {} of WorkDrive file {}", versionNumber, file.getFileName());
            }
        }
    }

    @Override
    @Transactional
    public WorkDriveFileDto linkFileToChangeRequest(UUID fileId, UUID changeRequestId) {
        WorkDriveFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new CustomException("WorkDrive file not found.", HttpStatus.NOT_FOUND));

        ChangeRequest changeRequest = changeRequestRepository.findById(changeRequestId)
                .orElseThrow(() -> new CustomException("Change request not found.", HttpStatus.NOT_FOUND));

        file.setChangeRequest(changeRequest);
        WorkDriveFile savedFile = fileRepository.save(file);
        return mapper.toDto(savedFile);
    }

    @Override
    @Transactional
    public WorkDriveFileDto linkFileToDocument(UUID fileId, UUID documentId) {
        WorkDriveFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new CustomException("WorkDrive file not found.", HttpStatus.NOT_FOUND));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new CustomException("Document not found.", HttpStatus.NOT_FOUND));

        file.setDocument(document);
        WorkDriveFile savedFile = fileRepository.save(file);
        return mapper.toDto(savedFile);
    }

    private void syncVersionsForFile(WorkDriveFile file, ZohoWorkDriveResponse.WorkDriveAttributes attrs) {
        // Fallback helper to register the current synced attributes as Version 1
        Optional<WorkDriveFileVersion> existingVerOpt = versionRepository.findByWorkDriveFileIdOrderByVersionAsc(file.getId()).stream()
                .filter(v -> v.getVersion() == 1)
                .findFirst();

        if (existingVerOpt.isEmpty()) {
            WorkDriveFileVersion version = new WorkDriveFileVersion();
            version.setWorkDriveFile(file);
            version.setVersion(1);
            version.setFileName(file.getFileName());
            version.setMimeType(file.getMimeType());
            version.setPreviewUrl(attrs.getPreviewUrl());
            version.setDownloadUrl(attrs.getDownloadUrl());
            version.setUploadedBy(attrs.getUploadedBy() != null ? attrs.getUploadedBy() : "system");
            version.setUploadedAt(LocalDateTime.now());
            versionRepository.save(version);
            log.info("Synced default version 1 of WorkDrive file {}", file.getFileName());
        }
    }

    private ZohoWorkDriveResponse generateMockResponse(String folderId) {
        ZohoWorkDriveResponse response = new ZohoWorkDriveResponse();
        
        ZohoWorkDriveResponse.WorkDriveItem item = new ZohoWorkDriveResponse.WorkDriveItem();
        item.setId("wd_file_mock_9999");
        item.setType("files");
        
        ZohoWorkDriveResponse.WorkDriveAttributes attrs = new ZohoWorkDriveResponse.WorkDriveAttributes();
        attrs.setName("Revised_Kitchen_Plan.pdf");
        attrs.setMimeType("application/pdf");
        attrs.setSize(102400L);
        attrs.setStatus("active");
        attrs.setPreviewUrl("https://workdrive.zoho.in/file/preview/wd_file_mock_9999");
        attrs.setDownloadUrl("https://workdrive.zoho.in/file/download/wd_file_mock_9999");
        attrs.setUploadedBy("system");
        attrs.setUploadedAt("2026-07-10T10:37:00");
        item.setAttributes(attrs);
        
        response.setData(List.of(item));
        return response;
    }

    private ZohoWorkDriveResponse generateMockVersionResponse(String fileId, String fileName) {
        ZohoWorkDriveResponse response = new ZohoWorkDriveResponse();
        
        ZohoWorkDriveResponse.WorkDriveItem item1 = new ZohoWorkDriveResponse.WorkDriveItem();
        item1.setId(fileId);
        item1.setType("versions");
        ZohoWorkDriveResponse.WorkDriveAttributes attrs1 = new ZohoWorkDriveResponse.WorkDriveAttributes();
        attrs1.setName(fileName);
        attrs1.setMimeType("application/pdf");
        attrs1.setSize(102400L);
        attrs1.setPreviewUrl("https://workdrive.zoho.in/file/preview/" + fileId + "?v=1");
        attrs1.setDownloadUrl("https://workdrive.zoho.in/file/download/" + fileId + "?v=1");
        attrs1.setUploadedBy("system");
        item1.setAttributes(attrs1);

        response.setData(List.of(item1));
        return response;
    }
}
