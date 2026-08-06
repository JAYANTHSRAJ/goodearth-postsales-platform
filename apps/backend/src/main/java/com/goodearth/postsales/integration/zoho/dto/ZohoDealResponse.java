package com.goodearth.postsales.integration.zoho.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class ZohoDealResponse {
    private List<ZohoDeal> data;

    @Getter
    @Setter
    public static class ZohoDeal {
        private String id;
        
        @JsonProperty("Deal_Name")
        private String dealName;
        
        @JsonProperty("Stage")
        private String stage;

        @JsonProperty("Contact_Name")
        private ContactName contactName;

        @JsonProperty("Email")
        private String email;

        @JsonProperty("Applicant_Phone_number")
        private String applicantPhoneNumber;

        @JsonProperty("Phone")
        private String rawPhone;

        public String getPhone() {
            if (applicantPhoneNumber != null && !applicantPhoneNumber.trim().isEmpty()) {
                return applicantPhoneNumber;
            }
            return rawPhone;
        }

        @JsonProperty("Project_Site")
        private ProjectSite projectSite;

        @JsonProperty("Project_Name")
        private String rawProjectName;

        @JsonProperty("Project_Site_Name")
        private String rawProjectSiteName;

        public String getProjectName() {
            if (projectSite != null && projectSite.getName() != null && !projectSite.getName().trim().isEmpty()) {
                return projectSite.getName().trim();
            }
            if (rawProjectName != null && !rawProjectName.trim().isEmpty()) {
                return rawProjectName.trim();
            }
            if (rawProjectSiteName != null && !rawProjectSiteName.trim().isEmpty()) {
                return rawProjectSiteName.trim();
            }
            return null;
        }

        @JsonProperty("Project_Code")
        private String projectCode;

        @JsonProperty("Location")
        private String location;

        @JsonProperty("Co_applicant_First_Name")
        private String coApplicantFirstName;

        @JsonProperty("Co_applicant_Last_Name")
        private String coApplicantLastName;

        @JsonProperty("Unit_Name")
        private UnitName unitName;

        @JsonProperty("Owner")
        private Owner owner;

        @JsonProperty("Created_By")
        private UserLookup createdBy;

        @JsonProperty("Modified_By")
        private UserLookup modifiedBy;

        @JsonProperty("$layout_id")
        private LayoutLookup layout;

        public String getResolvedCoApplicantName() {
            String first = coApplicantFirstName != null ? coApplicantFirstName.trim() : "";
            String last = coApplicantLastName != null ? coApplicantLastName.trim() : "";
            String combined = (first + " " + last).trim();
            return combined.isEmpty() ? null : combined;
        }

        public String getResolvedUnitName() {
            if (unitName != null && unitName.getName() != null && !unitName.getName().trim().isEmpty()) {
                return unitName.getName().trim();
            }
            return dealName;
        }
    }

    @Getter
    @Setter
    public static class ProjectSite {
        private String id;
        private String name;

        public ProjectSite() {}

        @JsonCreator
        public ProjectSite(String name) {
            this.name = name;
        }
    }

    @Getter
    @Setter
    public static class ContactName {
        private String id;
        private String name;

        public ContactName() {}

        @JsonCreator
        public ContactName(String name) {
            this.name = name;
        }
    }

    @Getter
    @Setter
    public static class UnitName {
        private String id;
        private String name;

        public UnitName() {}

        @JsonCreator
        public UnitName(String name) {
            this.name = name;
        }
    }

    @Getter
    @Setter
    public static class Owner {
        private String id;
        private String name;
        private String email;

        public Owner() {}

        @JsonCreator
        public Owner(String name) {
            this.name = name;
        }
    }

    @Getter
    @Setter
    public static class UserLookup {
        private String id;
        private String name;
        private String email;

        public UserLookup() {}

        @JsonCreator
        public UserLookup(String name) {
            this.name = name;
        }
    }

    @Getter
    @Setter
    public static class LayoutLookup {
        private String id;
        private String name;

        @JsonProperty("display_label")
        private String displayLabel;

        public LayoutLookup() {}

        @JsonCreator
        public LayoutLookup(String name) {
            this.name = name;
        }
    }
}

