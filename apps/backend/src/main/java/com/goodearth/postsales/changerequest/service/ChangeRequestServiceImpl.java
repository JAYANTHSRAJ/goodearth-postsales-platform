package com.goodearth.postsales.changerequest.service;

import com.goodearth.postsales.changerequest.dto.ChangeRequestDto;
import com.goodearth.postsales.changerequest.entity.ChangeRequest;
import com.goodearth.postsales.changerequest.entity.ChangeRequestStatus;
import com.goodearth.postsales.changerequest.entity.Priority;
import com.goodearth.postsales.changerequest.mapper.ChangeRequestMapper;
import com.goodearth.postsales.changerequest.repository.ChangeRequestRepository;
import com.goodearth.postsales.document.entity.Document;
import com.goodearth.postsales.document.repository.DocumentRepository;
import com.goodearth.postsales.workflow.entity.Workflow;
import com.goodearth.postsales.workflow.repository.WorkflowRepository;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ChangeRequestServiceImpl implements ChangeRequestService {

    private final ChangeRequestRepository repository;
    private final WorkflowRepository workflowRepository;
    private final DocumentRepository documentRepository;
    private final HistoryService historyService;
    private final ChangeRequestMapper mapper;

    public ChangeRequestServiceImpl(
            ChangeRequestRepository repository,
            WorkflowRepository workflowRepository,
            DocumentRepository documentRepository,
            HistoryService historyService,
            ChangeRequestMapper mapper) {
        this.repository = repository;
        this.workflowRepository = workflowRepository;
        this.documentRepository = documentRepository;
        this.historyService = historyService;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public ChangeRequestDto createRequest(UUID workflowId, UUID documentId, String annotationId,
                                         String requestedBy, Priority priority, String remarks) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new CustomException("Workflow not found.", HttpStatus.NOT_FOUND));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new CustomException("Document not found.", HttpStatus.NOT_FOUND));

        ChangeRequest cr = new ChangeRequest();
        cr.setWorkflow(workflow);
        cr.setDocument(document);
        cr.setAnnotationId(annotationId);
        cr.setRequestedBy(requestedBy);
        cr.setStatus(ChangeRequestStatus.PENDING_CRM_REVIEW);
        cr.setPriority(priority != null ? priority : Priority.MEDIUM);
        cr.setRemarks(remarks);

        ChangeRequest savedCr = repository.save(cr);
        historyService.logAction(savedCr, "CREATE", requestedBy, null, ChangeRequestStatus.PENDING_CRM_REVIEW, remarks);

        return mapper.toDto(savedCr);
    }

    @Override
    @Transactional
    public ChangeRequestDto assignRequest(UUID id, String assignee, String remarks, String actor) {
        ChangeRequest cr = repository.findById(id)
                .orElseThrow(() -> new CustomException("Change request not found.", HttpStatus.NOT_FOUND));

        ChangeRequestStatus oldStatus = cr.getStatus();
        cr.setAssignedTo(assignee);
        cr.setStatus(ChangeRequestStatus.UNDER_DESIGN_REVIEW);
        cr.setRemarks(remarks);

        ChangeRequest savedCr = repository.save(cr);
        historyService.logAction(savedCr, "ASSIGN", actor, oldStatus, ChangeRequestStatus.UNDER_DESIGN_REVIEW, "Assigned to: " + assignee + ". Remarks: " + remarks);

        return mapper.toDto(savedCr);
    }

    @Override
    @Transactional
    public ChangeRequestDto approveRequest(UUID id, String remarks, String actor) {
        ChangeRequest cr = repository.findById(id)
                .orElseThrow(() -> new CustomException("Change request not found.", HttpStatus.NOT_FOUND));

        ChangeRequestStatus oldStatus = cr.getStatus();
        cr.setStatus(ChangeRequestStatus.ACCEPTED);
        cr.setRemarks(remarks);

        ChangeRequest savedCr = repository.save(cr);
        historyService.logAction(savedCr, "APPROVE", actor, oldStatus, ChangeRequestStatus.ACCEPTED, remarks);

        return mapper.toDto(savedCr);
    }

    @Override
    @Transactional
    public ChangeRequestDto rejectRequest(UUID id, String remarks, String actor) {
        ChangeRequest cr = repository.findById(id)
                .orElseThrow(() -> new CustomException("Change request not found.", HttpStatus.NOT_FOUND));

        ChangeRequestStatus oldStatus = cr.getStatus();
        cr.setStatus(ChangeRequestStatus.REJECTED);
        cr.setRemarks(remarks);

        ChangeRequest savedCr = repository.save(cr);
        historyService.logAction(savedCr, "REJECT", actor, oldStatus, ChangeRequestStatus.REJECTED, remarks);

        return mapper.toDto(savedCr);
    }

    @Override
    @Transactional
    public ChangeRequestDto needClarification(UUID id, String remarks, String actor) {
        ChangeRequest cr = repository.findById(id)
                .orElseThrow(() -> new CustomException("Change request not found.", HttpStatus.NOT_FOUND));

        ChangeRequestStatus oldStatus = cr.getStatus();
        cr.setStatus(ChangeRequestStatus.NEEDS_CLARIFICATION);
        cr.setRemarks(remarks);

        ChangeRequest savedCr = repository.save(cr);
        historyService.logAction(savedCr, "NEED_CLARIFICATION", actor, oldStatus, ChangeRequestStatus.NEEDS_CLARIFICATION, remarks);

        return mapper.toDto(savedCr);
    }

    @Override
    @Transactional
    public ChangeRequestDto uploadRevisedDrawing(UUID id, String workDriveFileId, BigDecimal estimatedCost,
                                                 LocalDateTime completionDate, String remarks, String actor) {
        ChangeRequest cr = repository.findById(id)
                .orElseThrow(() -> new CustomException("Change request not found.", HttpStatus.NOT_FOUND));

        if (cr.getStatus() != ChangeRequestStatus.ACCEPTED) {
            throw new CustomException("Change request must be ACCEPTED before uploading revised drawing.", HttpStatus.BAD_REQUEST);
        }

        ChangeRequestStatus oldStatus = cr.getStatus();
        cr.setWorkDriveFileId(workDriveFileId);
        cr.setEstimatedCost(estimatedCost);
        cr.setEstimatedCompletionDate(completionDate);
        cr.setStatus(ChangeRequestStatus.AWAITING_FINANCE_APPROVAL);
        cr.setRemarks(remarks);

        ChangeRequest savedCr = repository.save(cr);
        historyService.logAction(savedCr, "UPLOAD_REVISED_DRAWING", actor, oldStatus, ChangeRequestStatus.AWAITING_FINANCE_APPROVAL,
                "File ID: " + workDriveFileId + ". Cost: " + estimatedCost + ". Remarks: " + remarks);

        return mapper.toDto(savedCr);
    }

    @Override
    @Transactional
    public ChangeRequestDto confirmFinancePrice(UUID id, String remarks, String actor) {
        ChangeRequest cr = repository.findById(id)
                .orElseThrow(() -> new CustomException("Change request not found.", HttpStatus.NOT_FOUND));

        if (cr.getStatus() != ChangeRequestStatus.AWAITING_FINANCE_APPROVAL) {
            throw new CustomException("Change request must be awaiting finance approval.", HttpStatus.BAD_REQUEST);
        }

        ChangeRequestStatus oldStatus = cr.getStatus();
        cr.setStatus(ChangeRequestStatus.QUOTATION_PUBLISHED);
        cr.setRemarks(remarks);

        ChangeRequest savedCr = repository.save(cr);
        historyService.logAction(savedCr, "CONFIRM_FINANCE_PRICE", actor, oldStatus, ChangeRequestStatus.QUOTATION_PUBLISHED, remarks);

        return mapper.toDto(savedCr);
    }

    @Override
    @Transactional
    public ChangeRequestDto publishQuotation(UUID id, String remarks, String actor) {
        ChangeRequest cr = repository.findById(id)
                .orElseThrow(() -> new CustomException("Change request not found.", HttpStatus.NOT_FOUND));

        ChangeRequestStatus oldStatus = cr.getStatus();
        cr.setStatus(ChangeRequestStatus.QUOTATION_PUBLISHED);
        cr.setRemarks(remarks);

        ChangeRequest savedCr = repository.save(cr);
        historyService.logAction(savedCr, "PUBLISH_QUOTATION", actor, oldStatus, ChangeRequestStatus.QUOTATION_PUBLISHED, remarks);

        return mapper.toDto(savedCr);
    }

    @Override
    @Transactional
    public ChangeRequestDto approveQuotation(UUID id, String remarks, String actor) {
        ChangeRequest cr = repository.findById(id)
                .orElseThrow(() -> new CustomException("Change request not found.", HttpStatus.NOT_FOUND));

        if (cr.getStatus() != ChangeRequestStatus.QUOTATION_PUBLISHED) {
            throw new CustomException("Quotation must be published before approval.", HttpStatus.BAD_REQUEST);
        }

        ChangeRequestStatus oldStatus = cr.getStatus();
        cr.setStatus(ChangeRequestStatus.QUOTATION_ACCEPTED);
        cr.setRemarks(remarks);

        ChangeRequest savedCr = repository.save(cr);
        historyService.logAction(savedCr, "APPROVE_QUOTATION", actor, oldStatus, ChangeRequestStatus.QUOTATION_ACCEPTED, remarks);

        return mapper.toDto(savedCr);
    }

    @Override
    @Transactional
    public ChangeRequestDto rejectQuotation(UUID id, String remarks, String actor) {
        ChangeRequest cr = repository.findById(id)
                .orElseThrow(() -> new CustomException("Change request not found.", HttpStatus.NOT_FOUND));

        if (cr.getStatus() != ChangeRequestStatus.QUOTATION_PUBLISHED) {
            throw new CustomException("Quotation must be published before rejection.", HttpStatus.BAD_REQUEST);
        }

        ChangeRequestStatus oldStatus = cr.getStatus();
        cr.setStatus(ChangeRequestStatus.QUOTATION_REJECTED);
        cr.setRemarks(remarks);

        ChangeRequest savedCr = repository.save(cr);
        historyService.logAction(savedCr, "REJECT_QUOTATION", actor, oldStatus, ChangeRequestStatus.QUOTATION_REJECTED, remarks);

        return mapper.toDto(savedCr);
    }

    @Override
    @Transactional(readOnly = true)
    public ChangeRequestDto getRequest(UUID id) {
        ChangeRequest cr = repository.findById(id)
                .orElseThrow(() -> new CustomException("Change request not found.", HttpStatus.NOT_FOUND));
        return mapper.toDto(cr);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChangeRequestDto> getRequestsByWorkflow(UUID workflowId) {
        return repository.findByWorkflowId(workflowId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChangeRequestDto> listRequests() {
        return repository.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }
}
