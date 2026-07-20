package com.goodearth.postsales.integration.zoho.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class ZohoContactResponse {
    private List<ZohoContact> data;

    @Getter
    @Setter
    public static class ZohoContact {
        private String id;
        
        @JsonProperty("Full_Name")
        private String fullName;
        
        @JsonProperty("First_Name")
        private String firstName;
        
        @JsonProperty("Last_Name")
        private String lastName;
        
        @JsonProperty("Email")
        private String email;
        
        @JsonProperty("Phone_Number")
        private String phone;

        @JsonProperty("Mobile")
        private String mobile;

        @JsonProperty("Phone")
        private String rawPhone;

        public String getPhone() {
            if (phone != null && !phone.trim().isEmpty()) {
                return phone;
            }
            if (mobile != null && !mobile.trim().isEmpty()) {
                return mobile;
            }
            return rawPhone;
        }
        
        @JsonProperty("Status")
        private String status;

        public String getResolvedFullName() {
            if (fullName != null && !fullName.trim().isEmpty()) {
                return fullName;
            }
            String first = firstName != null ? firstName.trim() : "";
            String last = lastName != null ? lastName.trim() : "";
            String combined = (first + " " + last).trim();
            return combined.isEmpty() ? "Unknown Name" : combined;
        }
    }
}
