package com.goodearth.postsales.changerequest.service;

import com.goodearth.postsales.changerequest.dto.ChangeRequestHistoryDto;
import com.goodearth.postsales.changerequest.entity.ChangeRequest;
import com.goodearth.postsales.changerequest.entity.ChangeRequestHistory;
import com.goodearth.postsales.changerequest.entity.ChangeRequestStatus;
import com.goodearth.postsales.changerequest.mapper.ChangeRequestMapper;
import com.goodearth.postsales.changerequest.repository.ChangeRequestHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class HistoryServiceImpl implements HistoryService {

    private final ChangeRequestHistoryRepository historyRepository;
    private final ChangeRequestMapper mapper;

    public HistoryServiceImpl(ChangeRequestHistoryRepository historyRepository, ChangeRequestMapper mapper) {
        this.historyRepository = historyRepository;
        this.mapper = mapper;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void logAction(ChangeRequest changeRequest, String action, String performedBy,
                          ChangeRequestStatus oldStatus, ChangeRequestStatus newStatus, String remarks) {
        ChangeRequestHistory history = new ChangeRequestHistory();
        history.setChangeRequest(changeRequest);
        history.setAction(action);
        history.setPerformedBy(performedBy);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setRemarks(remarks);
        historyRepository.save(history);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChangeRequestHistoryDto> getHistory(UUID changeRequestId) {
        return historyRepository.findByChangeRequestIdOrderByCreatedAtAsc(changeRequestId).stream()
                .map(mapper::toHistoryDto)
                .collect(Collectors.toList());
    }
}
