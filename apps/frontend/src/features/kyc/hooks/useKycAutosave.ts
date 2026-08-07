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

  const ensureDefaultApplicantFields = (app?: ApplicantDto | null, defaultType: 'PRIMARY' | 'JOINT_1' | 'JOINT_2' = 'PRIMARY'): ApplicantDto => {
    const base: ApplicantDto = app || { applicantType: defaultType };
    return {
      ...base,
      applicantType: base.applicantType || defaultType,
      salutation: base.salutation || 'Mr.',
      gender: base.gender || 'Male',
      guardianRelation: base.guardianRelation || 'S/O',
      guardianSalutation: base.guardianSalutation || 'Mr.',
      address: {
        ...base.address,
        country: base.address?.country || 'India',
      },
    };
  };

  const prepareJointApplicants = (
    apps: ApplicantDto[] = [],
    hasCo: string = 'No',
    hasThird: string = 'No'
  ): ApplicantDto[] => {
    let result = [...apps];
    if (hasCo === 'Yes') {
      let coApp = result.find((a) => a.applicantType === 'JOINT_1');
      if (!coApp) {
        coApp = ensureDefaultApplicantFields(null, 'JOINT_1');
        result.unshift(coApp);
      }
    }
    if (hasCo === 'Yes' && hasThird === 'Yes') {
      let thirdApp = result.find((a) => a.applicantType === 'JOINT_2');
      if (!thirdApp) {
        thirdApp = ensureDefaultApplicantFields(null, 'JOINT_2');
        result.push(thirdApp);
      }
    }
    return result.map((app) => ensureDefaultApplicantFields(app, app.applicantType || 'JOINT_1'));
  };

  const [primaryApplicant, setPrimaryApplicant] = useState<ApplicantDto>(
    ensureDefaultApplicantFields(initialData?.primaryApplicant, 'PRIMARY')
  );
  const [jointApplicants, setJointApplicants] = useState<ApplicantDto[]>(
    prepareJointApplicants(
      initialData?.jointApplicants || [],
      initialData?.hasCoApplicant || (initialData?.jointApplicants && initialData.jointApplicants.length > 0 ? 'Yes' : 'No'),
      initialData?.hasThirdApplicant || (initialData?.jointApplicants && initialData.jointApplicants.length > 1 ? 'Yes' : 'No')
    )
  );

  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | Date | null>(initialData?.lastSavedAt || null);
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

  // Sync initialData when loaded from backend for the first time or when bookingId/applicationId changes
  const loadedAppIdRef = useRef<string | null>(null);

  const resetForm = useCallback((data?: KycApplicationResponseDto | null) => {
    const target = data || initialData;
    if (target) {
      if (target.status) {
        statusRef.current = target.status;
      }
      loadedAppIdRef.current = target.kycApplicationId || null;
      setApplicationDate(target.applicationDate || new Date().toISOString().split('T')[0]);
      setConsideringHomeLoan(target.consideringHomeLoan || 'No');

      const coVal = target.hasCoApplicant || (target.jointApplicants && target.jointApplicants.length > 0 ? 'Yes' : 'No');
      const thirdVal = target.hasThirdApplicant || (target.jointApplicants && target.jointApplicants.length > 1 ? 'Yes' : 'No');
      setHasCoApplicant(coVal);
      setHasThirdApplicant(thirdVal);

      setPrimaryApplicant(ensureDefaultApplicantFields(target.primaryApplicant, 'PRIMARY'));
      setJointApplicants(prepareJointApplicants(target.jointApplicants || [], coVal, thirdVal));
      setLastSavedAt(target.lastSavedAt || null);
      setErrors({});
      setIsDirty(false);
      console.log('[KYC_COPY] resetForm executed. Form fields populated:', {
        kycApplicationId: target.kycApplicationId,
        fullName: target.primaryApplicant?.fullName,
        pan: target.primaryApplicant?.panNumber,
        city: target.primaryApplicant?.address?.city,
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      if (initialData.status) {
        statusRef.current = initialData.status;
      }

      // Sync form field values on initial load or when data is updated/copied from backend
      const nameChanged = initialData.primaryApplicant?.fullName && primaryApplicant.fullName !== initialData.primaryApplicant.fullName;
      if (loadedAppIdRef.current !== initialData.kycApplicationId || nameChanged) {
        resetForm(initialData);
      }
    } else if (!loadedAppIdRef.current) {
      statusRef.current = 'DRAFT';
      setApplicationDate(new Date().toISOString().split('T')[0]);
      setConsideringHomeLoan('No');
      setHasCoApplicant('No');
      setHasThirdApplicant('No');
      setPrimaryApplicant(ensureDefaultApplicantFields(null, 'PRIMARY'));
      setJointApplicants([]);
      setLastSavedAt(null);
      setErrors({});
      setIsDirty(false);
    }
  }, [initialData?.kycApplicationId, initialData?.status, initialData?.primaryApplicant?.fullName, resetForm]);

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
    if (currentStatus && currentStatus !== 'DRAFT' && currentStatus !== 'ACTION_REQUIRED' && currentStatus !== 'EDIT_ENABLED') {
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
      const draftResponse = await kycService.saveDraft({
        bookingId,
        applicationDate,
        consideringHomeLoan,
        hasCoApplicant,
        hasThirdApplicant,
        primaryApplicant,
        jointApplicants,
      });

      let submitResponse: KycApplicationResponseDto | null = null;

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
          applicantGender: primaryApplicant.gender,
          applicantAge: primaryApplicant.age,
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
          submitPayload.coApplicantGender = coApp.gender;
          submitPayload.coApplicantAge = coApp.age;
          submitPayload.coApplicantRelation = coApp.relation;
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
          submitPayload.coApplicantAddressCity = coApp.address?.city;
          submitPayload.coApplicantAddressState = coApp.address?.state;
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
            submitPayload.thirdApplicantGender = thirdApp.gender;
            submitPayload.thirdApplicantAge = thirdApp.age;
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

        submitResponse = await kycService.submitApplicantInfo(submitPayload);
      }

      const getBackendTimestamp = (res: any): string | undefined => {
        if (!res || typeof res !== 'object') return undefined;
        return res.updatedAt || res.modifiedTime || res.lastSavedAt || res.timestamp;
      };

      const returnedTimestamp = getBackendTimestamp(submitResponse) || getBackendTimestamp(draftResponse);
      const nextSavedAt = (returnedTimestamp && returnedTimestamp !== lastSavedAt) ? returnedTimestamp : new Date();

      setStatus('saved');
      setLastSavedAt(nextSavedAt);
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
    if (currentStatus && currentStatus !== 'DRAFT' && currentStatus !== 'ACTION_REQUIRED' && currentStatus !== 'EDIT_ENABLED') {
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
    resetForm,
  };
};

export default useKycAutosave;
