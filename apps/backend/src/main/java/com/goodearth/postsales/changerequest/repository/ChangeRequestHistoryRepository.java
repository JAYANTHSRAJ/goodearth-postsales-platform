package com.goodearth.postsales.changerequest.repository;

import com.goodearth.postsales.changerequest.entity.ChangeRequestHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChangeRequestHistoryRepository extends JpaRepository<ChangeRequestHistory, UUID> {
    List<ChangeRequestHistory> findByChangeRequestIdOrderByCreatedAtAsc(UUID changeRequestId);
}
