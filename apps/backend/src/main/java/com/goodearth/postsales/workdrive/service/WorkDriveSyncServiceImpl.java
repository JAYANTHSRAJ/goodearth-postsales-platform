package com.goodearth.postsales.workdrive.service;

import com.goodearth.postsales.buyer.entity.Buyer;
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

    // TestSandbox WorkDrive TeamFolder ID
    private static final String DEFAULT_TEAM_FOLDER_ID = "6wbga105d85b36926403d8edcbbaaf29c7583";

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
    public String syncProjectFolder(String projectName) {
        if (projectName == null || projectName.isBlank()) {
            throw new CustomException("Cannot provision WorkDrive Project folder: Project Site Name is null or blank", HttpStatus.BAD_REQUEST);
        }
        String trimmedProjectName = projectName.trim();
        String teamFolderId = resolveTeamFolderId();
        log.info("[WORKDRIVE_HIERARCHY] Searching Project Folder '{}' under TestSandbox Team Folder {}", trimmedProjectName, teamFolderId);
        
        String projectFolderId = findOrCreateFolder(trimmedProjectName, teamFolderId, null, trimmedProjectName);
        log.info("[WORKDRIVE_HIERARCHY] Project Folder Found/Created: {} for Project Site '{}'", projectFolderId, trimmedProjectName);
        return projectFolderId;
    }

    @Override
    @Transactional
    public WorkDriveFolder syncUnitFolder(String projectName, String unitName) {
        if (projectName == null || projectName.isBlank()) {
            throw new CustomException("Cannot provision WorkDrive Unit folder: Project Site Name is null or blank", HttpStatus.BAD_REQUEST);
        }
        if (unitName == null || unitName.isBlank()) {
            throw new CustomException("Cannot provision WorkDrive Unit folder: Unit Name is null or blank", HttpStatus.BAD_REQUEST);
        }
        
        String trimmedProjectName = projectName.trim();
        String trimmedUnitName = unitName.trim();
        String teamFolderId = resolveTeamFolderId();

        if ("TestSandbox".equalsIgnoreCase(trimmedProjectName) || DEFAULT_TEAM_FOLDER_ID.equalsIgnoreCase(trimmedProjectName) || (properties.getTeamFolderId() != null && properties.getTeamFolderId().equalsIgnoreCase(trimmedProjectName))) {
            throw new CustomException("Invalid Project Site Name '" + projectName + "': Unit '" + unitName + "' must be assigned to a specific Project Site folder, not directly under TestSandbox root.", HttpStatus.BAD_REQUEST);
        }

        log.info("[WORKDRIVE_HIERARCHY] Webhook Received -> Project Site: '{}', Unit: '{}'", trimmedProjectName, trimmedUnitName);
        
        // Step 1 & Step 2: Find or create Project Folder directly under TestSandbox
        String projectFolderId = syncProjectFolder(trimmedProjectName);

        // Step 3 (Parent-Child Validation): Parent ID for Unit MUST be the Project Folder ID, NEVER TestSandbox ID!
        if (projectFolderId == null || projectFolderId.isBlank() || projectFolderId.equalsIgnoreCase(teamFolderId)) {
            throw new CustomException("Parent-Child Validation Error: Unit folder '" + trimmedUnitName + "' cannot use TestSandbox (" + teamFolderId + ") as parent_id. A valid Project Folder ID is required.", HttpStatus.BAD_REQUEST);
        }

        log.info("[WORKDRIVE_HIERARCHY] Searching/Creating Unit Folder '{}' under Parent Project Folder ID: {}", trimmedUnitName, projectFolderId);

        WorkDriveFolder folder = folderRepository.findByUnitNumberAndProjectName(trimmedUnitName, trimmedProjectName)
                .orElseGet(() -> folderRepository.findByBookingId(trimmedUnitName)
                        .orElseGet(() -> {
                            WorkDriveFolder newFolder = new WorkDriveFolder();
                            newFolder.setUnitNumber(trimmedUnitName);
                            newFolder.setProjectName(trimmedProjectName);
                            return newFolder;
                        }));

        folder.setBookingId(trimmedUnitName);
        folder.setProjectName(trimmedProjectName);
        folder.setUnitNumber(trimmedUnitName);
        folder.setTeamFolderId(teamFolderId);
        folder.setTestSandboxFolderId(teamFolderId);
        folder.setProjectFolderId(projectFolderId);

        // Step 4: Find or create Unit Folder inside Project Folder
        String unitFolderId = findOrCreateFolder(trimmedUnitName, projectFolderId, null, trimmedUnitName);
        folder.setUnitFolderId(unitFolderId);
        folder.setFolderId(unitFolderId);
        folder.setBookingFolderId(unitFolderId);
        folder.setFolderName(trimmedProjectName + " - " + trimmedUnitName);

        log.info("[WORKDRIVE_HIERARCHY] Created/Reused Unit Folder ID: {} under Parent Project Folder ID: {}", unitFolderId, projectFolderId);
        log.info("[WORKDRIVE_HIERARCHY] Provisioning Floor Plans folder under Unit Folder {}", unitFolderId);

        // Step 5: Provision Floor Plans subfolder inside Unit Folder
        folder.setFloorPlansFolderId(findOrCreateFolder("Floor Plans", unitFolderId, null, trimmedUnitName));

        log.info("[WORKDRIVE_HIERARCHY] Provisioning Completed Successfully for Unit '{}' under Project '{}'.", trimmedUnitName, trimmedProjectName);
        return folderRepository.save(folder);
    }

    @Override
    @Transactional
    public void syncFolder(UUID workflowId) {
        log.info("Starting automated WorkDrive folder provisioning for workflow ID: {}", workflowId);
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new CustomException("Workflow not found: " + workflowId, HttpStatus.NOT_FOUND));

        String projectName = (workflow.getProject() != null) ? workflow.getProject().getProjectName() : null;
        String unitName = (workflow.getBuyer() != null) ? workflow.getBuyer().getUnitName() : null;
        if ((unitName == null || unitName.isBlank()) && workflow.getBuyer() != null) {
            unitName = workflow.getBuyer().getZohoDealId();
        }

        WorkDriveFolder folder = syncUnitFolder(projectName, unitName);
        if (folder.getWorkflow() == null) {
            folder.setWorkflow(workflow);
            folderRepository.save(folder);
        }
        log.info("Successfully linked WorkDrive folder hierarchy to workflow ID: {}", workflowId);
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
        if (properties.getTeamFolderId() != null && !properties.getTeamFolderId().isBlank()) {
            log.info("Resolved Team Folder ID: {} (from properties)", properties.getTeamFolderId());
            return properties.getTeamFolderId();
        }
        try {
            String endpoint = properties.getApiUrl() + "/users/me";
            ZohoWorkDriveResponse userResponse = apiClient.get(endpoint, ZohoWorkDriveResponse.class);
            if (userResponse != null && userResponse.getData() != null && !userResponse.getData().isEmpty()) {
                ZohoWorkDriveResponse.WorkDriveItem userItem = userResponse.getData().get(0);
                if (userItem.getAttributes() != null && userItem.getAttributes().getTeamId() != null) {
                    String teamId = userItem.getAttributes().getTeamId();
                    String teamFoldersEndpoint = properties.getApiUrl() + "/teams/" + teamId + "/teamfolders";
                    try {
                        ZohoWorkDriveResponse tfResponse = apiClient.get(teamFoldersEndpoint, ZohoWorkDriveResponse.class);
                        if (tfResponse != null && tfResponse.getData() != null && !tfResponse.getData().isEmpty()) {
                            for (ZohoWorkDriveResponse.WorkDriveItem item : tfResponse.getData()) {
                                String name = item.getAttributes() != null ? item.getAttributes().getName() : "";
                                if ("TestSandbox".equalsIgnoreCase(name)) {
                                    log.info("Resolved Team Folder ID: {} (Team Folder Name: '{}')", item.getId(), name);
                                    return item.getId();
                                }
                            }
                            String fallbackTfId = tfResponse.getData().get(0).getId();
                            String fallbackName = tfResponse.getData().get(0).getAttributes() != null ? tfResponse.getData().get(0).getAttributes().getName() : "Unknown";
                            log.info("Resolved Team Folder ID: {} (Team Folder Name: '{}')", fallbackTfId, fallbackName);
                            return fallbackTfId;
                        }
                    } catch (Exception tfEx) {
                        log.warn("Could not list teamfolders via WorkDrive API for teamId {}: {}. Falling back to teamId.", teamId, tfEx.getMessage());
                    }
                    log.info("Resolved Team Folder ID: {} (Team ID)", teamId);
                    return teamId;
                }
            }
        } catch (Exception ex) {
            log.warn("Could not dynamically resolve team folder ID via WorkDrive API: {}. Utilizing standard configured team folder ID.", ex.getMessage());
        }
        log.info("Resolved Team Folder ID: {} (default)", DEFAULT_TEAM_FOLDER_ID);
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

    private boolean isBuyerKycDocument(Document doc) {
        if (doc == null) return false;
        if (doc.getKycApplication() != null) return true;
        if (doc.getCategory() == com.goodearth.postsales.document.entity.DocumentCategory.KYC) return true;
        DocumentType type = doc.getDocumentType();
        return type == DocumentType.PAN_CARD
                || type == DocumentType.AADHAAR_CARD
                || type == DocumentType.PASSPORT
                || type == DocumentType.ADDRESS_PROOF
                || type == DocumentType.VOTER_ID
                || type == DocumentType.BOOKING_FORM
                || type == DocumentType.AGREEMENT;
    }

    private void syncSingleWorkDriveFile(ZohoWorkDriveResponse.WorkDriveItem item, WorkDriveFolder folder, Workflow workflow, String parentFolderId) {
        String fileId = item.getId();
        String fileName = item.getAttributes() != null && item.getAttributes().getName() != null ? item.getAttributes().getName() : "Drawing_Plan.pdf";
        String mimeType = item.getResolvedMimeType();

        DocumentType determinedType = determineDocumentType(fileName, parentFolderId, folder);
        log.info("Syncing WorkDrive file: {} (ID: {}, DocumentType: {}, Parent Folder: {})", fileName, fileId, determinedType, parentFolderId);

        List<Document> existingDocs = documentRepository.findByWorkflowId(workflow.getId());
        Document doc = existingDocs.stream()
                .filter(d -> !isBuyerKycDocument(d))
                .filter(d -> fileId.equalsIgnoreCase(d.getWorkDriveFileId()))
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
        }
        return DocumentType.DOCUMENT;
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

                String realPreviewUrl = "https://workdrive.zoho.com/file/preview/" + file.getFileId();
                String realDownloadUrl = "https://workdrive.zoho.com/file/download/" + file.getFileId();

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
                    : "https://workdrive.zoho.com/file/preview/" + file.getFileId();

            String downloadUrl = (attrs != null && attrs.getDownloadUrl() != null && !attrs.getDownloadUrl().isBlank())
                    ? attrs.getDownloadUrl()
                    : "https://workdrive.zoho.com/file/download/" + file.getFileId();

            version.setPreviewUrl(previewUrl);
            version.setDownloadUrl(downloadUrl);
            version.setUploadedBy(attrs != null && attrs.getUploadedBy() != null ? attrs.getUploadedBy() : "system");
            version.setUploadedAt(LocalDateTime.now());
            versionRepository.save(version);
            log.info("Synced version 1 of WorkDrive file {} (Preview: {})", file.getFileName(), previewUrl);
        }
    }
}
