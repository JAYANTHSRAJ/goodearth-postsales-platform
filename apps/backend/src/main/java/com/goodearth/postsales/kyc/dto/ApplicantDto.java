package com.goodearth.postsales.kyc.dto;

import com.goodearth.postsales.kyc.entity.ApplicantType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicantDto {

    private UUID id;

    @NotNull(message = "Applicant type is required")
    private ApplicantType applicantType;

    @Size(max = 255, message = "Full name must not exceed 255 characters")
    private String fullName;

    private String salutation;
    private String firstName;
    private String lastName;

    private String guardianRelation;
    private String guardianSalutation;
    private String guardianFirstName;
    private String guardianLastName;
    private String guardianName;

    private String dateOfBirth;
    private String gender;
    private String age;
    private String occupation;

    private Boolean addressSameAsPrimary;
    private Boolean addressSameAsSecondary;

    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    @Pattern(regexp = "^$|^\\+?[0-9]{10,15}$", message = "Phone must be valid format (10-15 digits)")
    private String phone;

    @Size(max = 50, message = "Relation must not exceed 50 characters")
    private String relation;

    @Pattern(regexp = "^$|^[A-Z]{5}[0-9]{4}[A-Z]{1}$", message = "PAN must be 10 uppercase characters (e.g. ABCDE1234F)")
    private String panNumber;

    @Pattern(regexp = "^$|^[0-9]{12}$", message = "Aadhaar must be 12 digits")
    private String aadhaarNumber;

    private String maskedAadhaarNumber;

    @Valid
    private AddressDto address;
}
