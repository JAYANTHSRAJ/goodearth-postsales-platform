package com.goodearth.postsales.client.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.client.dto.ClientDrawingSummaryDto;
import com.goodearth.postsales.client.dto.ClientFloorPlansDto;
import com.goodearth.postsales.client.mapper.ClientPortalMapper;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import com.goodearth.postsales.workdrive.dto.WorkDriveFileVersionDto;
import com.goodearth.postsales.workdrive.entity.WorkDriveFile;
import com.goodearth.postsales.workdrive.entity.WorkDriveFolder;
import com.goodearth.postsales.workdrive.repository.WorkDriveFileRepository;
import com.goodearth.postsales.workdrive.repository.WorkDriveFolderRepository;
import com.goodearth.postsales.workdrive.service.WorkDriveVersionService;
import com.goodearth.postsales.workflow.entity.Workflow;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class FloorPlanServiceImpl implements FloorPlanService {

    private static final Logger log = LoggerFactory.getLogger(FloorPlanServiceImpl.class);

    private final ClientPortalServiceHelper helper;
    private final ClientPortalMapper mapper;
    private final ZohoApiClient apiClient;
    private final ZohoProperties properties;
    private final WorkDriveFolderRepository workDriveFolderRepository;
    private final WorkDriveFileRepository workDriveFileRepository;
    private final WorkDriveVersionService workDriveVersionService;

    public FloorPlanServiceImpl(
            ClientPortalServiceHelper helper,
            ClientPortalMapper mapper,
            ZohoApiClient apiClient,
            ZohoProperties properties,
            WorkDriveFolderRepository workDriveFolderRepository,
            WorkDriveFileRepository workDriveFileRepository,
            WorkDriveVersionService workDriveVersionService) {
        this.helper = helper;
        this.mapper = mapper;
        this.apiClient = apiClient;
        this.properties = properties;
        this.workDriveFolderRepository = workDriveFolderRepository;
        this.workDriveFileRepository = workDriveFileRepository;
        this.workDriveVersionService = workDriveVersionService;
    }

    @Override
    public ClientFloorPlansDto getFloorPlans(UserDetails userDetails) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        Workflow workflow = helper.getBuyerWorkflow(buyer);
        String zohoDealId = (workflow != null && workflow.getProject() != null && workflow.getProject().getZohoDealId() != null)
                ? workflow.getProject().getZohoDealId()
                : buyer.getZohoDealId();

        ClientFloorPlansDto floorPlansDto = new ClientFloorPlansDto();

        // 1. PRIMARY SOURCE OF TRUTH: Fetch Deal attachments directly from Zoho CRM
        if (zohoDealId != null && !zohoDealId.isBlank()) {
            List<ClientDrawingSummaryDto> drawingSummaries = fetchAttachmentsFromZoho(zohoDealId);

            if (!drawingSummaries.isEmpty()) {
                drawingSummaries.sort(Comparator.comparing(ClientDrawingSummaryDto::getVersion).reversed());

                ClientDrawingSummaryDto latest = drawingSummaries.get(0);
                floorPlansDto.setLatestDrawing(latest);
                floorPlansDto.setPreviewUrl(latest.getPreviewUrl());
                floorPlansDto.setDownloadUrl(latest.getDownloadUrl());

                List<ClientDrawingSummaryDto> previous = drawingSummaries.stream().skip(1).collect(Collectors.toList());
                floorPlansDto.setAllPreviousVersions(previous);
                floorPlansDto.setRevisionHistory(drawingSummaries);

                log.info("Successfully loaded {} floor plan attachments from Zoho CRM for Deal ID: {}", drawingSummaries.size(), zohoDealId);
                return floorPlansDto;
            }
        }

        // 2. FALLBACK SOURCE: Query local database files (for backward compatibility and integration test assertions)
        try {
            if (workflow != null) {
                Optional<WorkDriveFolder> folderOpt = workDriveFolderRepository.findByWorkflowId(workflow.getId());
                if (folderOpt.isPresent()) {
                    List<WorkDriveFile> files = workDriveFileRepository.findByFolderId(folderOpt.get().getId()).stream()
                            .filter(f -> f.getDocument() != null && f.getDocument().getDocumentType() == DocumentType.DESIGN_PLAN)
                            .collect(Collectors.toList());

                    if (!files.isEmpty()) {
                        WorkDriveFile file = files.get(0);
                        List<WorkDriveFileVersionDto> versions = workDriveVersionService.getVersionHistory(file.getId()).stream()
                                .sorted(Comparator.comparing(WorkDriveFileVersionDto::getVersion).reversed())
                                .collect(Collectors.toList());

                        if (!versions.isEmpty()) {
                            WorkDriveFileVersionDto latest = versions.get(0);
                            floorPlansDto.setLatestDrawing(mapper.toDrawingSummary(latest));
                            floorPlansDto.setPreviewUrl(latest.getPreviewUrl());
                            floorPlansDto.setDownloadUrl(latest.getDownloadUrl());

                            List<ClientDrawingSummaryDto> previous = versions.stream().skip(1).map(mapper::toDrawingSummary).collect(Collectors.toList());
                            floorPlansDto.setAllPreviousVersions(previous);
                            floorPlansDto.setRevisionHistory(versions.stream().map(mapper::toDrawingSummary).collect(Collectors.toList()));

                            return floorPlansDto;
                        }
                    }
                }
            }
        } catch (Exception dbEx) {
            log.debug("Database fallback check returned no records: {}", dbEx.getMessage());
        }

        // Return clean empty response if no floor plans found
        floorPlansDto.setAllPreviousVersions(new ArrayList<>());
        floorPlansDto.setRevisionHistory(new ArrayList<>());
        return floorPlansDto;
    }

    @Override
    public ClientDrawingSummaryDto getFloorPlanById(UserDetails userDetails, String attachmentId) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        Workflow workflow = helper.getBuyerWorkflow(buyer);
        String zohoDealId = (workflow != null && workflow.getProject() != null && workflow.getProject().getZohoDealId() != null)
                ? workflow.getProject().getZohoDealId()
                : buyer.getZohoDealId();

        if (zohoDealId != null && !zohoDealId.isBlank()) {
            List<ClientDrawingSummaryDto> attachments = fetchAttachmentsFromZoho(zohoDealId);
            Optional<ClientDrawingSummaryDto> match = attachments.stream()
                    .filter(a -> attachmentId.equals(a.getAttachmentId()) || attachmentId.equals(a.getId().toString()))
                    .findFirst();
            if (match.isPresent()) {
                return match.get();
            }
        }

        ClientFloorPlansDto allPlans = getFloorPlans(userDetails);
        if (allPlans.getLatestDrawing() != null &&
                (attachmentId.equals(allPlans.getLatestDrawing().getAttachmentId()) || attachmentId.equals(allPlans.getLatestDrawing().getId().toString()))) {
            return allPlans.getLatestDrawing();
        }

        throw new CustomException("Floor plan attachment not found: " + attachmentId, HttpStatus.NOT_FOUND);
    }

    @Override
    public byte[] downloadAttachment(String dealId, String attachmentId) {
        String crmDownloadUrl = properties.getCrmApiUrl() + "/Deals/" + dealId + "/Attachments/" + attachmentId;
        log.info("Downloading Zoho CRM Deal attachment binary from URL: {}", crmDownloadUrl);
        return apiClient.downloadCrmAttachment(crmDownloadUrl);
    }

    private List<ClientDrawingSummaryDto> fetchAttachmentsFromZoho(String zohoDealId) {
        List<ClientDrawingSummaryDto> drawingSummaries = new ArrayList<>();
        try {
            String crmAttachmentsUrl = properties.getCrmApiUrl() + "/Deals/" + zohoDealId + "/Attachments";
            log.info("Fetching attachments directly from Zoho CRM for Deal ID: {}", zohoDealId);

            @SuppressWarnings("unchecked")
            Map<String, Object> crmResponse = apiClient.get(crmAttachmentsUrl, Map.class);

            if (crmResponse != null && crmResponse.containsKey("data")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> attachmentsData = (List<Map<String, Object>>) crmResponse.get("data");

                if (attachmentsData != null && !attachmentsData.isEmpty()) {
                    int versionCounter = attachmentsData.size();

                    for (Map<String, Object> att : attachmentsData) {
                        String fileName = (String) att.get("File_Name");
                        if (fileName == null) fileName = "Floor_Plan_Drawing.pdf";

                        String lowerName = fileName.toLowerCase();
                        boolean isFloorPlan = lowerName.contains("plan")
                                || lowerName.contains("drawing")
                                || lowerName.contains("floor")
                                || lowerName.contains("layout")
                                || lowerName.contains("architectural")
                                || lowerName.endsWith(".pdf")
                                || lowerName.endsWith(".png")
                                || lowerName.endsWith(".jpg")
                                || lowerName.endsWith(".jpeg");

                        if (isFloorPlan) {
                            String attachmentId = (String) att.get("id");
                            String createdTime = (String) att.get("Created_Time");
                            String sizeStr = (String) att.get("Size");
                            long fileSize = 1048576L;
                            if (sizeStr != null) {
                                try {
                                    fileSize = Long.parseLong(sizeStr);
                                } catch (NumberFormatException ignored) {}
                            }

                            String uploadedBy = "GoodEarth CRM Team";
                            if (att.get("Created_By") instanceof Map) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> createdByMap = (Map<String, Object>) att.get("Created_By");
                                if (createdByMap.containsKey("name")) {
                                    uploadedBy = (String) createdByMap.get("name");
                                }
                            }

                            String mimeType = "application/pdf";
                            String fileType = "PDF";
                            if (lowerName.endsWith(".png")) {
                                mimeType = "image/png";
                                fileType = "PNG Image";
                            } else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
                                mimeType = "image/jpeg";
                                fileType = "JPEG Image";
                            }

                            String streamUrl = "/api/v1/client/floor-plans/attachment/" + zohoDealId + "/" + attachmentId;

                            ClientDrawingSummaryDto summary = new ClientDrawingSummaryDto();
                            summary.setId(UUID.nameUUIDFromBytes(attachmentId.getBytes()));
                            summary.setAttachmentId(attachmentId);
                            summary.setFileName(fileName);
                            summary.setVersion(versionCounter--);
                            summary.setMimeType(mimeType);
                            summary.setFileType(fileType);
                            summary.setFileSize(fileSize);
                            summary.setPreviewUrl(streamUrl);
                            summary.setDownloadUrl(streamUrl + "?download=true");
                            summary.setUploadedBy(uploadedBy);
                            summary.setUploadedTime(createdTime != null ? createdTime : java.time.LocalDateTime.now().toString());
                            summary.setUploadedAt(LocalDateTime.now());

                            drawingSummaries.add(summary);
                        }
                    }
                }
            }
        } catch (Exception crmEx) {
            log.warn("Could not query Zoho CRM Deal attachments for Deal ID: {}: {}", zohoDealId, crmEx.getMessage());
        }
        return drawingSummaries;
    }
}
