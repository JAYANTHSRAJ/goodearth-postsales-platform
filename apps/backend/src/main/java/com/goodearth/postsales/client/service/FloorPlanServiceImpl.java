package com.goodearth.postsales.client.service;

import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.client.dto.ClientDrawingSummaryDto;
import com.goodearth.postsales.client.dto.ClientFloorPlansDto;
import com.goodearth.postsales.client.mapper.ClientPortalMapper;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.document.entity.DocumentType;
import com.goodearth.postsales.workdrive.dto.WorkDriveFileVersionDto;
import com.goodearth.postsales.workdrive.entity.WorkDriveFile;
import com.goodearth.postsales.workdrive.entity.WorkDriveFolder;
import com.goodearth.postsales.workdrive.repository.WorkDriveFileRepository;
import com.goodearth.postsales.workdrive.repository.WorkDriveFolderRepository;
import com.goodearth.postsales.workdrive.service.WorkDriveSyncService;
import com.goodearth.postsales.workdrive.service.WorkDriveVersionService;
import com.goodearth.postsales.workflow.entity.Workflow;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class FloorPlanServiceImpl implements FloorPlanService {

    private static final Logger log = LoggerFactory.getLogger(FloorPlanServiceImpl.class);

    private final ClientPortalServiceHelper helper;
    private final ClientPortalMapper mapper;
    private final WorkDriveFolderRepository workDriveFolderRepository;
    private final WorkDriveFileRepository workDriveFileRepository;
    private final WorkDriveVersionService workDriveVersionService;
    private final WorkDriveSyncService workDriveSyncService;

    public FloorPlanServiceImpl(
            ClientPortalServiceHelper helper,
            ClientPortalMapper mapper,
            WorkDriveFolderRepository workDriveFolderRepository,
            WorkDriveFileRepository workDriveFileRepository,
            WorkDriveVersionService workDriveVersionService,
            WorkDriveSyncService workDriveSyncService) {
        this.helper = helper;
        this.mapper = mapper;
        this.workDriveFolderRepository = workDriveFolderRepository;
        this.workDriveFileRepository = workDriveFileRepository;
        this.workDriveVersionService = workDriveVersionService;
        this.workDriveSyncService = workDriveSyncService;
    }

    @Override
    public ClientFloorPlansDto getFloorPlans(UserDetails userDetails) {
        Buyer buyer = helper.getAuthenticatedBuyer(userDetails);
        Workflow workflow = helper.getBuyerWorkflow(buyer);
        UUID workflowId = workflow.getId();
        String bookingId = buyer.getZohoDealId() != null ? buyer.getZohoDealId() : "DEFAULT";

        ClientFloorPlansDto floorPlansDto = new ClientFloorPlansDto();

        // 1. If synchronization has never been performed, automatically execute syncFolder() followed by syncFiles()
        Optional<WorkDriveFolder> folderOpt = workDriveFolderRepository.findByWorkflowId(workflowId);
        if (folderOpt.isEmpty() || workDriveFileRepository.findByFolderId(folderOpt.get().getId()).isEmpty()) {
            try {
                log.info("Automatic WorkDrive synchronization triggered for workflow ID: {}, Booking ID: {}", workflowId, bookingId);
                workDriveSyncService.syncFolder(workflowId);
                workDriveSyncService.syncFiles(workflowId);
                folderOpt = workDriveFolderRepository.findByWorkflowId(workflowId);
            } catch (CustomException ce) {
                log.error("WorkDrive sync failed for workflow ID: {}, Booking ID: {}, Error: {}", workflowId, bookingId, ce.getMessage());
                throw ce;
            } catch (Exception syncEx) {
                log.error("WorkDrive sync encountered unexpected failure - Folder ID: {}, Workflow ID: {}, Booking ID: {}, Error: {}",
                        folderOpt.map(f -> f.getId().toString()).orElse("N/A"), workflowId, bookingId, syncEx.getMessage(), syncEx);
                throw new CustomException("WorkDrive sync failed for workflow " + workflowId + ": " + syncEx.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, syncEx);
            }
        }

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

                    List<ClientDrawingSummaryDto> previous = versions.stream()
                            .skip(1)
                            .map(mapper::toDrawingSummary)
                            .collect(Collectors.toList());
                    floorPlansDto.setAllPreviousVersions(previous);
                    floorPlansDto.setRevisionHistory(versions.stream().map(mapper::toDrawingSummary).collect(Collectors.toList()));

                    return floorPlansDto;
                }
            }
        }

        // Return clean empty response if WorkDrive contains no drawings
        floorPlansDto.setAllPreviousVersions(new ArrayList<>());
        floorPlansDto.setRevisionHistory(new ArrayList<>());
        return floorPlansDto;
    }
}
