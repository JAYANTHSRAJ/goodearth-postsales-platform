package com.goodearth.postsales.changerequest.service;

import com.goodearth.postsales.changerequest.dto.ChangeRequestHistoryDto;
import com.goodearth.postsales.changerequest.entity.ChangeRequest;
import com.goodearth.postsales.changerequest.entity.ChangeRequestStatus;

import java.util.List;
import java.util.UUID;

public interface HistoryService {
    void logAction(ChangeRequest changeRequest, String action, String performedBy, ChangeRequestStatus oldStatus, ChangeRequestStatus newStatus, String remarks);
    List<ChangeRequestHistoryDto> getHistory(UUID changeRequestId);
}
