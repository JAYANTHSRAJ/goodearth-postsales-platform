package com.goodearth.postsales.workdrive.service;

import com.goodearth.postsales.changerequest.entity.ChangeRequest;
import com.goodearth.postsales.changerequest.repository.ChangeRequestRepository;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.entity.DocumentStatus;
import com.goodearth.postsales.document.entity.DocumentType;
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

    // Default real WorkDrive CRM team folder ID
    private static final String DEFAULT_WORKDRIVE_TEAM_FOLDER_ID = "5bgp045dc56c28ae545a293f9b444c377db6a";

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

        WorkDriveFolder folder = folderRepository.findByWorkflowId(workflowId)
                .orElseGet(() -> {
                    WorkDriveFolder newFolder = new WorkDriveFolder();
                    newFolder.setWorkflow(workflow);
                    return newFolder;
                });

        folder.setFolderId(DEFAULT_WORKDRIVE_TEAM_FOLDER_ID);
        folder.setFolderName("Workflow Folder " + (workflow.getBuyer() != null ? workflow.getBuyer().getFullName() : "Client"));
        folderRepository.save(folder);
        log.info("Registered real WorkDrive TeamFolder ID ({}) for workflow: {}", DEFAULT_WORKDRIVE_TEAM_FOLDER_ID, workflowId);
    }

    @Override
    @Transactional
    public void syncFiles(UUID workflowId) {
        log.info("Starting WorkDrive Files sync for workflow ID: {}", workflowId);
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new CustomException("Workflow not found.", HttpStatus.NOT_FOUND));

        WorkDriveFolder folder = folderRepository.findByWorkflowId(workflowId)
                .orElseGet(() -> {
                    WorkDriveFolder f = new WorkDriveFolder();
                    f.setWorkflow(workflow);
                    f.setFolderId(DEFAULT_WORKDRIVE_TEAM_FOLDER_ID);
                    f.setFolderName("Workflow Folder");
                    return folderRepository.save(f);
                });

        String targetFolderId = (folder.getFolderId() != null && !folder.getFolderId().startsWith("wd_folder_"))
                ? folder.getFolderId()
                : DEFAULT_WORKDRIVE_TEAM_FOLDER_ID;

        // Recursively traverse folder hierarchy starting from targetFolderId
        traverseAndSyncFolder(targetFolderId, folder, workflow);
    }

    private void traverseAndSyncFolder(String folderId, WorkDriveFolder folder, Workflow workflow) {
        String url = properties.getApiUrl() + "/files/" + folderId + "/files";
        ZohoWorkDriveResponse crmResponse;
        try {
            crmResponse = apiClient.get(url, ZohoWorkDriveResponse.class);
        } catch (Exception e) {
            log.error("Failed to query WorkDrive API for folder ID: {}", folderId, e);
            throw new CustomException("Failed to query WorkDrive API for folder ID: " + folderId + " - " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, e);
        }

        if (crmResponse == null || crmResponse.getData() == null || crmResponse.getData().isEmpty()) {
            log.info("No files or subfolders returned from Zoho WorkDrive API for folder: {}", folderId);
            return;
        }

        for (ZohoWorkDriveResponse.WorkDriveItem item : crmResponse.getData()) {
            String itemType = item.getType();
            if ("folder".equalsIgnoreCase(itemType) || "folders".equalsIgnoreCase(itemType)) {
                log.info("Traversing subfolder in WorkDrive: {} (ID: {})", item.getAttributes() != null ? item.getAttributes().getName() : item.getId(), item.getId());
                traverseAndSyncFolder(item.getId(), folder, workflow);
            } else {
                syncSingleWorkDriveFile(item, folder, workflow);
            }
        }
    }

    private void syncSingleWorkDriveFile(ZohoWorkDriveResponse.WorkDriveItem item, WorkDriveFolder folder, Workflow workflow) {
        String fileId = item.getId();
        String fileName = item.getAttributes() != null && item.getAttributes().getName() != null ? item.getAttributes().getName() : "Drawing_Plan.pdf";
        String mimeType = item.getResolvedMimeType();

        DocumentType determinedType = determineDocumentType(fileName);
        log.info("Syncing WorkDrive file: {} (ID: {}, Determined DocumentType: {})", fileName, fileId, determinedType);

        // 1. Check or create Document entity linked with accurate DocumentType
        List<Document> existingDocs = documentRepository.findByWorkflowId(workflow.getId());
        Document doc = existingDocs.stream()
                .filter(d -> fileId.equalsIgnoreCase(d.getWorkDriveFileId()) || fileName.equalsIgnoreCase(d.getFileName()))
                .findFirst()
                .orElseGet(() -> {
                    Document newDoc = new Document();
                    newDoc.setWorkflow(workflow);
                    newDoc.setDocumentType(determinedType);
                    newDoc.setFileName(fileName);
                    newDoc.setWorkDriveFileId(fileId);
                    newDoc.setFileSize(item.getAttributes() != null && item.getAttributes().getSize() != null ? item.getAttributes().getSize() : 102400L);
                    newDoc.setStatus(DocumentStatus.ACTIVE);
                    return documentRepository.save(newDoc);
                });

        doc.setDocumentType(determinedType);
        documentRepository.save(doc);

        // 2. Check or create WorkDriveFile entity
        WorkDriveFile file = fileRepository.findByFileId(fileId)
                .orElseGet(() -> {
                    WorkDriveFile newFile = new WorkDriveFile();
                    newFile.setFolder(folder);
                    newFile.setFileId(fileId);
                    return newFile;
                });

        file.setFileName(fileName);
        file.setMimeType(mimeType != null ? mimeType : "application/pdf");
        file.setStatus("ACTIVE");
        file.setDocument(doc);
        WorkDriveFile savedFile = fileRepository.save(file);

        // 3. Sync live versions directly from Zoho WorkDrive API
        syncVersionsForFile(savedFile, item.getAttributes());
    }

    private DocumentType determineDocumentType(String fileName) {
        if (fileName == null) return DocumentType.OTHER;
        String lower = fileName.toLowerCase();
        if (lower.contains("plan") || lower.contains("drawing") || lower.contains("floor") ||
            lower.contains("elevation") || lower.contains("structural") || lower.contains("electrical") ||
            lower.contains("plumbing") || lower.contains("interior") || lower.contains("architectural") ||
            lower.contains("layout") || lower.contains("cad")) {
            return DocumentType.DESIGN_PLAN;
        } else if (lower.contains("offer") || lower.contains("booking")) {
            return DocumentType.BOOKING_FORM;
        } else if (lower.contains("agreement") || lower.contains("contract")) {
            return DocumentType.AGREEMENT;
        } else if (lower.contains("invoice")) {
            return DocumentType.INVOICE;
        } else if (lower.contains("receipt")) {
            return DocumentType.RECEIPT;
        }
        return DocumentType.OTHER;
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
            log.error("Failed to fetch version history from Zoho WorkDrive API for file ID: {}", fileId, e);
            throw new CustomException("Failed to fetch version history from WorkDrive API for file: " + fileId + " - " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, e);
        }

        if (crmResponse == null || crmResponse.getData() == null || crmResponse.getData().isEmpty()) {
            log.warn("No version records returned by WorkDrive API for file ID: {}", fileId);
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
                version.setFileName(item.getAttributes() != null && item.getAttributes().getName() != null ? item.getAttributes().getName() : file.getFileName());
                version.setMimeType(item.getResolvedMimeType() != null ? item.getResolvedMimeType() : file.getMimeType());

                String realPreviewUrl = "https://workdrive.zoho.in/file/preview/" + file.getFileId();
                String realDownloadUrl = "https://workdrive.zoho.in/file/download/" + file.getFileId();

                if (item.getAttributes() != null) {
                    if (item.getAttributes().getPreviewUrl() != null && !item.getAttributes().getPreviewUrl().isBlank()) {
                        realPreviewUrl = item.getAttributes().getPreviewUrl();
                    }
                    if (item.getAttributes().getDownloadUrl() != null && !item.getAttributes().getDownloadUrl().isBlank()) {
                        realDownloadUrl = item.getAttributes().getDownloadUrl();
                    }
                }

                version.setPreviewUrl(realPreviewUrl);
                version.setDownloadUrl(realDownloadUrl);
                version.setUploadedBy(item.getAttributes() != null && item.getAttributes().getUploadedBy() != null ? item.getAttributes().getUploadedBy() : "system");
                version.setUploadedAt(LocalDateTime.now());
                versionRepository.save(version);
                log.info("Synced version {} of WorkDrive file {} (Preview: {})", versionNumber, file.getFileName(), realPreviewUrl);
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
        Optional<WorkDriveFileVersion> existingVerOpt = versionRepository.findByWorkDriveFileIdOrderByVersionAsc(file.getId()).stream()
                .filter(v -> v.getVersion() == 1)
                .findFirst();

        if (existingVerOpt.isEmpty()) {
            WorkDriveFileVersion version = new WorkDriveFileVersion();
            version.setWorkDriveFile(file);
            version.setVersion(1);
            version.setFileName(file.getFileName());
            version.setMimeType(file.getMimeType());

            String previewUrl = (attrs != null && attrs.getPreviewUrl() != null && !attrs.getPreviewUrl().isBlank())
                    ? attrs.getPreviewUrl()
                    : "https://workdrive.zoho.in/file/preview/" + file.getFileId();

            String downloadUrl = (attrs != null && attrs.getDownloadUrl() != null && !attrs.getDownloadUrl().isBlank())
                    ? attrs.getDownloadUrl()
                    : "https://workdrive.zoho.in/file/download/" + file.getFileId();

            version.setPreviewUrl(previewUrl);
            version.setDownloadUrl(downloadUrl);
            version.setUploadedBy(attrs != null && attrs.getUploadedBy() != null ? attrs.getUploadedBy() : "system");
            version.setUploadedAt(LocalDateTime.now());
            versionRepository.save(version);
            log.info("Synced version 1 of WorkDrive file {} (Preview: {})", file.getFileName(), previewUrl);
        }
    }
}
