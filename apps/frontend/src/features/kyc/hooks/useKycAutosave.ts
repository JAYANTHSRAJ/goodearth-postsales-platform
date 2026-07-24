import { useState, useEffect, useRef, useCallback } from 'react';
import kycService from '../services/kyc.service';
import { ApplicantDto, KycApplicationResponseDto } from '../types/kyc';
import { AutosaveStatus } from '../components/forms/AutosaveIndicator';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const AADHAAR_REGEX = /^[0-9]{12}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

export interface ValidationErrors {
  [key: string]: string;
}

export const useKycAutosave = (
  bookingId: string,
  initialData?: KycApplicationResponseDto | null
) => {
  const [applicationDate, setApplicationDate] = useState<string>(
    initialData?.applicationDate || new Date().toISOString().split('T')[0]
  );
  const [consideringHomeLoan, setConsideringHomeLoan] = useState<string>(
    initialData?.consideringHomeLoan || 'No'
  );
  const [hasCoApplicant, setHasCoApplicant] = useState<string>(
    initialData?.hasCoApplicant || (initialData?.jointApplicants && initialData.jointApplicants.length > 0 ? 'Yes' : 'No')
  );
  const [hasThirdApplicant, setHasThirdApplicant] = useState<string>(
    initialData?.hasThirdApplicant || (initialData?.jointApplicants && initialData.jointApplicants.length > 1 ? 'Yes' : 'No')
  );

  const [primaryApplicant, setPrimaryApplicant] = useState<ApplicantDto>(
    initialData?.primaryApplicant || { applicantType: 'PRIMARY', address: {} }
  );
  const [jointApplicants, setJointApplicants] = useState<ApplicantDto[]>(
    initialData?.jointApplicants || []
  );

  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialData?.lastSavedAt || null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const isInitialMount = useRef<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statusRef = useRef<string | undefined>(initialData?.status);

  // Keep statusRef updated synchronously whenever initialData changes
  useEffect(() => {
    if (initialData?.status) {
      statusRef.current = initialData.status;
    }
  }, [initialData?.status]);

  // Sync initialData when loaded from backend
  useEffect(() => {
    if (initialData) {
      if (initialData.status) {
        statusRef.current = initialData.status;
      }
      if (initialData.applicationDate) setApplicationDate(initialData.applicationDate);
      if (initialData.consideringHomeLoan) setConsideringHomeLoan(initialData.consideringHomeLoan);
      if (initialData.hasCoApplicant) setHasCoApplicant(initialData.hasCoApplicant);
      if (initialData.hasThirdApplicant) setHasThirdApplicant(initialData.hasThirdApplicant);

      if (initialData.primaryApplicant) {
        setPrimaryApplicant(initialData.primaryApplicant);
      }
      if (initialData.jointApplicants) {
        setJointApplicants(initialData.jointApplicants);
      }
      if (initialData.lastSavedAt) {
        setLastSavedAt(initialData.lastSavedAt);
      }
    }
  }, [initialData]);

  // Dirty State Protection (Warn user before closing tab if unsaved changes exist)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved KYC changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Realtime Form Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    // Primary Applicant Validation
    if (!primaryApplicant.fullName?.trim()) {
      newErrors['PRIMARY.fullName'] = 'Full name is required';
    }
    if (!primaryApplicant.email?.trim() || !EMAIL_REGEX.test(primaryApplicant.email)) {
      newErrors['PRIMARY.email'] = 'Valid email is required';
    }
    if (!primaryApplicant.phone?.trim() || !PHONE_REGEX.test(primaryApplicant.phone)) {
      newErrors['PRIMARY.phone'] = 'Valid 10-15 digit phone is required';
    }
    if (!primaryApplicant.panNumber?.trim() || !PAN_REGEX.test(primaryApplicant.panNumber)) {
      newErrors['PRIMARY.panNumber'] = 'PAN must be 10 uppercase characters (e.g. ABCDE1234F)';
    }
    if (!primaryApplicant.aadhaarNumber?.trim() || !AADHAAR_REGEX.test(primaryApplicant.aadhaarNumber)) {
      newErrors['PRIMARY.aadhaarNumber'] = 'Aadhaar must be 12 digits';
    }

    if (!primaryApplicant.address?.street?.trim()) {
      newErrors['PRIMARY.address.street'] = 'Street address is required';
    }
    if (!primaryApplicant.address?.city?.trim()) {
      newErrors['PRIMARY.address.city'] = 'City is required';
    }
    if (!primaryApplicant.address?.state?.trim()) {
      newErrors['PRIMARY.address.state'] = 'State is required';
    }
    if (!primaryApplicant.address?.pincode?.trim() || primaryApplicant.address.pincode.length < 6) {
      newErrors['PRIMARY.address.pincode'] = '6-digit pincode is required';
    }

    // Joint Applicants Validation
    jointApplicants.forEach((joint, idx) => {
      const prefix = joint.applicantType || `JOINT_${idx + 1}`;
      if (!joint.fullName?.trim()) {
        newErrors[`${prefix}.fullName`] = 'Full name is required';
      }
      if (!joint.email?.trim() || !EMAIL_REGEX.test(joint.email)) {
        newErrors[`${prefix}.email`] = 'Valid email is required';
      }
      if (!joint.phone?.trim() || !PHONE_REGEX.test(joint.phone)) {
        newErrors[`${prefix}.phone`] = 'Valid phone is required';
      }
      if (!joint.relation?.trim()) {
        newErrors[`${prefix}.relation`] = 'Relation is required';
      }
      if (joint.panNumber && !PAN_REGEX.test(joint.panNumber)) {
        newErrors[`${prefix}.panNumber`] = 'Invalid PAN format';
      }
      if (joint.aadhaarNumber && !AADHAAR_REGEX.test(joint.aadhaarNumber)) {
        newErrors[`${prefix}.aadhaarNumber`] = 'Invalid 12-digit Aadhaar';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [primaryApplicant, jointApplicants]);

  // Execute Save Draft
  const saveNow = async (): Promise<boolean> => {
    const currentStatus = statusRef.current || initialData?.status;
    if (currentStatus && currentStatus !== 'DRAFT' && currentStatus !== 'ACTION_REQUIRED') {
      console.warn(`[KYC_AUTOSAVE] Skipping saveDraft: Application status is '${currentStatus}'`);
      return false;
    }

    setStatus('saving');
    try {
      if (!navigator.onLine) {
        setStatus('offline');
        return false;
      }

      // 1. Save draft to local PostgreSQL database
      const response = await kycService.saveDraft({
        bookingId,
        applicationDate,
        consideringHomeLoan,
        hasCoApplicant,
        hasThirdApplicant,
        primaryApplicant,
        jointApplicants,
      });

      // 2. Submit applicant info to sync with Zoho CRM Deal & persist primary & co-applicant address
      if (primaryApplicant) {
        const coApp = jointApplicants.find((a) => a.applicantType === 'JOINT_1') || jointApplicants[0];

        const submitPayload: any = {
          bookingId,
          applicationDate,
          consideringHomeLoan,
          hasCoApplicant,
          applicantTitle: primaryApplicant.salutation,
          applicantFirstName: primaryApplicant.firstName,
          applicantLastName: primaryApplicant.lastName,
          applicantEmail: primaryApplicant.email,
          applicantPhone: primaryApplicant.phone,
          applicantPhoneCountryCode: primaryApplicant.phoneCode,
          applicantDob: primaryApplicant.dateOfBirth,
          applicantOccupation: primaryApplicant.occupation,
          applicantPan: primaryApplicant.panNumber,
          applicantAadhar: primaryApplicant.aadhaarNumber,
          soDoWoA: primaryApplicant.guardianRelation || 'S/O',
          applicantFatherSalutation: primaryApplicant.guardianSalutation,
          applicantFatherFirstName: primaryApplicant.guardianFirstName,
          applicantFatherLastName: primaryApplicant.guardianLastName,
          addressStreet: primaryApplicant.address?.street,
          addressLine2: primaryApplicant.address?.addressLine2,
          addressCity: primaryApplicant.address?.city,
          addressState: primaryApplicant.address?.state,
          addressPincode: primaryApplicant.address?.pincode,
          addressCountry: primaryApplicant.address?.country,
        };

        if (hasCoApplicant === 'Yes' && coApp) {
          submitPayload.titleA = coApp.salutation;
          submitPayload.firstNameA = coApp.firstName;
          submitPayload.lastNameA = coApp.lastName;
          submitPayload.coApplicantEmail = coApp.email;
          submitPayload.coApplicantPhone = coApp.phone;
          submitPayload.coApplicantPhoneCode = coApp.phoneCode;
          submitPayload.coApplicantDob = coApp.dateOfBirth;
          submitPayload.coApplicantOccupation = coApp.occupation;
          submitPayload.coApplicantPan = coApp.panNumber;
          submitPayload.coApplicantAadhar = coApp.aadhaarNumber;
          submitPayload.coApplicantSoDoWo = coApp.guardianRelation;
          submitPayload.coApplicantFatherSalutation = coApp.guardianSalutation;
          submitPayload.coApplicantFatherFirstName = coApp.guardianFirstName;
          submitPayload.coApplicantFatherLastName = coApp.guardianLastName;
          submitPayload.coApplicantAddressSameAsPrimary = coApp.addressSameAsPrimary;
          submitPayload.coApplicantAddressStreet = coApp.address?.street;
          submitPayload.coApplicantAddressLine2 = coApp.address?.addressLine2;
          submitPayload.coApplicantAddressPincode = coApp.address?.pincode;
          submitPayload.coApplicantAddressCountry = coApp.address?.country;
        }

        if (hasThirdApplicant === 'Yes' && hasCoApplicant === 'Yes') {
          const thirdApp = jointApplicants.find((a) => a.applicantType === 'JOINT_2') || jointApplicants[1];
          if (thirdApp) {
            submitPayload.hasThirdApplicant = hasThirdApplicant;
            submitPayload.thirdApplicantTitle = thirdApp.salutation;
            submitPayload.thirdApplicantFirstName = thirdApp.firstName;
            submitPayload.thirdApplicantLastName = thirdApp.lastName;
            submitPayload.thirdApplicantEmail = thirdApp.email;
            submitPayload.thirdApplicantPhone = thirdApp.phone;
            submitPayload.thirdApplicantPhoneCode = thirdApp.phoneCode;
            submitPayload.thirdApplicantDob = thirdApp.dateOfBirth;
            submitPayload.thirdApplicantOccupation = thirdApp.occupation;
            submitPayload.thirdApplicantPan = thirdApp.panNumber;
            submitPayload.thirdApplicantAadhar = thirdApp.aadhaarNumber;
            submitPayload.thirdApplicantSoDoWo = thirdApp.guardianRelation;
            submitPayload.thirdApplicantFatherSalutation = thirdApp.guardianSalutation;
            submitPayload.thirdApplicantFatherFirstName = thirdApp.guardianFirstName;
            submitPayload.thirdApplicantFatherLastName = thirdApp.guardianLastName;
            submitPayload.thirdApplicantAddressSameAsPrimary = thirdApp.addressSameAsPrimary;
            submitPayload.thirdApplicantAddressSameAsSecondary = thirdApp.addressSameAsSecondary;
            submitPayload.thirdApplicantAddressStreet = thirdApp.address?.street;
            submitPayload.thirdApplicantAddressLine2 = thirdApp.address?.addressLine2;
            submitPayload.thirdApplicantAddressCity = thirdApp.address?.city;
            submitPayload.thirdApplicantAddressState = thirdApp.address?.state;
            submitPayload.thirdApplicantAddressPincode = thirdApp.address?.pincode;
            submitPayload.thirdApplicantAddressCountry = thirdApp.address?.country;
          }
        }

        await kycService.submitApplicantInfo(submitPayload);
      }

      setStatus('saved');
      setLastSavedAt(response.lastSavedAt || new Date().toISOString());
      setIsDirty(false);
      return true;
    } catch (err) {
      setStatus('error');
      return false;
    }
  };

  // Debounced Autosave Effect (Triggers 1000ms after user finishes typing)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentStatus = statusRef.current || initialData?.status;
    if (currentStatus && currentStatus !== 'DRAFT' && currentStatus !== 'ACTION_REQUIRED') {
      return;
    }

    setIsDirty(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      saveNow();
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [applicationDate, consideringHomeLoan, hasCoApplicant, hasThirdApplicant, primaryApplicant, jointApplicants]);

  return {
    applicationDate,
    setApplicationDate,
    consideringHomeLoan,
    setConsideringHomeLoan,
    hasCoApplicant,
    setHasCoApplicant,
    hasThirdApplicant,
    setHasThirdApplicant,
    primaryApplicant,
    setPrimaryApplicant,
    jointApplicants,
    setJointApplicants,
    status,
    lastSavedAt,
    errors,
    isDirty,
    validateForm,
    saveNow,
  };
};

export default useKycAutosave;
