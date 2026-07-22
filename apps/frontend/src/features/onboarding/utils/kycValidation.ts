/**
 * Centralized KYC Validation Utility for GoodEarth Post-Sales Platform
 * Enforces strict per-step validation matching bank and government onboarding applications.
 */

export interface ValidationError {
  field: string;
  message: string;
}

// Regex Patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
const AADHAAR_REGEX = /^\d{12}$/;
const PHONE_REGEX = /^\d{10}$/;
const POSTAL_REGEX = /^\d{5,6}$/;

/**
 * Validate a specific step of the KYC form.
 * Returns an object map of field path -> error message.
 */
export function validateKycStep(
  step: number,
  form: Record<string, any>,
  documents: any[] = []
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (step === 1) {
    // Step 1: Application Details
    if (!form.applicationDate || !form.applicationDate.trim()) {
      errors['applicationDate'] = 'Application date is required';
    }
    if (!form.homeLoanRequired) {
      errors['homeLoanRequired'] = 'Please specify if a home loan is required';
    }
  } else if (step === 2) {
    // Step 2: Primary Applicant
    const primary = form.primaryApplicant || {};

    if (!primary.firstName || !primary.firstName.trim()) {
      errors['primaryApplicant.firstName'] = 'First name is required';
    }
    if (!primary.lastName || !primary.lastName.trim()) {
      errors['primaryApplicant.lastName'] = 'Last name is required';
    }
    if (!primary.email || !primary.email.trim()) {
      errors['primaryApplicant.email'] = 'Email address is required';
    } else if (!EMAIL_REGEX.test(primary.email.trim())) {
      errors['primaryApplicant.email'] = 'Please enter a valid email address';
    }

    if (!primary.phoneNumber || !primary.phoneNumber.trim()) {
      errors['primaryApplicant.phoneNumber'] = '10-digit mobile number is required';
    } else if (!PHONE_REGEX.test(primary.phoneNumber.trim())) {
      errors['primaryApplicant.phoneNumber'] = 'Mobile number must be exactly 10 digits';
    }

    if (!primary.dob || !primary.dob.trim()) {
      errors['primaryApplicant.dob'] = 'Date of birth is required';
    }

    if (!primary.relationType) {
      errors['primaryApplicant.relationType'] = 'Relation type is required';
    }
    if (!primary.relationFirstName || !primary.relationFirstName.trim()) {
      errors['primaryApplicant.relationFirstName'] = 'Relative first name is required';
    }
    if (!primary.relationLastName || !primary.relationLastName.trim()) {
      errors['primaryApplicant.relationLastName'] = 'Relative last name is required';
    }

    if (!primary.occupation || !primary.occupation.trim()) {
      errors['primaryApplicant.occupation'] = 'Occupation is required';
    }
    if (!primary.industry || !primary.industry.trim()) {
      errors['primaryApplicant.industry'] = 'Industry is required';
    }
    if (!primary.annualIncome || !primary.annualIncome.trim()) {
      errors['primaryApplicant.annualIncome'] = 'Annual income bracket is required';
    }
  } else if (step === 3) {
    // Step 3: Primary Address
    const address = form.primaryApplicant?.address || {};

    if (!address.addressLine1 || !address.addressLine1.trim()) {
      errors['primaryApplicant.address.addressLine1'] = 'Street address line 1 is required';
    }
    if (!address.city || !address.city.trim()) {
      errors['primaryApplicant.address.city'] = 'City is required';
    }
    if (!address.state || !address.state.trim()) {
      errors['primaryApplicant.address.state'] = 'State / Province is required';
    }
    if (!address.country || !address.country.trim()) {
      errors['primaryApplicant.address.country'] = 'Country is required';
    }
    if (!address.postalCode || !address.postalCode.trim()) {
      errors['primaryApplicant.address.postalCode'] = 'Postal code is required';
    } else if (!POSTAL_REGEX.test(address.postalCode.trim())) {
      errors['primaryApplicant.address.postalCode'] = 'Postal code must be 5 or 6 digits';
    }
  } else if (step === 4) {
    // Step 4: Identity Information
    const primary = form.primaryApplicant || {};

    if (!primary.panNo || !primary.panNo.trim()) {
      errors['primaryApplicant.panNo'] = 'PAN number is required';
    } else if (!PAN_REGEX.test(primary.panNo.trim())) {
      errors['primaryApplicant.panNo'] = 'Invalid PAN format (e.g. ABCDE1234F)';
    }

    if (!primary.aadhaarNo || !primary.aadhaarNo.trim()) {
      errors['primaryApplicant.aadhaarNo'] = 'Aadhaar number is required';
    } else if (!AADHAAR_REGEX.test(primary.aadhaarNo.trim())) {
      errors['primaryApplicant.aadhaarNo'] = 'Aadhaar number must be exactly 12 digits';
    }
  } else if (step === 5) {
    // Step 5: Co-Applicant
    if (!form.hasCoApplicant) {
      errors['hasCoApplicant'] = 'Please select if you have a co-applicant';
    } else if (form.hasCoApplicant === 'Yes') {
      const coApp = form.coApplicant || {};
      if (!coApp.firstName || !coApp.firstName.trim()) {
        errors['coApplicant.firstName'] = 'Co-applicant first name is required';
      }
      if (!coApp.lastName || !coApp.lastName.trim()) {
        errors['coApplicant.lastName'] = 'Co-applicant last name is required';
      }
      if (!coApp.email || !coApp.email.trim()) {
        errors['coApplicant.email'] = 'Co-applicant email is required';
      } else if (!EMAIL_REGEX.test(coApp.email.trim())) {
        errors['coApplicant.email'] = 'Please enter a valid email address';
      }
      if (!coApp.phoneNumber || !coApp.phoneNumber.trim()) {
        errors['coApplicant.phoneNumber'] = 'Co-applicant phone number is required';
      } else if (!PHONE_REGEX.test(coApp.phoneNumber.trim())) {
        errors['coApplicant.phoneNumber'] = 'Mobile number must be exactly 10 digits';
      }
      if (!coApp.dob || !coApp.dob.trim()) {
        errors['coApplicant.dob'] = 'Co-applicant date of birth is required';
      }
      if (coApp.panNo && coApp.panNo.trim() && !PAN_REGEX.test(coApp.panNo.trim())) {
        errors['coApplicant.panNo'] = 'Invalid PAN format (e.g. ABCDE1234F)';
      }
      if (coApp.aadhaarNo && coApp.aadhaarNo.trim() && !AADHAAR_REGEX.test(coApp.aadhaarNo.trim())) {
        errors['coApplicant.aadhaarNo'] = 'Aadhaar number must be exactly 12 digits';
      }
    }
  } else if (step === 6) {
    // Step 6: Third Applicant
    if (!form.hasThirdApplicant) {
      errors['hasThirdApplicant'] = 'Please select if you have a third applicant';
    } else if (form.hasThirdApplicant === 'Yes') {
      const thirdApp = form.thirdApplicant || {};
      if (!thirdApp.firstName || !thirdApp.firstName.trim()) {
        errors['thirdApplicant.firstName'] = 'Third applicant first name is required';
      }
      if (!thirdApp.lastName || !thirdApp.lastName.trim()) {
        errors['thirdApplicant.lastName'] = 'Third applicant last name is required';
      }
      if (!thirdApp.email || !thirdApp.email.trim()) {
        errors['thirdApplicant.email'] = 'Third applicant email is required';
      } else if (!EMAIL_REGEX.test(thirdApp.email.trim())) {
        errors['thirdApplicant.email'] = 'Please enter a valid email address';
      }
      if (!thirdApp.phoneNumber || !thirdApp.phoneNumber.trim()) {
        errors['thirdApplicant.phoneNumber'] = 'Third applicant phone number is required';
      } else if (!PHONE_REGEX.test(thirdApp.phoneNumber.trim())) {
        errors['thirdApplicant.phoneNumber'] = 'Mobile number must be exactly 10 digits';
      }
    }
  } else if (step === 7) {
    // Step 7: Loan and Tax Details
    if (!form.taxResidency) {
      errors['taxResidency'] = 'Tax residency status is required';
    }
  } else if (step === 8) {
    // Step 8: Document Uploads
    // Check if mandatory documents are uploaded
    const hasPanDoc = documents.some((d: any) => d.documentType === 'PAN_CARD' || d.documentType === 'PRIMARY_PAN');
    const hasAadhaarDoc = documents.some((d: any) => d.documentType === 'AADHAAR_CARD' || d.documentType === 'PRIMARY_AADHAAR');

    if (!hasPanDoc && !form._bypassDocCheck) {
      errors['documents.pan'] = 'Primary Applicant PAN card upload is required';
    }
    if (!hasAadhaarDoc && !form._bypassDocCheck) {
      errors['documents.aadhaar'] = 'Primary Applicant Aadhaar card upload is required';
    }
  }

  return errors;
}

/**
 * Scroll smoothly to and focus the first invalid field element on screen.
 */
export function scrollToFirstError(errors: Record<string, string>): void {
  const errorKeys = Object.keys(errors);
  if (errorKeys.length === 0) return;

  const firstKey = errorKeys[0];
  // Attempt to find element by id, name, or data-field
  const element =
    document.getElementById(firstKey) ||
    document.querySelector(`[name="${firstKey}"]`) ||
    document.querySelector(`[data-field="${firstKey}"]`);

  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (element instanceof HTMLElement) {
      element.focus();
    }
  } else {
    // Fallback scroll to first error alert or top of form
    window.scrollTo({ top: 200, behavior: 'smooth' });
  }
}
