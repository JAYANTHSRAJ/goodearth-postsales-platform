package com.goodearth.postsales.client.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PrimaryApplicantDto {
    private String salutation;

    @Size(max = 100, message = "First name cannot exceed 100 characters")
    private String firstName;

    @Size(max = 100, message = "Last name cannot exceed 100 characters")
    private String lastName;

    @Email(message = "Invalid email format")
    private String email;

    private String phoneCode;
    private String phoneNumber;

    private String relationType;
    private String relationSalutation;
    private String relationFirstName;
    private String relationLastName;

    private String dob;
    private String occupation;
    private String industry;
    private String company;
    private String annualIncome;

    private String aadhaarNo;
    private String panNo;
    private String passportNo;
    private String voterId;

    @Valid
    private AddressDto address;
}
