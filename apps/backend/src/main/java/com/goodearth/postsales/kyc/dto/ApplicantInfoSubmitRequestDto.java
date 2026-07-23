package com.goodearth.postsales.kyc.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicantInfoSubmitRequestDto {

    @NotBlank(message = "Booking ID is required")
    private String bookingId;
    private String zohoDealName;
    private String zohoDealId;

    // Personal Information
    private String applicantTitle;       // Title_A
    private String applicantFirstName;   // First_Name_A
    private String applicantLastName;    // Last_Name_A
    private String applicantGender;      // Gender / Applicant_Gender
    private String applicantDob;         // Applicant_Date_of_Birth / DOB
    private String applicantAge;         // Applicant_Age / Age
    private String applicantPhone;       // Applicant_Phone_number / Phone
    private String applicantEmail;       // Email / Applicant_Email

    // Identity
    private String applicantPan;         // Applicant_PAN
    private String applicantAadhar;      // Applicant_Aadhar
    private String newApplicantAadhar;   // New_Applicant_Aadhar

    // Family
    private String applicantFatherSalutation; // Applicant Guardian Salutation
    private String applicantFatherFirstName; // Applicant_Spouse_Father_First_Name
    private String applicantFatherLastName;  // Applicant_Spouse_Father_Last_Name

    // Address
    private String addressStreet;        // Street_Address
    private String addressLine2;         // Address_Line_2
    private String addressCity;          // City
    private String addressState;         // State_Region_Province
    private String addressPincode;       // Postal_Zip_Code_2
    private String addressCountry;       // Country
    private String applicantPhoneCountryCode; // Phone Country Code

    // Professional
    private String applicantOccupation;          // Applicant_Occupation
    private String applicantDesignation;         // Designation / Applicant_Designation
    private String applicantOrganizationName;    // Organization_Name / Applicant_Organization_Name
    private String industry;                     // Industry
    private String applicantCitizenshipStatus;   // Citizenship_Status / Applicant_Citizenship_Status

    // Application
    private String applicationDate;              // Application_Date
    private String consideringHomeLoan;          // Are_you_considering_a_home_loan

    // Co-Applicant
    private String hasCoApplicant;       // Yes/No
    private String soDoWoA;             // S_o_D_o_W_o_A / S_o_D_o_W_o_C
    private String titleA;              // Title_C
    private String firstNameA;          // First_Name_C
    private String lastNameA;           // Last_Name_C
    private String coApplicantEmail;    // Email_C / Co_Applicant_Email
    private String coApplicantPhone;    // Phone_C / Co_Applicant_Phone
    private String coApplicantPhoneCode;
    private String coApplicantDob;      // DOB_C / Co_Applicant_Date_of_Birth
    private String coApplicantOccupation;// Co_Applicant_Occupation
    private String coApplicantPan;      // Co_Applicant_PAN
    private String coApplicantAadhar;   // Co_Applicant_Aadhar
    private String coApplicantFatherSalutation;
    private String coApplicantFatherFirstName;
    private String coApplicantFatherLastName;
    private Boolean coApplicantAddressSameAsPrimary;
    private String coApplicantAddressStreet;
    private String coApplicantAddressLine2;
    private String coApplicantAddressCity;
    private String coApplicantAddressState;
    private String coApplicantAddressPincode;
    private String coApplicantAddressCountry;
}
