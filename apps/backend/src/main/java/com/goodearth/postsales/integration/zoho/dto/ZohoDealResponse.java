package com.goodearth.postsales.integration.zoho.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ZohoDealResponse {

    private List<ZohoDeal> data;

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ZohoDeal {
        private String id;

        @JsonProperty("Deal_Name")
        private String dealName;

        @JsonProperty("Stage")
        private String stage;

        @JsonProperty("Contact_Name")
        private ContactName contactName;

        @JsonProperty("Contact")
        private ContactName rawContact;

        @JsonProperty("Contact_Id")
        private String rawContactId;

        @JsonProperty("Email")
        private String email;

        @JsonProperty("Contact_Email")
        private String rawContactEmail;

        @JsonProperty("Primary_Email")
        private String rawPrimaryEmail;

        @JsonProperty("Applicant_Phone_number")
        private String applicantPhoneNumber;

        @JsonProperty("Phone")
        private String rawPhone;

        @JsonProperty("Mobile")
        private String rawMobile;

        public String getResolvedContactId() {
            if (contactName != null && contactName.getId() != null && !contactName.getId().trim().isEmpty()) {
                return contactName.getId().trim();
            }
            if (rawContact != null && rawContact.getId() != null && !rawContact.getId().trim().isEmpty()) {
                return rawContact.getId().trim();
            }
            if (rawContactId != null && !rawContactId.trim().isEmpty()) {
                return rawContactId.trim();
            }
            return null;
        }

        public String getResolvedContactName() {
            if (contactName != null && contactName.getName() != null && !contactName.getName().trim().isEmpty()) {
                return contactName.getName().trim();
            }
            if (rawContact != null && rawContact.getName() != null && !rawContact.getName().trim().isEmpty()) {
                return rawContact.getName().trim();
            }
            return null;
        }

        public String getEmail() {
            if (email != null && !email.trim().isEmpty()) {
                return email.trim();
            }
            if (rawContactEmail != null && !rawContactEmail.trim().isEmpty()) {
                return rawContactEmail.trim();
            }
            if (rawPrimaryEmail != null && !rawPrimaryEmail.trim().isEmpty()) {
                return rawPrimaryEmail.trim();
            }
            return null;
        }

        public String getPhone() {
            if (applicantPhoneNumber != null && !applicantPhoneNumber.trim().isEmpty()) {
                return applicantPhoneNumber.trim();
            }
            if (rawPhone != null && !rawPhone.trim().isEmpty()) {
                return rawPhone.trim();
            }
            if (rawMobile != null && !rawMobile.trim().isEmpty()) {
                return rawMobile.trim();
            }
            return null;
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
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ProjectSite {
        private String id;
        private String name;

        public ProjectSite() {}

        @JsonCreator
        public static ProjectSite fromValue(Object value) {
            if (value == null) return null;
            ProjectSite ps = new ProjectSite();
            if (value instanceof Map<?, ?> map) {
                if (map.get("id") != null) ps.setId(map.get("id").toString());
                if (map.get("name") != null) ps.setName(map.get("name").toString());
            } else if (value instanceof String str) {
                if (str.matches("^\\d{15,20}$")) {
                    ps.setId(str);
                } else {
                    ps.setName(str);
                }
            }
            return ps;
        }
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ContactName {
        private String id;
        private String name;

        public ContactName() {}

        @JsonCreator
        public static ContactName fromValue(Object value) {
            if (value == null) return null;
            ContactName cn = new ContactName();
            if (value instanceof Map<?, ?> map) {
                if (map.get("id") != null) cn.setId(map.get("id").toString());
                if (map.get("name") != null) cn.setName(map.get("name").toString());
            } else if (value instanceof String str) {
                if (str.matches("^\\d{15,20}$")) {
                    cn.setId(str);
                } else {
                    cn.setName(str);
                }
            }
            return cn;
        }
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class UnitName {
        private String id;
        private String name;

        public UnitName() {}

        @JsonCreator
        public static UnitName fromValue(Object value) {
            if (value == null) return null;
            UnitName un = new UnitName();
            if (value instanceof Map<?, ?> map) {
                if (map.get("id") != null) un.setId(map.get("id").toString());
                if (map.get("name") != null) un.setName(map.get("name").toString());
            } else if (value instanceof String str) {
                if (str.matches("^\\d{15,20}$")) {
                    un.setId(str);
                } else {
                    un.setName(str);
                }
            }
            return un;
        }
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Owner {
        private String id;
        private String name;
        private String email;

        public Owner() {}

        @JsonCreator
        public static Owner fromValue(Object value) {
            if (value == null) return null;
            Owner o = new Owner();
            if (value instanceof Map<?, ?> map) {
                if (map.get("id") != null) o.setId(map.get("id").toString());
                if (map.get("name") != null) o.setName(map.get("name").toString());
                if (map.get("email") != null) o.setEmail(map.get("email").toString());
            } else if (value instanceof String str) {
                if (str.matches("^\\d{15,20}$")) {
                    o.setId(str);
                } else {
                    o.setName(str);
                }
            }
            return o;
        }
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class UserLookup {
        private String id;
        private String name;
        private String email;

        public UserLookup() {}

        @JsonCreator
        public static UserLookup fromValue(Object value) {
            if (value == null) return null;
            UserLookup ul = new UserLookup();
            if (value instanceof Map<?, ?> map) {
                if (map.get("id") != null) ul.setId(map.get("id").toString());
                if (map.get("name") != null) ul.setName(map.get("name").toString());
                if (map.get("email") != null) ul.setEmail(map.get("email").toString());
            } else if (value instanceof String str) {
                if (str.matches("^\\d{15,20}$")) {
                    ul.setId(str);
                } else {
                    ul.setName(str);
                }
            }
            return ul;
        }
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LayoutLookup {
        private String id;
        private String name;

        @JsonProperty("display_label")
        private String displayLabel;

        public LayoutLookup() {}

        @JsonCreator
        public static LayoutLookup fromValue(Object value) {
            if (value == null) return null;
            LayoutLookup ll = new LayoutLookup();
            if (value instanceof Map<?, ?> map) {
                if (map.get("id") != null) ll.setId(map.get("id").toString());
                if (map.get("name") != null) ll.setName(map.get("name").toString());
                if (map.get("display_label") != null) ll.setDisplayLabel(map.get("display_label").toString());
            } else if (value instanceof String str) {
                if (str.matches("^\\d{15,20}$")) {
                    ll.setId(str);
                } else {
                    ll.setName(str);
                }
            }
            return ll;
        }
    }
}
