package com.goodearth.postsales.workdrive.service;

import com.goodearth.postsales.changerequest.entity.ChangeRequest;
import com.goodearth.postsales.changerequest.repository.ChangeRequestRepository;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.entity.DocumentStatus;
import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.integration.workdrive.WorkDriveProperties;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoTokenManager;
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
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class WorkDriveSyncServiceImpl implements WorkDriveSyncService {

    private static final Logger log = LoggerFactory.getLogger(WorkDriveSyncServiceImpl.class);

    // Connected Zoho WorkDrive CRM TeamFolder ID
    private static final String DEFAULT_TEAM_FOLDER_ID = "5bgp045dc56c28ae545a293f9b444c377db6a";

    private final ZohoApiClient apiClient;
    private final ZohoTokenManager tokenManager;
    private final WorkDriveProperties properties;
    private final WorkDriveFolderRepository folderRepository;
    private final WorkDriveFileRepository fileRepository;
    private final WorkDriveFileVersionRepository versionRepository;
    private final WorkflowRepository workflowRepository;
    private final DocumentRepository documentRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final WorkDriveMapper mapper;
    private final RestTemplate restTemplate;

    public WorkDriveSyncServiceImpl(
            ZohoApiClient apiClient,
            ZohoTokenManager tokenManager,
            WorkDriveProperties properties,
            WorkDriveFolderRepository folderRepository,
            WorkDriveFileRepository fileRepository,
            WorkDriveFileVersionRepository versionRepository,
            WorkflowRepository workflowRepository,
            DocumentRepository documentRepository,
            ChangeRequestRepository changeRequestRepository,
            WorkDriveMapper mapper,
            org.springframework.beans.factory.ObjectProvider<RestTemplate> restTemplateProvider) {
        this.apiClient = apiClient;
        this.tokenManager = tokenManager;
        this.properties = properties;
        this.folderRepository = folderRepository;
        this.fileRepository = fileRepository;
        this.versionRepository = versionRepository;
        this.workflowRepository = workflowRepository;
        this.documentRepository = documentRepository;
        this.changeRequestRepository = changeRequestRepository;
        this.mapper = mapper;
        this.restTemplate = restTemplateProvider.getIfAvailable(RestTemplate::new);
    }

    @Override
    @Transactional
    public void syncFolder(UUID workflowId) {
        log.info("Starting automated WorkDrive folder provisioning for workflow ID: {}", workflowId);
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new CustomException("Workflow not found: " + workflowId, HttpStatus.NOT_FOUND));

        String projectName = (workflow.getProject() != null && workflow.getProject().getProjectName() != null)
                ? workflow.getProject().getProjectName()
                : "GoodEarth Motif";

        String unitNumber = (workflow.getBuyer() != null && workflow.getBuyer().getZohoDealId() != null)
                ? workflow.getBuyer().getZohoDealId()
                : "motif16";

        String bookingId = unitNumber;

        WorkDriveFolder folder = folderRepository.findByWorkflowId(workflowId)
                .orElseGet(() -> {
                    WorkDriveFolder newFolder = new WorkDriveFolder();
                    newFolder.setWorkflow(workflow);
                    return newFolder;
                });

        String teamFolderId = resolveTeamFolderId();
        folder.setBookingId(bookingId);
        folder.setProjectName(projectName);
        folder.setUnitNumber(unitNumber);
        folder.setTeamFolderId(teamFolderId);

        try {
            // 1. Check or create 'TestSandbox' folder inside TeamFolder
            String sandboxFolderId = findOrCreateFolder("TestSandbox", teamFolderId, workflowId, bookingId);
            folder.setFolderId(sandboxFolderId);
            folder.setTestSandboxFolderId(sandboxFolderId);
            log.info("Provisioned TestSandbox Folder ID: {}", sandboxFolderId);

            // 2. Check or create '<Project Name>' folder inside TestSandbox
            String projectFolderId = findOrCreateFolder(projectName, sandboxFolderId, workflowId, bookingId);
            folder.setProjectFolderId(projectFolderId);
            log.info("Provisioned Project Folder '{}' ID: {}", projectName, projectFolderId);

            // 3. Check or create '<Unit Number>' folder inside Project folder
            String unitFolderId = findOrCreateFolder(unitNumber, projectFolderId, workflowId, bookingId);
            folder.setUnitFolderId(unitFolderId);
            folder.setBookingFolderId(unitFolderId);
            folder.setFolderName(projectName + " - " + unitNumber);
            log.info("Provisioned Unit Folder '{}' ID: {}", unitNumber, unitFolderId);

            // 4. Create all 9 subfolders inside Unit Folder
            folder.setFloorPlansFolderId(findOrCreateFolder("Floor Plans", unitFolderId, workflowId, bookingId));
            folder.setArchitecturalFolderId(findOrCreateFolder("Architectural Drawings", unitFolderId, workflowId, bookingId));
            folder.setStructuralFolderId(findOrCreateFolder("Structural Drawings", unitFolderId, workflowId, bookingId));
            folder.setElectricalFolderId(findOrCreateFolder("Electrical", unitFolderId, workflowId, bookingId));
            folder.setPlumbingFolderId(findOrCreateFolder("Plumbing", unitFolderId, workflowId, bookingId));
            folder.setInteriorFolderId(findOrCreateFolder("Interior", unitFolderId, workflowId, bookingId));
            folder.setSitePhotosFolderId(findOrCreateFolder("Site Photos", unitFolderId, workflowId, bookingId));
            folder.setApprovalsFolderId(findOrCreateFolder("Approvals", unitFolderId, workflowId, bookingId));
            folder.setDocumentsFolderId(findOrCreateFolder("Documents", unitFolderId, workflowId, bookingId));

            folderRepository.save(folder);
            log.info("Successfully provisioned WorkDrive folder hierarchy for workflow {}: Unit Folder ID: {}", workflowId, unitFolderId);
        } catch (Exception e) {
            log.error("WorkDrive folder creation failed - Folder ID: N/A, File ID: N/A, Workflow ID: {}, Booking ID: {}, Error: {}",
                    workflowId, bookingId, e.getMessage(), e);
            if (e instanceof CustomException) {
                throw (CustomException) e;
            }
            throw new CustomException("WorkDrive folder creation failed for workflow " + workflowId + ": " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, e);
        }
    }

    private String findOrCreateFolder(String folderName, String parentId, UUID workflowId, String bookingId) {
        String endpoint = properties.getApiUrl() + "/files/" + parentId + "/files";
        try {
            ZohoWorkDriveResponse response = apiClient.get(endpoint, ZohoWorkDriveResponse.class);
            if (response != null && response.getData() != null) {
                for (ZohoWorkDriveResponse.WorkDriveItem item : response.getData()) {
                    if (item.getAttributes() != null && folderName.equalsIgnoreCase(item.getAttributes().getName())) {
                        log.info("Found existing WorkDrive folder '{}' under parent {} -> ID: {}", folderName, parentId, item.getId());
                        return item.getId();
                    }
                }
            }
        } catch (RestClientResponseException rce) {
            log.error("WorkDrive list files error - Parent Folder ID: {}, Workflow ID: {}, Booking ID: {}, Endpoint: {}, HTTP Status: {}",
                    parentId, workflowId, bookingId, endpoint, rce.getStatusCode());
        } catch (Exception ex) {
            log.warn("Listing files in WorkDrive folder {} encountered error, attempting folder creation directly. Endpoint: {}, Error: {}",
                    parentId, endpoint, ex.getMessage());
        }

        // Create folder via WorkDrive API POST /files
        String createUrl = properties.getApiUrl() + "/files";
        log.info("Creating new WorkDrive folder '{}' under parent ID: {}, Endpoint: {}", folderName, parentId, createUrl);

        Map<String, Object> attributes = new HashMap<>();
        attributes.put("name", folderName);
        attributes.put("parent_id", parentId);

        Map<String, Object> data = new HashMap<>();
        data.put("attributes", attributes);
        data.put("type", "files");

        Map<String, Object> body = new HashMap<>();
        body.put("data", data);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + tokenManager.getAccessToken());
            headers.setContentType(MediaType.valueOf("application/vnd.api+json"));
            headers.set("Accept", "application/vnd.api+json");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<ZohoWorkDriveResponse> res = restTemplate.postForEntity(createUrl, entity, ZohoWorkDriveResponse.class);

            if (res.getBody() != null && res.getBody().getData() != null && !res.getBody().getData().isEmpty()) {
                String newId = res.getBody().getData().get(0).getId();
                log.info("Created WorkDrive folder '{}' under parent {} -> New ID: {}", folderName, parentId, newId);
                return newId;
            }
        } catch (RestClientResponseException rce) {
            log.error("WorkDrive folder creation failed - Folder ID: {}, Parent ID: {}, Workflow ID: {}, Booking ID: {}, Endpoint: {}, HTTP Status: {}, Response: {}",
                    folderName, parentId, workflowId, bookingId, createUrl, rce.getStatusCode(), rce.getResponseBodyAsString());
            throw new CustomException("WorkDrive folder creation failed for '" + folderName + "' under parent " + parentId + " (Status: " + rce.getStatusCode() + ")", HttpStatus.INTERNAL_SERVER_ERROR, rce);
        } catch (Exception createEx) {
            log.error("Failed to create WorkDrive folder '{}' under parent {}: {}", folderName, parentId, createEx.getMessage(), createEx);
            throw new CustomException("WorkDrive folder creation failed for '" + folderName + "': " + createEx.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, createEx);
        }

        throw new CustomException("Failed to obtain WorkDrive folder ID for '" + folderName + "'", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Override
    @Transactional
    public void syncFiles(UUID workflowId) {
        log.info("Starting WorkDrive Files sync for workflow ID: {}", workflowId);
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new CustomException("Workflow not found: " + workflowId, HttpStatus.NOT_FOUND));

        WorkDriveFolder folder = folderRepository.findByWorkflowId(workflowId)
                .orElseGet(() -> {
                    syncFolder(workflowId);
                    return folderRepository.findByWorkflowId(workflowId)
                            .orElseThrow(() -> new CustomException("Failed to register folder for workflow: " + workflowId, HttpStatus.INTERNAL_SERVER_ERROR));
                });

        String targetFolderId = folder.getUnitFolderId() != null ? folder.getUnitFolderId() : folder.getFolderId();
        if (targetFolderId == null) {
            targetFolderId = resolveTeamFolderId();
        }

        traverseAndSyncFolder(targetFolderId, folder, workflow);
    }

    private String resolveTeamFolderId() {
        try {
            String endpoint = properties.getApiUrl() + "/users/me";
            ZohoWorkDriveResponse response = apiClient.get(endpoint, ZohoWorkDriveResponse.class);
            if (response != null && response.getData() != null && !response.getData().isEmpty()) {
                ZohoWorkDriveResponse.WorkDriveItem item = response.getData().get(0);
                if (item.getAttributes() != null && item.getAttributes().getTeamId() != null) {
                    return item.getAttributes().getTeamId();
                }
            }
        } catch (Exception ex) {
            log.warn("Could not dynamically resolve team folder ID via /users/me: {}. Utilizing standard configured team folder ID.", ex.getMessage());
        }
        return DEFAULT_TEAM_FOLDER_ID;
    }

    private void traverseAndSyncFolder(String folderId, WorkDriveFolder folder, Workflow workflow) {
        String endpoint = properties.getApiUrl() + "/files/" + folderId + "/files";
        ZohoWorkDriveResponse crmResponse;
        try {
            crmResponse = apiClient.get(endpoint, ZohoWorkDriveResponse.class);
        } catch (RestClientResponseException rce) {
            log.error("WorkDrive API Error during traverse - Folder ID: {}, Workflow ID: {}, Booking ID: {}, Endpoint: {}, HTTP Status: {}",
                    folderId, workflow.getId(), folder.getBookingId(), endpoint, rce.getStatusCode());
            throw new CustomException("Failed to query WorkDrive API for folder ID: " + folderId + " (Status: " + rce.getStatusCode() + ")", HttpStatus.INTERNAL_SERVER_ERROR, rce);
        } catch (Exception e) {
            log.error("Failed to query WorkDrive API for folder ID: {} (Workflow: {}, Booking: {})", folderId, workflow.getId(), folder.getBookingId(), e);
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
                syncSingleWorkDriveFile(item, folder, workflow, folderId);
            }
        }
    }

    private void syncSingleWorkDriveFile(ZohoWorkDriveResponse.WorkDriveItem item, WorkDriveFolder folder, Workflow workflow, String parentFolderId) {
        String fileId = item.getId();
        String fileName = item.getAttributes() != null && item.getAttributes().getName() != null ? item.getAttributes().getName() : "Drawing_Plan.pdf";
        String mimeType = item.getResolvedMimeType();

        DocumentType determinedType = determineDocumentType(fileName, parentFolderId, folder);
        log.info("Syncing WorkDrive file: {} (ID: {}, DocumentType: {}, Parent Folder: {})", fileName, fileId, determinedType, parentFolderId);

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
        doc.setWorkDriveFileId(fileId);
        doc.setFileName(fileName);
        documentRepository.save(doc);

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

        syncVersionsForFile(savedFile, item.getAttributes());
    }

    private DocumentType determineDocumentType(String fileName, String parentFolderId, WorkDriveFolder folder) {
        if (parentFolderId != null && folder != null) {
            if (parentFolderId.equals(folder.getFloorPlansFolderId())) {
                return DocumentType.DESIGN_PLAN;
            } else if (parentFolderId.equals(folder.getArchitecturalFolderId())) {
                return DocumentType.ARCHITECTURAL;
            } else if (parentFolderId.equals(folder.getStructuralFolderId())) {
                return DocumentType.STRUCTURAL;
            } else if (parentFolderId.equals(folder.getElectricalFolderId())) {
                return DocumentType.ELECTRICAL;
            } else if (parentFolderId.equals(folder.getPlumbingFolderId())) {
                return DocumentType.PLUMBING;
            } else if (parentFolderId.equals(folder.getInteriorFolderId())) {
                return DocumentType.INTERIOR;
            } else if (parentFolderId.equals(folder.getDocumentsFolderId())) {
                return DocumentType.DOCUMENT;
            } else if (parentFolderId.equals(folder.getSitePhotosFolderId())) {
                return DocumentType.PHOTO;
            } else if (parentFolderId.equals(folder.getApprovalsFolderId())) {
                return DocumentType.APPROVAL;
            }
        }

        if (fileName == null) return DocumentType.OTHER;
        String lower = fileName.toLowerCase();
        if (lower.contains("plan") || lower.contains("drawing") || lower.contains("floor") || lower.contains("layout") || lower.contains("cad")) {
            return DocumentType.DESIGN_PLAN;
        } else if (lower.contains("architectural")) {
            return DocumentType.ARCHITECTURAL;
        } else if (lower.contains("structural")) {
            return DocumentType.STRUCTURAL;
        } else if (lower.contains("electrical")) {
            return DocumentType.ELECTRICAL;
        } else if (lower.contains("plumbing")) {
            return DocumentType.PLUMBING;
        } else if (lower.contains("interior")) {
            return DocumentType.INTERIOR;
        } else if (lower.contains("approval")) {
            return DocumentType.APPROVAL;
        } else if (lower.contains("photo")) {
            return DocumentType.PHOTO;
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
                .orElseThrow(() -> new CustomException("WorkDrive file not found: " + fileId, HttpStatus.NOT_FOUND));

        String endpoint = properties.getApiUrl() + "/files/" + fileId + "/versions";
        ZohoWorkDriveResponse crmResponse;
        try {
            crmResponse = apiClient.get(endpoint, ZohoWorkDriveResponse.class);
        } catch (RestClientResponseException rce) {
            log.error("WorkDrive API error fetching versions - File ID: {}, Endpoint: {}, HTTP Status: {}",
                    fileId, endpoint, rce.getStatusCode());
            throw new CustomException("Failed to fetch version history from WorkDrive API for file: " + fileId + " (Status: " + rce.getStatusCode() + ")", HttpStatus.INTERNAL_SERVER_ERROR, rce);
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
