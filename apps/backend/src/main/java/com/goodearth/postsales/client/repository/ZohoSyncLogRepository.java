package com.goodearth.postsales.client.repository;

import com.goodearth.postsales.client.entity.ZohoSyncLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ZohoSyncLogRepository extends JpaRepository<ZohoSyncLog, UUID> {
    List<ZohoSyncLog> findByZohoDealIdOrderByCreatedAtDesc(String zohoDealId);
    List<ZohoSyncLog> findBySyncStatus(String syncStatus);
}
