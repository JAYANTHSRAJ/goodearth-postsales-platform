package com.goodearth.postsales.offerletter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfferLetterApplicantDto {
    private String applicantType;
    private String salutation;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String mobile;
    private String address;
    private String signatureLabel;
    private String label;

    public String getFormattedNameWithSalutation() {
        String title = (salutation != null && !salutation.isBlank()) ? salutation.trim() : "";
        String name = (fullName != null && !fullName.isBlank()) ? fullName.trim() :
                (((firstName != null ? firstName.trim() : "") + " " + (lastName != null ? lastName.trim() : "")).trim());

        if (!title.isEmpty() && !name.isEmpty()) {
            return title + " " + name;
        } else if (!name.isEmpty()) {
            return name;
        } else if (!title.isEmpty()) {
            return title;
        }
        return "";
    }
}
