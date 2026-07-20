package com.goodearth.postsales.changerequest.service;

import com.goodearth.postsales.changerequest.dto.ChangeRequestDto;
import com.goodearth.postsales.changerequest.entity.Priority;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ChangeRequestService {
    ChangeRequestDto createRequest(UUID workflowId, UUID documentId, String annotationId, String requestedBy, Priority priority, String remarks);
    ChangeRequestDto assignRequest(UUID id, String assignee, String remarks, String actor);
    ChangeRequestDto approveRequest(UUID id, String remarks, String actor);
    ChangeRequestDto rejectRequest(UUID id, String remarks, String actor);
    ChangeRequestDto needClarification(UUID id, String remarks, String actor);
    ChangeRequestDto uploadRevisedDrawing(UUID id, String workDriveFileId, BigDecimal estimatedCost, LocalDateTime completionDate, String remarks, String actor);
    ChangeRequestDto confirmFinancePrice(UUID id, String remarks, String actor);
    ChangeRequestDto publishQuotation(UUID id, String remarks, String actor);
    ChangeRequestDto approveQuotation(UUID id, String remarks, String actor);
    ChangeRequestDto rejectQuotation(UUID id, String remarks, String actor);
    ChangeRequestDto getRequest(UUID id);
    List<ChangeRequestDto> getRequestsByWorkflow(UUID workflowId);
    List<ChangeRequestDto> listRequests();
}
