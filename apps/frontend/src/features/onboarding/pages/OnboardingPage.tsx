import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  User,
  ClipboardCheck,
  Check,
  ChevronRight,
  MapPin,
  Loader2,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { useAuthStore } from '../../../store/authStore';
import { useUnitStore } from '../../../store/unitStore';
import { clientService } from '../../../services/client.service';
import { KycOptionSelector } from '../components/KycOptionSelector';
import { KycWizardHeader } from '../components/KycWizardHeader';
import { KycBottomActionBar } from '../components/KycBottomActionBar';
import { Step1PersonalDetails } from '../components/wizard-steps/Step1PersonalDetails';
import { Step2CoApplicants } from '../components/wizard-steps/Step2CoApplicants';
import { Step3DocumentVault } from '../components/wizard-steps/Step3DocumentVault';
import { Step4ReviewSubmit } from '../components/wizard-steps/Step4ReviewSubmit';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { activeUnit, setUnits } = useUnitStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // KYC Screen & Step State
  const [hasStartedKyc, setHasStartedKyc] = useState(false);
  const [kycSubStep, setKycSubStep] = useState(1);
  const [kycForm, setKycForm] = useState<Record<string, any>>({
    // Primary Applicant
    appDate: new Date().toISOString().split('T')[0],
    salutation: 'Mr.',
    firstName: '',
    lastName: '',
    email: '',
    phoneCode: '91',
    phoneNumber: '',
    relationType: 'S/o',
    relationNameTitle: 'Mr.',
    relationFirstName: '',
    relationLastName: '',
    dob: '',
    occupation: 'Corporate Employee',
    industry: 'Information Technology',
    company: '',
    residenceType: 'Own Apartment',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    aadhaarNo: '',
    panNo: '',

    // File URLs
    primaryAadhaarUrl: '',
    primaryPanUrl: '',
    primaryVoterIdUrl: '',
    primaryAddressProofUrl: '',

    // Co-Applicant flag & details
    hasCoApplicant: 'No',
    coSalutation: 'Mr.',
    coFirstName: '',
    coLastName: '',
    coEmail: '',
    coPhoneCode: '91',
    coPhoneNumber: '',
    coRelationType: 'S/o',
    coRelationNameTitle: 'Mr.',
    coRelationFirstName: '',
    coRelationLastName: '',
    coDob: '',
    coOccupation: 'Corporate Employee',
    coAadhaarNo: '',
    coPanNo: '',
    coAddressSame: 'Yes',
    coAddressLine1: '',
    coAddressLine2: '',
    coCity: '',
    coState: '',
    coCountry: 'India',
    coPostalCode: '',
    coAadhaarUrl: '',
    coPanUrl: '',
    coVoterIdUrl: '',
    coAddressProofUrl: '',
  });

  const [kycErrors, setKycErrors] = useState<Record<string, string>>({});
  const [kycDraftSuccess, setKycDraftSuccess] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Active stage determination
  const urlStage = searchParams.get('stage');
  const userStage = user?.onboardingStage || 'PROFILE_PENDING';
  const activeStage = urlStage || (userStage === 'COMPLETED' ? 'KYC_PENDING' : userStage);

  // Fetch owned units
  const { data: fetchedUnits } = useQuery({
    queryKey: ['clientUnits'],
    queryFn: () => clientService.getOwnedUnits(),
    enabled: !!user,
  });

  useEffect(() => {
    if (fetchedUnits && Array.isArray(fetchedUnits)) {
      setUnits(fetchedUnits);
    }
  }, [fetchedUnits, setUnits]);

  // Fetch current profile details
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['clientProfile'],
    queryFn: () => clientService.getProfile(),
    enabled: !!user,
  });

  // Fetch unit-scoped KYC application details
  const currentWorkflowId = activeUnit?.workflowId;
  const { data: kycData, isLoading: isKycLoading, refetch: refetchKyc } = useQuery({
    queryKey: ['clientKyc', currentWorkflowId],
    queryFn: () => clientService.getKyc(currentWorkflowId),
    enabled: !!user,
  });

  // Update profile mutation (Shared per customer)
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => clientService.updateProfile(data),
    onSuccess: (response: any) => {
      const updatedProfile = response?.data || response;
      if (updatedProfile) {
        updateUser({
          name: updatedProfile.fullName,
          onboardingStage: 'KYC_PENDING',
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
      refetchProfile();
      // Redirect to My Home after profile completion
      navigate('/my-home');
    },
  });

  // Save KYC draft mutation
  const saveKycDraftMutation = useMutation({
    mutationFn: (data: any) => clientService.saveKycDraft(data, currentWorkflowId),
    onSuccess: () => {
      setKycDraftSuccess(true);
      setTimeout(() => setKycDraftSuccess(false), 3000);
      refetchKyc();
    },
  });

  // Submit KYC mutation
  const submitKycMutation = useMutation({
    mutationFn: (data: any) => clientService.submitKyc(data, currentWorkflowId),
    onSuccess: () => {
      updateUser({
        onboardingStage: 'COMPLETED',
      });
      refetchKyc();
      navigate('/my-home');
    },
  });

  // Reuse KYC mutation
  const reuseKycMutation = useMutation({
    mutationFn: (sourceKycId: string) => {
      if (!currentWorkflowId) throw new Error('No active property unit selected');
      return clientService.reuseKyc(currentWorkflowId, sourceKycId);
    },
    onSuccess: () => {
      refetchKyc();
      navigate('/my-home');
    },
  });

  // Request KYC Modification mutation
  const requestModificationMutation = useMutation({
    mutationFn: (reason: string) => {
      if (!currentWorkflowId) throw new Error('No active property unit selected');
      return clientService.requestKycModification(currentWorkflowId, reason);
    },
    onSuccess: () => {
      refetchKyc();
    },
  });

  // Pre-populate profile form when fetched
  useEffect(() => {
    if (profile) {
      const data = profile.data || profile;
      setProfileForm({
        fullName: data.fullName || user?.name || '',
        phone: data.phone || '',
        panNumber: data.panNumber || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || 'India',
        postalCode: data.postalCode || '',
      });
    }
  }, [profile, user]);

  // Pre-populate KYC draft form if exists
  useEffect(() => {
    if (kycData) {
      const data = kycData.data || kycData;
      if (data.draftData) {
        try {
          const parsed = JSON.parse(data.draftData);
          setKycForm((prev) => ({ ...prev, ...parsed }));
          if (data.isLocked || data.status === 'SUBMITTED' || data.status === 'VERIFIED') {
            setHasStartedKyc(true);
            setKycSubStep(4); // View summary review
          }
        } catch (e) {
          console.error('Failed to parse KYC draft data', e);
        }
      }
    }
  }, [kycData]);

  const calculateCompletion = () => {
    let filled = 0;
    const fields = [
      profileForm.fullName,
      profileForm.phone,
      profileForm.panNumber,
      profileForm.address,
      profileForm.city,
      profileForm.state,
      profileForm.country,
      profileForm.postalCode,
    ];
    fields.forEach((f) => {
      if (f && f.trim() !== '') filled++;
    });
    return Math.round((filled / fields.length) * 100);
  };

  const localCompletion = calculateCompletion();

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!profileForm.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!profileForm.phone.trim()) errors.phone = 'Phone number is required';
    
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!profileForm.panNumber.trim()) {
      errors.panNumber = 'PAN Number is required';
    } else if (!panRegex.test(profileForm.panNumber.trim().toUpperCase())) {
      errors.panNumber = 'Invalid PAN format. Must be like ABCDE1234F';
    }

    if (!profileForm.address.trim()) errors.address = 'Street address is required';
    if (!profileForm.city.trim()) errors.city = 'City is required';
    if (!profileForm.state.trim()) errors.state = 'State is required';
    if (!profileForm.country.trim()) errors.country = 'Country is required';
    if (!profileForm.postalCode.trim()) errors.postalCode = 'Postal / Zip Code is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    updateProfileMutation.mutate({
      ...profileForm,
      panNumber: profileForm.panNumber.trim().toUpperCase(),
    });
  };

  const handleFieldChange = (field: string, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // KYC field changes
  const handleKycFieldChange = (field: string, value: any) => {
    setKycForm((prev) => ({ ...prev, [field]: value }));
    if (kycErrors[field]) {
      setKycErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // KYC File Upload
  const handleKycFileUpload = async (field: string, file: File) => {
    if (!file) return;
    setUploadingField(field);
    try {
      const res: any = await clientService.uploadKycFile(file);
      const fileUrl = res?.fileUrl || res?.data?.fileUrl;
      if (fileUrl) {
        handleKycFieldChange(field, fileUrl);
      } else {
        alert('File upload failed: No file URL returned.');
      }
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Failed to upload document to server.');
    } finally {
      setUploadingField(null);
    }
  };

  // KYC File Remove
  const handleKycFileRemove = (field: string) => {
    handleKycFieldChange(field, '');
  };

  const handleKycSaveDraft = () => {
    saveKycDraftMutation.mutate(kycForm);
  };

  // Step Validation logic
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!kycForm.firstName?.trim()) errors.firstName = 'First name is required';
      if (!kycForm.lastName?.trim()) errors.lastName = 'Last name is required';
      if (!kycForm.email?.trim()) errors.email = 'Email is required';
      if (!kycForm.phoneNumber?.trim()) errors.phoneNumber = 'Phone number is required';
      if (!kycForm.relationFirstName?.trim()) errors.relationFirstName = 'Relation first name is required';
      if (!kycForm.relationLastName?.trim()) errors.relationLastName = 'Relation last name is required';
      if (!kycForm.dob?.trim()) errors.dob = 'Date of birth is required';
      if (!kycForm.addressLine1?.trim()) errors.addressLine1 = 'Street address is required';
      if (!kycForm.city?.trim()) errors.city = 'City is required';
      if (!kycForm.state?.trim()) errors.state = 'State is required';
      if (!kycForm.postalCode?.trim()) errors.postalCode = 'Postal code is required';
      if (!kycForm.aadhaarNo?.trim()) errors.aadhaarNo = 'Aadhaar number is required';
      if (!kycForm.panNo?.trim()) errors.panNo = 'PAN number is required';
    }

    if (step === 2 && kycForm.hasCoApplicant === 'Yes') {
      if (!kycForm.coFirstName?.trim()) errors.coFirstName = 'Co-applicant first name is required';
      if (!kycForm.coLastName?.trim()) errors.coLastName = 'Co-applicant last name is required';
      if (!kycForm.coEmail?.trim()) errors.coEmail = 'Co-applicant email is required';
      if (!kycForm.coPhoneNumber?.trim()) errors.coPhoneNumber = 'Co-applicant phone is required';
      if (!kycForm.coDob?.trim()) errors.coDob = 'Co-applicant date of birth is required';
      if (!kycForm.coAadhaarNo?.trim()) errors.coAadhaarNo = 'Co-applicant Aadhaar is required';
      if (!kycForm.coPanNo?.trim()) errors.coPanNo = 'Co-applicant PAN is required';
    }

    if (step === 3) {
      if (!kycForm.primaryAadhaarUrl) errors.primaryAadhaarUrl = 'Primary Aadhaar upload is required';
      if (!kycForm.primaryPanUrl) errors.primaryPanUrl = 'Primary PAN upload is required';
      if (!kycForm.primaryAddressProofUrl) errors.primaryAddressProofUrl = 'Residence address proof upload is required';

      if (kycForm.hasCoApplicant === 'Yes') {
        if (!kycForm.coAadhaarUrl) errors.coAadhaarUrl = 'Co-applicant Aadhaar upload is required';
        if (!kycForm.coPanUrl) errors.coPanUrl = 'Co-applicant PAN upload is required';
        if (!kycForm.coAddressProofUrl) errors.coAddressProofUrl = 'Co-applicant address proof upload is required';
      }
    }

    setKycErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (kycSubStep < 4) {
      if (validateStep(kycSubStep)) {
        setKycSubStep(kycSubStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // Step 4 Final Submit
      if (validateStep(1) && validateStep(3)) {
        submitKycMutation.mutate(kycForm);
      }
    }
  };

  const handlePrevStep = () => {
    if (kycSubStep > 1) {
      setKycSubStep(kycSubStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isProfileLoading || isKycLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-700" />
      </div>
    );
  }

  const kycDataObj = kycData?.data || kycData;
  const isKycLocked = kycDataObj?.isLocked || kycDataObj?.status === 'SUBMITTED' || kycDataObj?.status === 'VERIFIED';
  const availableVerifiedKycs = kycDataObj?.availableVerifiedKycs || [];

  return (
    <div className="mx-auto max-w-4xl space-y-8 text-left pb-16">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-800 to-brand-900 p-6 text-white shadow-xl dark:from-brand-900 dark:to-brand-950">
        <h1 className="font-serif text-3xl font-bold">GoodEarth Homeowner Account & Verification</h1>
        <p className="mt-2 text-sm text-brand-200">
          Complete your customer profile once and verify identity records for your registered property units.
        </p>
      </div>

      {/* Navigation Pills */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <button
          type="button"
          onClick={() => setSearchParams({ stage: 'PROFILE_PENDING' })}
          className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
            activeStage === 'PROFILE_PENDING'
              ? 'border-brand-500 bg-brand-50/50 dark:border-brand-600 dark:bg-brand-900/20 font-bold'
              : 'border-brand-200 bg-white dark:border-brand-850 dark:bg-brand-900'
          }`}
        >
          <User className="h-4 w-4 text-brand-600" />
          <span className="text-xs font-semibold text-brand-800 dark:text-white">1. Customer Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ stage: 'KYC_PENDING' })}
          className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
            activeStage === 'KYC_PENDING'
              ? 'border-brand-500 bg-brand-50/50 dark:border-brand-600 dark:bg-brand-900/20 font-bold'
              : 'border-brand-200 bg-white dark:border-brand-850 dark:bg-brand-900'
          }`}
        >
          <ClipboardCheck className="h-4 w-4 text-brand-600" />
          <span className="text-xs font-semibold text-brand-800 dark:text-white">
            2. Property KYC ({activeUnit ? activeUnit.unitName : 'Select Unit'})
          </span>
        </button>
      </div>

      {/* Active Stage Content */}
      <div className="space-y-6">
        {activeStage === 'PROFILE_PENDING' && (
          <Card title="Customer Profile" subtitle="Shared profile information filled once for all your GoodEarth properties">
            <div className="mb-6 rounded-xl bg-brand-50/50 p-4 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-850">
              <div className="flex justify-between items-center text-xs font-semibold text-brand-800 dark:text-brand-200">
                <span>Profile Completion Progress</span>
                <span className="font-mono text-brand-700 dark:text-brand-400">{localCompletion}%</span>
              </div>
              <div className="mt-2 h-2.5 w-full rounded-full bg-brand-200 dark:bg-brand-800 overflow-hidden">
                <div
                  className="h-full bg-brand-700 transition-all duration-300 ease-out"
                  style={{ width: `${localCompletion}%` }}
                />
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
                    Full Name <em className="text-red-500">*</em>
                  </label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => handleFieldChange('fullName', e.target.value)}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                  />
                  {formErrors.fullName && <p className="text-red-500 text-[10px] mt-1">{formErrors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full rounded-xl border border-brand-200 bg-brand-100/50 px-3 py-2 text-sm outline-none cursor-not-allowed dark:border-brand-850 dark:bg-brand-900/50 dark:text-brand-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
                    Phone Number <em className="text-red-500">*</em>
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                  />
                  {formErrors.phone && <p className="text-red-500 text-[10px] mt-1">{formErrors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
                    PAN Card Number <em className="text-red-500">*</em>
                  </label>
                  <input
                    type="text"
                    value={profileForm.panNumber}
                    onChange={(e) => handleFieldChange('panNumber', e.target.value)}
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                    className="w-full uppercase rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                  />
                  {formErrors.panNumber && <p className="text-red-500 text-[10px] mt-1">{formErrors.panNumber}</p>}
                </div>
              </div>

              <div className="border-t border-brand-100 dark:border-brand-850 pt-4 mt-6">
                <h4 className="text-xs font-semibold text-brand-800 dark:text-white mb-3 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-brand-400" />
                  Permanent Address
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
                      Street Address <em className="text-red-500">*</em>
                    </label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                    />
                    {formErrors.address && <p className="text-red-500 text-[10px] mt-1">{formErrors.address}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
                        City <em className="text-red-500">*</em>
                      </label>
                      <input
                        type="text"
                        value={profileForm.city}
                        onChange={(e) => handleFieldChange('city', e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                      />
                      {formErrors.city && <p className="text-red-500 text-[10px] mt-1">{formErrors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
                        State / Region <em className="text-red-500">*</em>
                      </label>
                      <input
                        type="text"
                        value={profileForm.state}
                        onChange={(e) => handleFieldChange('state', e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                      />
                      {formErrors.state && <p className="text-red-500 text-[10px] mt-1">{formErrors.state}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
                        Country <em className="text-red-500">*</em>
                      </label>
                      <input
                        type="text"
                        value={profileForm.country}
                        onChange={(e) => handleFieldChange('country', e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
                        Postal / Zip Code <em className="text-red-500">*</em>
                      </label>
                      <input
                        type="text"
                        value={profileForm.postalCode}
                        onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                      />
                      {formErrors.postalCode && <p className="text-red-500 text-[10px] mt-1">{formErrors.postalCode}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {saveSuccess && (
                <div role="alert" className="rounded-xl bg-green-50 p-3 text-xs font-medium text-green-700 border border-green-200 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Profile details saved successfully.
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-5 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      Save & Proceed to My Homes
                      <ChevronRight className="h-4.5 w-4.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Stage 2: Unit-Level KYC Verification */}
        {activeStage === 'KYC_PENDING' && (
          <>
            {!hasStartedKyc && !isKycLocked ? (
              <KycOptionSelector
                availableVerifiedKycs={availableVerifiedKycs}
                onReuseKyc={(sourceKycId) => reuseKycMutation.mutate(sourceKycId)}
                onStartNewKyc={() => setHasStartedKyc(true)}
                isReusing={reuseKycMutation.isPending}
              />
            ) : (
              <div className="space-y-6">
                {!isKycLocked && (
                  <KycWizardHeader
                    currentStep={kycSubStep}
                    onStepClick={(step) => {
                      if (step < kycSubStep || validateStep(kycSubStep)) {
                        setKycSubStep(step);
                      }
                    }}
                  />
                )}

                {kycSubStep === 1 && (
                  <Step1PersonalDetails
                    form={kycForm}
                    errors={kycErrors}
                    onChange={handleKycFieldChange}
                  />
                )}

                {kycSubStep === 2 && (
                  <Step2CoApplicants
                    form={kycForm}
                    errors={kycErrors}
                    onChange={handleKycFieldChange}
                  />
                )}

                {kycSubStep === 3 && (
                  <Step3DocumentVault
                    form={kycForm}
                    errors={kycErrors}
                    uploadingField={uploadingField}
                    onFileUpload={handleKycFileUpload}
                    onFileRemove={handleKycFileRemove}
                  />
                )}

                {kycSubStep === 4 && (
                  <Step4ReviewSubmit
                    form={kycForm}
                    isLocked={isKycLocked}
                    hasPendingModificationRequest={kycDataObj?.hasPendingModificationRequest}
                    modificationRequestReason={kycDataObj?.modificationRequestReason}
                    onEditStep={(step) => setKycSubStep(step)}
                    onRequestModification={(reason) => requestModificationMutation.mutate(reason)}
                    isSubmittingModification={requestModificationMutation.isPending}
                  />
                )}

                {!isKycLocked && (
                  <KycBottomActionBar
                    currentStep={kycSubStep}
                    totalSteps={4}
                    isSubmitting={submitKycMutation.isPending}
                    isSavingDraft={saveKycDraftMutation.isPending}
                    draftSuccess={kycDraftSuccess}
                    onPrevStep={handlePrevStep}
                    onNextStep={handleNextStep}
                    onSaveDraft={handleKycSaveDraft}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
