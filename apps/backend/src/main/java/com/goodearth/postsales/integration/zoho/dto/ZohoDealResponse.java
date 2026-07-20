package com.goodearth.postsales.integration.zoho.dto;

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

        @JsonProperty("Project_Name")
        private String projectName;

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

        public String getResolvedCoApplicantName() {
            String first = coApplicantFirstName != null ? coApplicantFirstName.trim() : "";
            String last = coApplicantLastName != null ? coApplicantLastName.trim() : "";
            String combined = (first + " " + last).trim();
            return combined.isEmpty() ? null : combined;
        }
    }

    @Getter
    @Setter
    public static class ContactName {
        private String id;
        private String name;
    }

    @Getter
    @Setter
    public static class UnitName {
        private String id;
        private String name;
    }
}
