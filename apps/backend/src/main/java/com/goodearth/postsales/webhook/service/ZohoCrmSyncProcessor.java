package com.goodearth.postsales.webhook.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodearth.postsales.buyer.entity.Buyer;
import com.goodearth.postsales.buyer.repository.BuyerRepository;
import com.goodearth.postsales.common.enumeration.UserRole;
import com.goodearth.postsales.notification.event.NotificationEvents;
import com.goodearth.postsales.project.entity.Project;
import com.goodearth.postsales.project.repository.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

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

    public ZohoCrmSyncProcessor(
            BuyerRepository buyerRepository,
            ProjectRepository projectRepository,
            ObjectMapper objectMapper,
            ApplicationEventPublisher eventPublisher) {
        this.buyerRepository = buyerRepository;
        this.projectRepository = projectRepository;
        this.objectMapper = objectMapper;
        this.eventPublisher = eventPublisher;
    }

    public void process(String eventType, String payload, UUID correlationId) throws Exception {
        log.info("[CorrelationId: {}] Processing Zoho CRM webhook event of type: {}", correlationId, eventType);
        Map<String, Object> data = objectMapper.readValue(payload, new TypeReference<Map<String, Object>>() {});

        if ("contacts".equalsIgnoreCase(eventType)) {
            syncContact(data, correlationId);
        } else if ("deals".equalsIgnoreCase(eventType)) {
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
        String dealId = (String) data.get("Deal_Id");
        if (dealId == null || dealId.isBlank()) {
            log.warn("[CorrelationId: {}] Cannot sync deal: Deal_Id is missing.", correlationId);
            return;
        }

        String code = (String) data.get("Project_Code");
        String name = (String) data.get("Deal_Name");
        String location = (String) data.get("Location");

        Optional<Project> opt = projectRepository.findByZohoDealId(dealId);
        Project project;
        boolean isNew = false;
        if (opt.isPresent()) {
            project = opt.get();
            log.info("[CorrelationId: {}] Updating existing deal project: {}", correlationId, dealId);
        } else {
            project = new Project();
            project.setZohoDealId(dealId);
            isNew = true;
            log.info("[CorrelationId: {}] Syncing new deal project: {}", correlationId, dealId);
        }

        if (code != null) project.setProjectCode(code);
        if (name != null) project.setProjectName(name);
        if (location != null) project.setLocation(location);
        project.setStatus("ACTIVE");

        Project saved = projectRepository.save(project);

        if (isNew) {
            // Fire sync event
            eventPublisher.publishEvent(new NotificationEvents.ProjectSyncedEvent(
                    saved.getId(), saved.getProjectName()
            ));
        }
    }
}
