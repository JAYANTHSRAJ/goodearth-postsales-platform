package com.goodearth.postsales.client.validation;

import com.goodearth.postsales.client.dto.*;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Component
public class KycValidator {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern PHONE_NUMBER_PATTERN = Pattern.compile("^\\d{4,15}$");
    private static final Pattern PHONE_CODE_PATTERN = Pattern.compile("^\\+?\\d{1,4}$");
    private static final Pattern PAN_PATTERN = Pattern.compile("^[A-Z]{5}[0-9]{4}[A-Z]{1}$");
    private static final Pattern AADHAAR_PATTERN = Pattern.compile("^\\d{12}$");
    private static final Pattern IFSC_PATTERN = Pattern.compile("^[A-Z]{4}0[A-Z0-9]{6}$");
    private static final Pattern INDIA_PINCODE_PATTERN = Pattern.compile("^\\d{6}$");

    /**
     * Validates a complete Submit KYC payload conditionally.
     */
    public void validateSubmitPayload(KycDraftDto form) {
        if (form == null) {
            throw new CustomException("KYC Form payload cannot be empty", HttpStatus.BAD_REQUEST);
        }

        List<String> errors = new ArrayList<>();

        // 1. Primary Applicant Validation
        PrimaryApplicantDto primary = form.getPrimaryApplicant();
        if (primary == null) {
            errors.add("Primary applicant details are required");
        } else {
            validatePrimaryApplicant(primary, errors);
        }

        // 2. Co-Applicant Validation (Conditional)
        if ("Yes".equalsIgnoreCase(form.getHasCoApplicant())) {
            CoApplicantDto coApp = form.getCoApplicant();
            if (coApp == null) {
                errors.add("Co-applicant details are required when Co-Applicant option is selected");
            } else {
                validateCoApplicant(coApp, errors);
            }
        }

        // 3. Third Applicant Validation (Conditional)
        if ("Yes".equalsIgnoreCase(form.getHasThirdApplicant())) {
            ThirdApplicantDto thirdApp = form.getThirdApplicant();
            if (thirdApp == null) {
                errors.add("Third applicant details are required when Third Applicant option is selected");
            } else {
                validateThirdApplicant(thirdApp, errors);
            }
        }

        // 4. Banking Validation
        if (form.getBankAccountNumber() != null && !form.getBankAccountNumber().trim().isEmpty()) {
            if (!form.getBankAccountNumber().matches("^\\d{8,20}$")) {
                errors.add("Bank account number must be between 8 and 20 digits");
            }
        }
        if (form.getBankIfsc() != null && !form.getBankIfsc().trim().isEmpty()) {
            if (!IFSC_PATTERN.matcher(form.getBankIfsc().toUpperCase()).matches()) {
                errors.add("Invalid Bank IFSC Code format (e.g. HDFC0001234)");
            }
        }

        if (!errors.isEmpty()) {
            throw new CustomException("KYC Validation Failed: " + String.join("; ", errors), HttpStatus.BAD_REQUEST);
        }
    }

    private void validatePrimaryApplicant(PrimaryApplicantDto primary, List<String> errors) {
        if (isBlank(primary.getFirstName())) errors.add("Primary applicant first name is required");
        if (isBlank(primary.getLastName())) errors.add("Primary applicant last name is required");
        
        if (isBlank(primary.getEmail()) || !EMAIL_PATTERN.matcher(primary.getEmail()).matches()) {
            errors.add("Valid primary applicant email address is required");
        }

        if (primary.getPhoneNumber() != null && !primary.getPhoneNumber().trim().isEmpty()) {
            if (!PHONE_NUMBER_PATTERN.matcher(primary.getPhoneNumber()).matches()) {
                errors.add("Invalid primary applicant phone number format");
            }
        }

        if (primary.getPhoneCode() != null && !primary.getPhoneCode().trim().isEmpty()) {
            if (!PHONE_CODE_PATTERN.matcher(primary.getPhoneCode()).matches()) {
                errors.add("Invalid primary applicant country code format");
            }
        }

        validateDob(primary.getDob(), "Primary applicant", errors);

        // Conditional PAN / Aadhaar Validation (if provided or India)
        if (primary.getPanNo() != null && !primary.getPanNo().trim().isEmpty()) {
            if (!PAN_PATTERN.matcher(primary.getPanNo().toUpperCase()).matches()) {
                errors.add("Invalid Primary Applicant PAN Number format (e.g. ABCDE1234F)");
            }
        }

        if (primary.getAadhaarNo() != null && !primary.getAadhaarNo().trim().isEmpty()) {
            if (!AADHAAR_PATTERN.matcher(primary.getAadhaarNo()).matches()) {
                errors.add("Invalid Primary Applicant Aadhaar Number format (must be 12 digits)");
            }
        }

        if (primary.getAddress() != null) {
            validateAddress(primary.getAddress(), "Primary applicant", errors);
        } else {
            errors.add("Primary applicant address is required");
        }
    }

    private void validateCoApplicant(CoApplicantDto coApp, List<String> errors) {
        if (isBlank(coApp.getFirstName())) errors.add("Co-applicant first name is required");
        if (isBlank(coApp.getLastName())) errors.add("Co-applicant last name is required");

        if (isBlank(coApp.getEmail()) || !EMAIL_PATTERN.matcher(coApp.getEmail()).matches()) {
            errors.add("Valid co-applicant email address is required");
        }

        validateDob(coApp.getDob(), "Co-applicant", errors);

        if (coApp.getPanNo() != null && !coApp.getPanNo().trim().isEmpty()) {
            if (!PAN_PATTERN.matcher(coApp.getPanNo().toUpperCase()).matches()) {
                errors.add("Invalid Co-applicant PAN Number format");
            }
        }

        if (coApp.getAadhaarNo() != null && !coApp.getAadhaarNo().trim().isEmpty()) {
            if (!AADHAAR_PATTERN.matcher(coApp.getAadhaarNo()).matches()) {
                errors.add("Invalid Co-applicant Aadhaar Number format");
            }
        }

        if (!"Yes".equalsIgnoreCase(coApp.getSameAddressAsPrimary())) {
            if (coApp.getAddress() != null) {
                validateAddress(coApp.getAddress(), "Co-applicant", errors);
            } else {
                errors.add("Co-applicant address is required when address is not same as primary");
            }
        }
    }

    private void validateThirdApplicant(ThirdApplicantDto thirdApp, List<String> errors) {
        if (isBlank(thirdApp.getFirstName())) errors.add("Third applicant first name is required");
        if (isBlank(thirdApp.getLastName())) errors.add("Third applicant last name is required");

        if (isBlank(thirdApp.getEmail()) || !EMAIL_PATTERN.matcher(thirdApp.getEmail()).matches()) {
            errors.add("Valid third applicant email address is required");
        }

        validateDob(thirdApp.getDob(), "Third applicant", errors);

        if (thirdApp.getPanNo() != null && !thirdApp.getPanNo().trim().isEmpty()) {
            if (!PAN_PATTERN.matcher(thirdApp.getPanNo().toUpperCase()).matches()) {
                errors.add("Invalid Third applicant PAN Number format");
            }
        }

        if (!"Yes".equalsIgnoreCase(thirdApp.getSameAddressAsPrimary()) && !"Yes".equalsIgnoreCase(thirdApp.getSameAddressAsSecond())) {
            if (thirdApp.getAddress() != null) {
                validateAddress(thirdApp.getAddress(), "Third applicant", errors);
            } else {
                errors.add("Third applicant address is required when address is custom");
            }
        }
    }

    private void validateAddress(AddressDto address, String prefix, List<String> errors) {
        if (isBlank(address.getAddressLine1())) errors.add(prefix + " street address line 1 is required");
        if (isBlank(address.getCity())) errors.add(prefix + " city is required");
        if (isBlank(address.getState())) errors.add(prefix + " state is required");
        if (isBlank(address.getCountry())) errors.add(prefix + " country is required");

        // Country-aware Postal Code Validation
        if (address.getPostalCode() != null && !address.getPostalCode().trim().isEmpty()) {
            if ("India".equalsIgnoreCase(address.getCountry()) || "IN".equalsIgnoreCase(address.getCountry())) {
                if (!INDIA_PINCODE_PATTERN.matcher(address.getPostalCode()).matches()) {
                    errors.add(prefix + " postal code must be a 6-digit Indian PIN code");
                }
            } else if (address.getPostalCode().length() < 3 || address.getPostalCode().length() > 10) {
                errors.add(prefix + " postal code length is invalid");
            }
        } else {
            errors.add(prefix + " postal code is required");
        }
    }

    private void validateDob(String dobStr, String prefix, List<String> errors) {
        if (isBlank(dobStr)) {
            errors.add(prefix + " date of birth is required");
            return;
        }
        try {
            LocalDate dob = LocalDate.parse(dobStr);
            if (dob.isAfter(LocalDate.now())) {
                errors.add(prefix + " date of birth cannot be in the future");
            }
        } catch (DateTimeParseException e) {
            errors.add(prefix + " date of birth format must be YYYY-MM-DD");
        }
    }

    private boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }
}
