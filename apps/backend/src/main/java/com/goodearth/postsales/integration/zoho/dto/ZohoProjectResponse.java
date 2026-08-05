package com.goodearth.postsales.integration.zoho.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class ZohoProjectResponse {
    private List<ZohoDeal> data;

    @Getter
    @Setter
    public static class ZohoDeal {
        private String id;
        
        @JsonProperty("Deal_Name")
        private String dealName;
        
        @JsonProperty("Project_Name")
        private String rawProjectName;

        @JsonProperty("Project_Site_Name")
        private String rawProjectSiteName;

        @JsonProperty("Project_Code")
        private String projectCode;
        
        @JsonProperty("Location")
        private String location;
        
        @JsonProperty("Stage")
        private String stage;

        public String getProjectName() {
            if (rawProjectName != null && !rawProjectName.trim().isEmpty()) {
                return rawProjectName.trim();
            }
            if (rawProjectSiteName != null && !rawProjectSiteName.trim().isEmpty()) {
                return rawProjectSiteName.trim();
            }
            return dealName;
        }
    }
}
