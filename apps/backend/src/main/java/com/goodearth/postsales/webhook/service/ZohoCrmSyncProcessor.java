package com.goodearth.postsales.webhook.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.buyer.service.ZohoBuyerSyncService;
import com.goodearth.postsales.notification.event.NotificationEvents;
import com.goodearth.postsales.project.repository.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
public class ZohoCrmSyncProcessor {

    private static final Logger log = LoggerFactory.getLogger(ZohoCrmSyncProcessor.class);

    private final BuyerRepository buyerRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final ZohoBuyerSyncService syncService;
    private final com.goodearth.postsales.workdrive.service.WorkDriveSyncService workDriveSyncService;

    public ZohoCrmSyncProcessor(
            BuyerRepository buyerRepository,
            ProjectRepository projectRepository,
            ObjectMapper objectMapper,
            ApplicationEventPublisher eventPublisher,
            ZohoBuyerSyncService syncService,
            com.goodearth.postsales.workdrive.service.WorkDriveSyncService workDriveSyncService) {
        this.buyerRepository = buyerRepository;
        this.projectRepository = projectRepository;
        this.objectMapper = objectMapper;
        this.eventPublisher = eventPublisher;
        this.syncService = syncService;
        this.workDriveSyncService = workDriveSyncService;
    }

    public void process(String eventType, String payload, UUID correlationId) throws Exception {
        log.info("[CorrelationId: {}] Processing Zoho CRM webhook event of type: {}", correlationId, eventType);
        Map<String, Object> data = objectMapper.readValue(payload, new TypeReference<Map<String, Object>>() {});

        if ("contacts".equalsIgnoreCase(eventType)) {
            syncContact(data, correlationId);
        } else if ("deals".equalsIgnoreCase(eventType) || "deal".equalsIgnoreCase(eventType)) {
            syncDeal(data, correlationId);
        } else if ("notes".equalsIgnoreCase(eventType) || "tasks".equalsIgnoreCase(eventType)) {
            log.info("[CorrelationId: {}] Zoho CRM note/task event logged successfully.", correlationId);
        } else {
            log.warn("[CorrelationId: {}] Unknown CRM event type: {}", correlationId, eventType);
        }
    }

    private void syncContact(Map<String, Object> data, UUID correlationId) {
        String email = (String) data.get("Email");
        if (email == null || email.isBlank()) {
            log.warn("[CorrelationId: {}] Cannot sync contact: email is missing.", correlationId);
            return;
        }

        String firstName = (String) data.get("First_Name");
        String lastName = (String) data.get("Last_Name");
        String name = (firstName != null ? firstName : "") + (lastName != null ? " " + lastName : "");
        if (name.isBlank()) name = "Zoho Contact";

        String phone = (String) data.get("Phone");
        String contactId = (String) data.get("Contact_Id");
        if (contactId == null || contactId.isBlank()) {
            contactId = UUID.randomUUID().toString();
        }

        Optional<Buyer> opt = buyerRepository.findByEmailIgnoreCase(email);
        Buyer buyer;
        boolean isNew = false;
        if (opt.isPresent()) {
            buyer = opt.get();
            log.info("[CorrelationId: {}] Updating existing contact: {}", correlationId, email);
        } else {
            buyer = new Buyer();
            buyer.setEmail(email);
            buyer.setZohoContactId(contactId);
            isNew = true;
            log.info("[CorrelationId: {}] Syncing new contact: {}", correlationId, email);
        }

        buyer.setFullName(name);
        if (phone != null) buyer.setPhone(phone);

        Buyer saved = buyerRepository.save(buyer);

        if (isNew) {
            // Fire sync event
            eventPublisher.publishEvent(new NotificationEvents.BuyerSyncedEvent(
                    saved.getId(), saved.getFullName(), saved.getEmail()
            ));
        }
    }

    private void syncDeal(Map<String, Object> data, UUID correlationId) {
        String dealId = null;
        if (data.get("id") != null) {
            dealId = data.get("id").toString();
        } else if (data.get("dealId") != null) {
            dealId = data.get("dealId").toString();
        } else if (data.get("deal_id") != null) {
            dealId = data.get("deal_id").toString();
        } else if (data.get("Deal_Id") != null) {
            dealId = data.get("Deal_Id").toString();
        } else if (data.get("data") instanceof List) {
            List<?> list = (List<?>) data.get("data");
            if (!list.isEmpty() && list.get(0) instanceof Map) {
                Map<?, ?> map = (Map<?, ?>) list.get(0);
                if (map.get("id") != null) {
                    dealId = map.get("id").toString();
                } else if (map.get("deal_id") != null) {
                    dealId = map.get("deal_id").toString();
                } else if (map.get("Deal_Id") != null) {
                    dealId = map.get("Deal_Id").toString();
                }
            }
        }

        if (dealId == null || dealId.isBlank()) {
            log.warn("[CorrelationId: {}] Cannot sync deal: Deal ID is missing in webhook payload: {}", correlationId, data);
            return;
        }

        log.info("[CorrelationId: {}] Delegating single Deal sync to ZohoBuyerSyncService for Deal ID: {}", correlationId, dealId);
        try {
            syncService.syncSingleDeal(dealId);
            log.info("[CorrelationId: {}] Successfully completed single Deal sync for Deal ID: {}", correlationId, dealId);
        } catch (Exception ex) {
            log.error("[CorrelationId: {}] Error executing syncSingleDeal for Deal ID {}: {}", correlationId, dealId, ex.getMessage(), ex);
            throw ex;
        }
    }
}
