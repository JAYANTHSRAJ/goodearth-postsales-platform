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

  // Sync initialData when loaded from backend
  useEffect(() => {
    if (initialData) {
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
    setStatus('saving');
    try {
      if (!navigator.onLine) {
        setStatus('offline');
        return false;
      }

      const response = await kycService.saveDraft({
        bookingId,
        primaryApplicant,
        jointApplicants,
      });

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
  }, [primaryApplicant, jointApplicants]);

  return {
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
