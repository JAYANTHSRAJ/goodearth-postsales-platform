package com.goodearth.postsales.project.mapper;

import com.goodearth.postsales.project.entity.Project;
import com.goodearth.postsales.integration.zoho.dto.ZohoProjectResponse;
import org.springframework.stereotype.Component;

@Component
public class ProjectMapper {

    public Project toEntity(ZohoProjectResponse.ZohoDeal crmDeal) {
        if (crmDeal == null) {
            return null;
        }
        Project project = new Project();
        project.setZohoDealId(crmDeal.getId());
        project.setProjectName(crmDeal.getDealName() != null ? crmDeal.getDealName() : "Unnamed Deal");
        project.setProjectCode(crmDeal.getProjectCode());
        project.setLocation(crmDeal.getLocation());
        project.setStatus(crmDeal.getStage());
        return project;
    }
}
