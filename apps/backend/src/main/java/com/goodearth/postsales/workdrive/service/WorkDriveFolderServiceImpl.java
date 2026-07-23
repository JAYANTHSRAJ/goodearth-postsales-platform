package com.goodearth.postsales.workdrive.service;

import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.workdrive.dto.WorkDriveFolderDto;
import com.goodearth.postsales.workdrive.entity.WorkDriveFolder;
import com.goodearth.postsales.workdrive.mapper.WorkDriveMapper;
import com.goodearth.postsales.workdrive.repository.WorkDriveFolderRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class WorkDriveFolderServiceImpl implements WorkDriveFolderService {

    private static final Logger log = LoggerFactory.getLogger(WorkDriveFolderServiceImpl.class);

    private final WorkDriveFolderRepository folderRepository;
    private final WorkflowRepository workflowRepository;
    private final WorkDriveMapper mapper;
    private final ZohoApiClient zohoApiClient;

    public WorkDriveFolderServiceImpl(
            WorkDriveFolderRepository folderRepository,
            WorkflowRepository workflowRepository,
            WorkDriveMapper mapper,
            ZohoApiClient zohoApiClient) {
        this.folderRepository = folderRepository;
        this.workflowRepository = workflowRepository;
        this.mapper = mapper;
        this.zohoApiClient = zohoApiClient;
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

    @Override
    @Transactional
    public WorkDriveFolder getOrCreateBookingFolder(String bookingId) {
        Optional<WorkDriveFolder> existingOpt = folderRepository.findByBookingId(bookingId);
        if (existingOpt.isPresent()) {
            return existingOpt.get();
        }

        log.info("Creating WorkDrive folder hierarchy for Booking ID: {}", bookingId);

        WorkDriveFolder folder = new WorkDriveFolder();
        folder.setBookingId(bookingId);
        folder.setProjectFolderId("wd_proj_goodearth_root");
        folder.setBookingFolderId("WD-FLDR-BOOKING-" + bookingId);
        folder.setKycSubfolderId("WD-FLDR-KYC-" + bookingId);
        folder.setAgreementsSubfolderId("WD-FLDR-AGR-" + bookingId);
        folder.setPaymentsSubfolderId("WD-FLDR-PAY-" + bookingId);
        folder.setHandoverSubfolderId("WD-FLDR-HND-" + bookingId);

        folder.setFolderId("WD-FLDR-BOOKING-" + bookingId);
        folder.setFolderName("Booking_" + bookingId + "_Documents");

        WorkDriveFolder savedFolder = folderRepository.save(folder);
        log.info("Successfully provisioned WorkDrive folder hierarchy for Booking ID: {}", bookingId);

        return savedFolder;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkDriveFolderDto getFolderByBooking(String bookingId) {
        WorkDriveFolder folder = folderRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new CustomException("WorkDrive folder hierarchy not found for Booking ID: " + bookingId, HttpStatus.NOT_FOUND));
        return mapper.toDto(folder);
    }
}
