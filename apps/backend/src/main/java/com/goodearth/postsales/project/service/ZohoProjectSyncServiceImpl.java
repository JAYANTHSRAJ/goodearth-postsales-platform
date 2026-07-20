package com.goodearth.postsales.project.service;

import com.goodearth.postsales.project.dto.ProjectSyncResponse;
import com.goodearth.postsales.project.entity.Project;
import com.goodearth.postsales.project.mapper.ProjectMapper;
import com.goodearth.postsales.project.repository.ProjectRepository;
import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.integration.zoho.ZohoApiClient;
import com.goodearth.postsales.integration.zoho.ZohoProperties;
import com.goodearth.postsales.integration.zoho.dto.ZohoProjectResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ZohoProjectSyncServiceImpl implements ZohoProjectSyncService {

    private static final Logger log = LoggerFactory.getLogger(ZohoProjectSyncServiceImpl.class);

    private final ZohoApiClient apiClient;
    private final ZohoProperties properties;
    private final ProjectRepository projectRepository;
    private final ProjectMapper projectMapper;

    public ZohoProjectSyncServiceImpl(
            ZohoApiClient apiClient,
            ZohoProperties properties,
            ProjectRepository projectRepository,
            ProjectMapper projectMapper) {
        this.apiClient = apiClient;
        this.properties = properties;
        this.projectRepository = projectRepository;
        this.projectMapper = projectMapper;
    }

    @Override
    @Transactional
    public ProjectSyncResponse syncProjects() {
        log.info("Starting Zoho CRM Deals (Projects) synchronization...");
        String url = properties.getCrmApiUrl() + "/Deals";

        ZohoProjectResponse crmResponse;
        try {
            crmResponse = apiClient.get(url, ZohoProjectResponse.class);
        } catch (Exception e) {
            log.error("Failed to fetch deals from Zoho CRM", e);
            throw new CustomException("Failed to synchronize projects from Zoho CRM due to integration error.", HttpStatus.BAD_GATEWAY);
        }

        if (crmResponse == null || crmResponse.getData() == null) {
            log.warn("No deals returned from Zoho CRM");
            return new ProjectSyncResponse(0, 0, 0, 0);
        }

        List<ZohoProjectResponse.ZohoDeal> crmDeals = crmResponse.getData();
        int totalFetched = crmDeals.size();
        int created = 0;
        int updated = 0;
        int skipped = 0;

        for (ZohoProjectResponse.ZohoDeal crmDeal : crmDeals) {
            if (crmDeal.getId() == null || crmDeal.getId().trim().isEmpty()) {
                skipped++;
                continue;
            }

            Optional<Project> existingProjectOpt = projectRepository.findByZohoDealId(crmDeal.getId());
            if (existingProjectOpt.isPresent()) {
                Project existingProject = existingProjectOpt.get();
                boolean changed = false;

                String dealName = crmDeal.getDealName() != null ? crmDeal.getDealName() : "Unnamed Deal";
                if (!dealName.equals(existingProject.getProjectName())) {
                    existingProject.setProjectName(dealName);
                    changed = true;
                }

                String code = crmDeal.getProjectCode();
                if ((code == null && existingProject.getProjectCode() != null) || (code != null && !code.equals(existingProject.getProjectCode()))) {
                    existingProject.setProjectCode(code);
                    changed = true;
                }

                String location = crmDeal.getLocation();
                if ((location == null && existingProject.getLocation() != null) || (location != null && !location.equals(existingProject.getLocation()))) {
                    existingProject.setLocation(location);
                    changed = true;
                }

                String status = crmDeal.getStage();
                if ((status == null && existingProject.getStatus() != null) || (status != null && !status.equals(existingProject.getStatus()))) {
                    existingProject.setStatus(status);
                    changed = true;
                }

                if (changed) {
                    projectRepository.save(existingProject);
                    updated++;
                } else {
                    skipped++;
                }
            } else {
                Project newProject = projectMapper.toEntity(crmDeal);
                projectRepository.save(newProject);
                created++;
            }
        }

        log.info("Zoho CRM Project synchronization completed. Total fetched: {}, Created: {}, Updated: {}, Skipped: {}",
                totalFetched, created, updated, skipped);
        return new ProjectSyncResponse(totalFetched, created, updated, skipped);
    }
}
