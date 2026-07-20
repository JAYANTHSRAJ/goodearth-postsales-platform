import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  User,
  ClipboardCheck,
  CreditCard,
  Check,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Loader2,
  Upload,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { useAuthStore } from '../../../store/authStore';
import { clientService } from '../../../services/client.service';

export const OnboardingPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
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

  // KYC Sub-Step State
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
    occupation: 'Private Sector Employee',
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

    // Co-Applicant flag
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
    coOccupation: 'Private Sector Employee',
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

    // Third Applicant flag
    hasThirdApplicant: 'No',
    thirdSalutation: 'Mr.',
    thirdFirstName: '',
    thirdLastName: '',
    thirdEmail: '',
    thirdPhoneCode: '91',
    thirdPhoneNumber: '',
    thirdRelationType: 'S/o',
    thirdRelationNameTitle: 'Mr.',
    thirdRelationFirstName: '',
    thirdRelationLastName: '',
    thirdDob: '',
    thirdOccupation: 'Private Sector Employee',
    thirdAadhaarNo: '',
    thirdPanNo: '',
    thirdAddressSamePrimary: 'Yes',
    thirdAddressSameSecondary: 'No',
    thirdAddressLine1: '',
    thirdAddressLine2: '',
    thirdCity: '',
    thirdState: '',
    thirdCountry: 'India',
    thirdPostalCode: '',
    thirdAadhaarUrl: '',
    thirdPanUrl: '',
    thirdVoterIdUrl: '',
    thirdAddressProofUrl: '',

    // General
    homeLoan: 'No',
  });

  const [kycErrors, setKycErrors] = useState<Record<string, string>>({});
  const [kycDraftSuccess, setKycDraftSuccess] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Fetch current profile details
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['clientProfile'],
    queryFn: () => clientService.getProfile(),
    enabled: !!user,
  });

  // Fetch current KYC application details
  const { data: kycData, isLoading: isKycLoading, refetch: refetchKyc } = useQuery({
    queryKey: ['clientKyc'],
    queryFn: () => clientService.getKyc(),
    enabled: !!user && user?.onboardingStage === 'KYC_PENDING',
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => clientService.updateProfile(data),
    onSuccess: (response: any) => {
      const updatedProfile = response?.data || response;
      if (updatedProfile) {
        updateUser({
          name: updatedProfile.fullName,
          onboardingStage: updatedProfile.onboardingStage,
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
      refetchProfile();
    },
  });

  // Save KYC draft mutation
  const saveKycDraftMutation = useMutation({
    mutationFn: (data: any) => clientService.saveKycDraft(data),
    onSuccess: () => {
      setKycDraftSuccess(true);
      setTimeout(() => setKycDraftSuccess(false), 3000);
      refetchKyc();
    },
  });

  // Submit KYC mutation
  const submitKycMutation = useMutation({
    mutationFn: (data: any) => clientService.submitKyc(data),
    onSuccess: () => {
      updateUser({
        onboardingStage: 'PAYMENT_PENDING',
      });
      refetchKyc();
    },
  });

  // Payment simulation mutation
  const simulatePaymentMutation = useMutation({
    mutationFn: (data: any) => clientService.simulatePayment(data),
    onSuccess: (response: any) => {
      const result = response?.data || response;
      if (result && result.success) {
        updateUser({
          onboardingStage: result.onboardingStage || 'COMPLETED',
        });
      }
    },
  });

  // Pre-populate profile form when fetched
  useEffect(() => {
    if (profile) {
      const data = profile.data || profile;
      setProfileForm({
        fullName: data.fullName || '',
        phone: data.phone || '',
        panNumber: data.panNumber || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || 'India',
        postalCode: data.postalCode || '',
      });
    }
  }, [profile]);

  // Pre-populate KYC draft form if exists
  useEffect(() => {
    if (kycData) {
      const data = kycData.data || kycData;
      if (data.draftData) {
        try {
          const parsed = JSON.parse(data.draftData);
          setKycForm((prev) => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed to parse KYC draft data', e);
        }
      }
    }
  }, [kycData]);

  const activeStage = user?.onboardingStage || 'PROFILE_PENDING';

  // Calculate profile completion percentage
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
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/v1/client/kyc/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.success) {
        handleKycFieldChange(field, data.data.fileUrl);
      } else {
        alert(data.message || 'File upload failed');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to connect to file server.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleKycSaveDraft = () => {
    saveKycDraftMutation.mutate(kycForm);
  };

  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    // Validate Sub-Step 1: Primary Applicant Details
    if (!kycForm.firstName.trim()) errors.firstName = 'First name is required';
    if (!kycForm.lastName.trim()) errors.lastName = 'Last name is required';
    if (!kycForm.email.trim()) errors.email = 'Email is required';
    if (!kycForm.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';
    if (!kycForm.relationFirstName.trim()) errors.relationFirstName = 'Relation first name is required';
    if (!kycForm.relationLastName.trim()) errors.relationLastName = 'Relation last name is required';
    if (!kycForm.dob.trim()) errors.dob = 'Date of birth is required';
    if (!kycForm.addressLine1.trim()) errors.addressLine1 = 'Street address is required';
    if (!kycForm.city.trim()) errors.city = 'City is required';
    if (!kycForm.state.trim()) errors.state = 'State is required';
    if (!kycForm.postalCode.trim()) errors.postalCode = 'Postal Code is required';
    if (!kycForm.aadhaarNo.trim()) errors.aadhaarNo = 'Aadhaar number is required';
    if (!kycForm.panNo.trim()) errors.panNo = 'PAN number is required';

    // Validate document uploads
    if (!kycForm.primaryAadhaarUrl) errors.primaryAadhaarUrl = 'Aadhaar document upload is required';
    if (!kycForm.primaryPanUrl) errors.primaryPanUrl = 'PAN document upload is required';
    if (!kycForm.primaryAddressProofUrl) errors.primaryAddressProofUrl = 'Residence address proof document upload is required';

    // If co-applicant is registered
    if (kycForm.hasCoApplicant === 'Yes') {
      if (!kycForm.coFirstName.trim()) errors.coFirstName = 'Co-applicant first name is required';
      if (!kycForm.coLastName.trim()) errors.coLastName = 'Co-applicant last name is required';
      if (!kycForm.coEmail.trim()) errors.coEmail = 'Co-applicant email is required';
      if (!kycForm.coPhoneNumber.trim()) errors.coPhoneNumber = 'Co-applicant phone is required';
      if (!kycForm.coDob.trim()) errors.coDob = 'Co-applicant date of birth is required';
      if (!kycForm.coAadhaarNo.trim()) errors.coAadhaarNo = 'Co-applicant Aadhaar is required';
      if (!kycForm.coPanNo.trim()) errors.coPanNo = 'Co-applicant PAN is required';
      if (!kycForm.coAadhaarUrl) errors.coAadhaarUrl = 'Co-applicant Aadhaar document is required';
      if (!kycForm.coPanUrl) errors.coPanUrl = 'Co-applicant PAN document is required';
      if (!kycForm.coAddressProofUrl) errors.coAddressProofUrl = 'Co-applicant address proof document is required';
    }

    if (Object.keys(errors).length > 0) {
      setKycErrors(errors);
      // Determine which page contains errors and focus it
      if (errors.firstName || errors.lastName || errors.email || errors.phoneNumber || errors.dob || errors.aadhaarNo) {
        setKycSubStep(1);
      } else if (errors.coFirstName || errors.coLastName || errors.coEmail) {
        setKycSubStep(2);
      } else {
        setKycSubStep(3);
      }
      return;
    }

    setKycErrors({});
    submitKycMutation.mutate(kycForm);
  };

  if (isProfileLoading || isKycLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-700" />
      </div>
    );
  }

  const steps = [
    { key: 'PROFILE_PENDING', label: 'Complete Profile', icon: User },
    { key: 'KYC_PENDING', label: 'KYC Verification', icon: ClipboardCheck },
    { key: 'PAYMENT_PENDING', label: 'Booking Payment', icon: CreditCard },
  ];

  const getStepStatus = (stepKey: string) => {
    const stageOrder = ['PROFILE_PENDING', 'KYC_PENDING', 'PAYMENT_PENDING', 'COMPLETED'];
    const activeIndex = stageOrder.indexOf(activeStage);
    const stepIndex = stageOrder.indexOf(stepKey);

    if (stepIndex < activeIndex) return 'completed';
    if (stepIndex === activeIndex) return 'active';
    return 'locked';
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 text-left pb-16">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-800 to-brand-900 p-6 text-white shadow-xl dark:from-brand-900 dark:to-brand-950">
        <h1 className="font-serif text-3xl font-bold">Welcome to GoodEarth Homeowner Portal</h1>
        <p className="mt-2 text-sm text-brand-200">
          Before getting full access to the portal, we need you to complete three simple onboarding milestones to verify your registry records and prepare your legal agreement.
        </p>
      </div>

      {/* Stepper Progress Indicator */}
      <div className="grid grid-cols-3 gap-4">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.key);
          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 rounded-xl border p-4 transition-all duration-200 ${
                status === 'active'
                  ? 'border-brand-500 bg-brand-50/50 dark:border-brand-600 dark:bg-brand-900/20'
                  : status === 'completed'
                  ? 'border-green-200 bg-green-50/20 dark:border-green-900/20'
                  : 'border-brand-200 opacity-60 bg-white dark:border-brand-850 dark:bg-brand-900'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  status === 'completed'
                    ? 'bg-green-600 text-white'
                    : status === 'active'
                    ? 'bg-brand-700 text-white'
                    : 'bg-brand-100 text-brand-500 dark:bg-brand-800'
                }`}
              >
                {status === 'completed' ? <Check className="h-5 w-5" /> : idx + 1}
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-400">
                  Step {idx + 1}
                </span>
                <span className="block truncate text-xs font-semibold text-brand-800 dark:text-white">
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Step Content */}
      <div className="space-y-6">
        {activeStage === 'PROFILE_PENDING' && (
          <Card title="Stage 1: Complete Personal Profile" subtitle="Verify and complete your official contact details">
            {/* Dynamic completion meter */}
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
              <p className="mt-2 text-[10px] text-brand-450 leading-relaxed">
                Provide details across all fields. Stage 2 (KYC Verification) will unlock automatically when progress reaches 100%.
              </p>
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
                      placeholder="e.g. Flat/House No., Building Name, Street Name"
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
                      {formErrors.country && <p className="text-red-500 text-[10px] mt-1">{formErrors.country}</p>}
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
                      Save & Continue
                      <ChevronRight className="h-4.5 w-4.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </Card>
        )}

        {activeStage === 'KYC_PENDING' && (
          <Card
            title="Stage 2: KYC Verification Wizard"
            subtitle="Register applicant details, nominee assignments, and identity uploads"
          >
            {/* KYC Wizard Stepper */}
            <div className="flex justify-between items-center border-b border-brand-100 dark:border-brand-850 pb-4 mb-6">
              <div className="flex gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setKycSubStep(1)}
                  className={`px-3 py-1.5 rounded-lg ${
                    kycSubStep === 1
                      ? 'bg-brand-700 text-white'
                      : 'bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300'
                  }`}
                >
                  1. Primary Applicant
                </button>
                <button
                  type="button"
                  onClick={() => setKycSubStep(2)}
                  className={`px-3 py-1.5 rounded-lg ${
                    kycSubStep === 2
                      ? 'bg-brand-700 text-white'
                      : 'bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300'
                  }`}
                >
                  2. Co-Applicants
                </button>
                <button
                  type="button"
                  onClick={() => setKycSubStep(3)}
                  className={`px-3 py-1.5 rounded-lg ${
                    kycSubStep === 3
                      ? 'bg-brand-700 text-white'
                      : 'bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300'
                  }`}
                >
                  3. Documents & Sign
                </button>
              </div>
              <button
                type="button"
                onClick={handleKycSaveDraft}
                disabled={saveKycDraftMutation.isPending}
                className="text-xs font-semibold text-brand-650 hover:text-brand-900 flex items-center gap-1.5"
              >
                {saveKycDraftMutation.isPending ? 'Saving...' : 'Save Draft'}
              </button>
            </div>

            {kycDraftSuccess && (
              <div role="alert" className="mb-4 rounded-xl bg-green-50 p-3 text-xs font-medium text-green-700 border border-green-200 flex items-center gap-2">
                <Check className="h-4 w-4" />
                KYC Draft saved successfully.
              </div>
            )}

            <form onSubmit={handleKycSubmit} className="space-y-6">
              {/* SUB-STEP 1: PRIMARY APPLICANT */}
              {kycSubStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-sm font-semibold text-brand-900 dark:text-white">Primary Applicant Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Title</label>
                      <select
                        value={kycForm.salutation}
                        onChange={(e) => handleKycFieldChange('salutation', e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                      >
                        <option>Mr.</option>
                        <option>Mrs.</option>
                        <option>Ms.</option>
                        <option>Dr.</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={kycForm.firstName}
                        onChange={(e) => handleKycFieldChange('firstName', e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                      />
                      {kycErrors.firstName && <p className="text-red-500 text-[10px] mt-1">{kycErrors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={kycForm.lastName}
                        onChange={(e) => handleKycFieldChange('lastName', e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                      />
                      {kycErrors.lastName && <p className="text-red-500 text-[10px] mt-1">{kycErrors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={kycForm.email}
                        onChange={(e) => handleKycFieldChange('email', e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                      />
                      {kycErrors.email && <p className="text-red-500 text-[10px] mt-1">{kycErrors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Phone Number *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={kycForm.phoneCode}
                          onChange={(e) => handleKycFieldChange('phoneCode', e.target.value)}
                          className="w-16 rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm text-center outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                          placeholder="Code"
                        />
                        <input
                          type="text"
                          value={kycForm.phoneNumber}
                          onChange={(e) => handleKycFieldChange('phoneNumber', e.target.value)}
                          className="flex-1 rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                        />
                      </div>
                      {kycErrors.phoneNumber && <p className="text-red-500 text-[10px] mt-1">{kycErrors.phoneNumber}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Relationship Type *</label>
                      <select
                        value={kycForm.relationType}
                        onChange={(e) => handleKycFieldChange('relationType', e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                      >
                        <option>S/o</option>
                        <option>W/o</option>
                        <option>D/o</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Title</label>
                        <select
                          value={kycForm.relationNameTitle}
                          onChange={(e) => handleKycFieldChange('relationNameTitle', e.target.value)}
                          className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-2 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                        >
                          <option>Mr.</option>
                          <option>Mrs.</option>
                          <option>Ms.</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Relative First Name *</label>
                        <input
                          type="text"
                          value={kycForm.relationFirstName}
                          onChange={(e) => handleKycFieldChange('relationFirstName', e.target.value)}
                          className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                        />
                        {kycErrors.relationFirstName && <p className="text-red-500 text-[10px] mt-1">{kycErrors.relationFirstName}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Relative Last Name *</label>
                      <input
                        type="text"
                        value={kycForm.relationLastName}
                        onChange={(e) => handleKycFieldChange('relationLastName', e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                      />
                      {kycErrors.relationLastName && <p className="text-red-500 text-[10px] mt-1">{kycErrors.relationLastName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        value={kycForm.dob}
                        onChange={(e) => handleKycFieldChange('dob', e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                      />
                      {kycErrors.dob && <p className="text-red-500 text-[10px] mt-1">{kycErrors.dob}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Occupation</label>
                      <select
                        value={kycForm.occupation}
                        onChange={(e) => handleKycFieldChange('occupation', e.target.value)}
                        className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                      >
                        <option>Private Sector Employee</option>
                        <option>Government Employee</option>
                        <option>Business</option>
                        <option>Homemaker</option>
                        <option>Retired</option>
                        <option>Agriculturist</option>
                        <option>Doctor</option>
                        <option>Lawyer</option>
                        <option>Architect</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-brand-100 dark:border-brand-850 pt-4 mt-6">
                    <h4 className="text-xs font-semibold text-brand-800 dark:text-white mb-3">Address (As matching with Address Proof)</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Street Address *</label>
                        <input
                          type="text"
                          value={kycForm.addressLine1}
                          onChange={(e) => handleKycFieldChange('addressLine1', e.target.value)}
                          className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                        />
                        {kycErrors.addressLine1 && <p className="text-red-500 text-[10px] mt-1">{kycErrors.addressLine1}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">City *</label>
                          <input
                            type="text"
                            value={kycForm.city}
                            onChange={(e) => handleKycFieldChange('city', e.target.value)}
                            className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                          />
                          {kycErrors.city && <p className="text-red-500 text-[10px] mt-1">{kycErrors.city}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">State / Province *</label>
                          <input
                            type="text"
                            value={kycForm.state}
                            onChange={(e) => handleKycFieldChange('state', e.target.value)}
                            className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                          />
                          {kycErrors.state && <p className="text-red-500 text-[10px] mt-1">{kycErrors.state}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Country</label>
                          <input
                            type="text"
                            value={kycForm.country}
                            onChange={(e) => handleKycFieldChange('country', e.target.value)}
                            className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Postal / Zip Code *</label>
                          <input
                            type="text"
                            value={kycForm.postalCode}
                            onChange={(e) => handleKycFieldChange('postalCode', e.target.value)}
                            className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                          />
                          {kycErrors.postalCode && <p className="text-red-500 text-[10px] mt-1">{kycErrors.postalCode}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-brand-100 dark:border-brand-850 pt-4 mt-6">
                    <div>
                      <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Aadhaar Number *</label>
                      <input
                        type="text"
                        value={kycForm.aadhaarNo}
                        onChange={(e) => handleKycFieldChange('aadhaarNo', e.target.value)}
                        placeholder="12 digits"
                        maxLength={12}
                        className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                      />
                      {kycErrors.aadhaarNo && <p className="text-red-500 text-[10px] mt-1">{kycErrors.aadhaarNo}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">PAN Card Number *</label>
                      <input
                        type="text"
                        value={kycForm.panNo}
                        onChange={(e) => handleKycFieldChange('panNo', e.target.value)}
                        maxLength={10}
                        className="w-full uppercase rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                      />
                      {kycErrors.panNo && <p className="text-red-500 text-[10px] mt-1">{kycErrors.panNo}</p>}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setKycSubStep(2)}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-5 py-2.5 text-xs font-semibold transition-colors"
                    >
                      Next: Co-Applicants
                      <ChevronRight className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* SUB-STEP 2: CO-APPLICANTS */}
              {kycSubStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-brand-800 dark:text-white mb-2">
                      Do you have a co-applicant?
                    </label>
                    <select
                      value={kycForm.hasCoApplicant}
                      onChange={(e) => handleKycFieldChange('hasCoApplicant', e.target.value)}
                      className="w-full max-w-xs rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes (Add Second Applicant)</option>
                    </select>
                  </div>

                  {kycForm.hasCoApplicant === 'Yes' && (
                    <div className="space-y-4 border-t border-brand-100 dark:border-brand-850 pt-4">
                      <h3 className="font-serif text-sm font-semibold text-brand-900 dark:text-white">Second Applicant Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Title</label>
                          <select
                            value={kycForm.coSalutation}
                            onChange={(e) => handleKycFieldChange('coSalutation', e.target.value)}
                            className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                          >
                            <option>Mr.</option>
                            <option>Mrs.</option>
                            <option>Ms.</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">First Name *</label>
                          <input
                            type="text"
                            value={kycForm.coFirstName}
                            onChange={(e) => handleKycFieldChange('coFirstName', e.target.value)}
                            className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                          />
                          {kycErrors.coFirstName && <p className="text-red-500 text-[10px] mt-1">{kycErrors.coFirstName}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Last Name *</label>
                          <input
                            type="text"
                            value={kycForm.coLastName}
                            onChange={(e) => handleKycFieldChange('coLastName', e.target.value)}
                            className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                          />
                          {kycErrors.coLastName && <p className="text-red-500 text-[10px] mt-1">{kycErrors.coLastName}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Email Address *</label>
                          <input
                            type="email"
                            value={kycForm.coEmail}
                            onChange={(e) => handleKycFieldChange('coEmail', e.target.value)}
                            className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                          />
                          {kycErrors.coEmail && <p className="text-red-500 text-[10px] mt-1">{kycErrors.coEmail}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Phone Number *</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={kycForm.coPhoneCode}
                              onChange={(e) => handleKycFieldChange('coPhoneCode', e.target.value)}
                              className="w-16 rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm text-center outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                            />
                            <input
                              type="text"
                              value={kycForm.coPhoneNumber}
                              onChange={(e) => handleKycFieldChange('coPhoneNumber', e.target.value)}
                              className="flex-1 rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                            />
                          </div>
                          {kycErrors.coPhoneNumber && <p className="text-red-500 text-[10px] mt-1">{kycErrors.coPhoneNumber}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Relationship Type</label>
                          <select
                            value={kycForm.coRelationType}
                            onChange={(e) => handleKycFieldChange('coRelationType', e.target.value)}
                            className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                          >
                            <option>S/o</option>
                            <option>W/o</option>
                            <option>D/o</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Date of Birth *</label>
                          <input
                            type="date"
                            value={kycForm.coDob}
                            onChange={(e) => handleKycFieldChange('coDob', e.target.value)}
                            className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                          />
                          {kycErrors.coDob && <p className="text-red-500 text-[10px] mt-1">{kycErrors.coDob}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Occupation</label>
                          <select
                            value={kycForm.coOccupation}
                            onChange={(e) => handleKycFieldChange('coOccupation', e.target.value)}
                            className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                          >
                            <option>Private Sector Employee</option>
                            <option>Government Employee</option>
                            <option>Business</option>
                            <option>Homemaker</option>
                            <option>Retired</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Aadhaar Number *</label>
                          <input
                            type="text"
                            value={kycForm.coAadhaarNo}
                            onChange={(e) => handleKycFieldChange('coAadhaarNo', e.target.value)}
                            maxLength={12}
                            className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                          />
                          {kycErrors.coAadhaarNo && <p className="text-red-500 text-[10px] mt-1">{kycErrors.coAadhaarNo}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">PAN Card Number *</label>
                          <input
                            type="text"
                            value={kycForm.coPanNo}
                            onChange={(e) => handleKycFieldChange('coPanNo', e.target.value)}
                            maxLength={10}
                            className="w-full uppercase rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                          />
                          {kycErrors.coPanNo && <p className="text-red-500 text-[10px] mt-1">{kycErrors.coPanNo}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
                          Is Co-Applicant Address Same as Primary Applicant?
                        </label>
                        <select
                          value={kycForm.coAddressSame}
                          onChange={(e) => handleKycFieldChange('coAddressSame', e.target.value)}
                          className="w-full max-w-xs rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {kycForm.coAddressSame === 'No' && (
                        <div className="space-y-4 border border-brand-100 rounded-xl p-4 bg-brand-50/20">
                          <div>
                            <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Street Address</label>
                            <input
                              type="text"
                              value={kycForm.coAddressLine1}
                              onChange={(e) => handleKycFieldChange('coAddressLine1', e.target.value)}
                              className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">City</label>
                              <input
                                type="text"
                                value={kycForm.coCity}
                                onChange={(e) => handleKycFieldChange('coCity', e.target.value)}
                                className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">State</label>
                              <input
                                type="text"
                                value={kycForm.coState}
                                onChange={(e) => handleKycFieldChange('coState', e.target.value)}
                                className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm outline-none"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Country</label>
                              <input
                                type="text"
                                value={kycForm.coCountry}
                                onChange={(e) => handleKycFieldChange('coCountry', e.target.value)}
                                className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Postal Code</label>
                              <input
                                type="text"
                                value={kycForm.coPostalCode}
                                onChange={(e) => handleKycFieldChange('coPostalCode', e.target.value)}
                                className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between pt-4 border-t border-brand-100 dark:border-brand-850">
                    <button
                      type="button"
                      onClick={() => setKycSubStep(1)}
                      className="inline-flex items-center gap-2 rounded-xl border border-brand-200 hover:bg-brand-50 px-4 py-2.5 text-xs font-semibold text-brand-850 transition-colors"
                    >
                      <ChevronLeft className="h-4.5 w-4.5" />
                      Back to Primary details
                    </button>
                    <button
                      type="button"
                      onClick={() => setKycSubStep(3)}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-5 py-2.5 text-xs font-semibold transition-colors"
                    >
                      Next: Documents
                      <ChevronRight className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* SUB-STEP 3: DOCUMENT UPLOADS */}
              {kycSubStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-serif text-sm font-semibold text-brand-900 dark:text-white">Document Proof Uploads</h3>
                    <p className="text-[10px] text-brand-450">
                      Upload clear PDF or JPG scans of your identity credentials. Maximum file size is 5MB per document.
                    </p>

                    {/* Aadhaar File Upload */}
                    <div className="border border-brand-100 dark:border-brand-850 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-brand-800 dark:text-brand-200 flex items-center gap-1">
                          Primary Applicant Aadhaar Proof *
                        </span>
                        <label className="cursor-pointer inline-flex items-center gap-1 bg-brand-50 border border-brand-200 hover:bg-brand-100 text-brand-700 text-[10px] font-bold px-3 py-1.5 rounded-lg dark:bg-brand-900 dark:border-brand-800 dark:text-brand-300">
                          <Upload className="h-3 w-3" />
                          Choose File
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            className="hidden"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files[0]) handleKycFileUpload('primaryAadhaarUrl', files[0]);
                            }}
                          />
                        </label>
                      </div>
                      {kycForm.primaryAadhaarUrl ? (
                        <div className="flex items-center gap-2 text-[10px] text-green-700 bg-green-50/30 p-2 rounded-lg border border-green-200/50">
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          <span>Uploaded: <a href={kycForm.primaryAadhaarUrl} target="_blank" rel="noreferrer" className="underline font-semibold">View Document</a></span>
                        </div>
                      ) : uploadingField === 'primaryAadhaarUrl' ? (
                        <div className="flex items-center gap-2 text-[10px] text-brand-600">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-brand-400">No document uploaded yet</p>
                      )}
                      {kycErrors.primaryAadhaarUrl && <p className="text-red-500 text-[10px]">{kycErrors.primaryAadhaarUrl}</p>}
                    </div>

                    {/* PAN File Upload */}
                    <div className="border border-brand-100 dark:border-brand-850 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-brand-800 dark:text-brand-200 flex items-center gap-1">
                          Primary Applicant PAN Card *
                        </span>
                        <label className="cursor-pointer inline-flex items-center gap-1 bg-brand-50 border border-brand-200 hover:bg-brand-100 text-brand-700 text-[10px] font-bold px-3 py-1.5 rounded-lg dark:bg-brand-900 dark:border-brand-800 dark:text-brand-300">
                          <Upload className="h-3 w-3" />
                          Choose File
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            className="hidden"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files[0]) handleKycFileUpload('primaryPanUrl', files[0]);
                            }}
                          />
                        </label>
                      </div>
                      {kycForm.primaryPanUrl ? (
                        <div className="flex items-center gap-2 text-[10px] text-green-700 bg-green-50/30 p-2 rounded-lg border border-green-200/50">
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          <span>Uploaded: <a href={kycForm.primaryPanUrl} target="_blank" rel="noreferrer" className="underline font-semibold">View Document</a></span>
                        </div>
                      ) : uploadingField === 'primaryPanUrl' ? (
                        <div className="flex items-center gap-2 text-[10px] text-brand-600">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-brand-400">No document uploaded yet</p>
                      )}
                      {kycErrors.primaryPanUrl && <p className="text-red-500 text-[10px]">{kycErrors.primaryPanUrl}</p>}
                    </div>

                    {/* Address Proof File Upload */}
                    <div className="border border-brand-100 dark:border-brand-850 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-brand-800 dark:text-brand-200">
                          Residence and Identification Address Proof *
                          <p className="text-[9px] font-normal text-brand-400">Driving License / Passport / OCI / Aadhaar</p>
                        </span>
                        <label className="cursor-pointer inline-flex items-center gap-1 bg-brand-50 border border-brand-200 hover:bg-brand-100 text-brand-700 text-[10px] font-bold px-3 py-1.5 rounded-lg dark:bg-brand-900 dark:border-brand-800 dark:text-brand-300">
                          <Upload className="h-3 w-3" />
                          Choose File
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            className="hidden"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files[0]) handleKycFileUpload('primaryAddressProofUrl', files[0]);
                            }}
                          />
                        </label>
                      </div>
                      {kycForm.primaryAddressProofUrl ? (
                        <div className="flex items-center gap-2 text-[10px] text-green-700 bg-green-50/30 p-2 rounded-lg border border-green-200/50">
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          <span>Uploaded: <a href={kycForm.primaryAddressProofUrl} target="_blank" rel="noreferrer" className="underline font-semibold">View Document</a></span>
                        </div>
                      ) : uploadingField === 'primaryAddressProofUrl' ? (
                        <div className="flex items-center gap-2 text-[10px] text-brand-600">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-brand-400">No document uploaded yet</p>
                      )}
                      {kycErrors.primaryAddressProofUrl && <p className="text-red-500 text-[10px]">{kycErrors.primaryAddressProofUrl}</p>}
                    </div>

                    {/* Co-applicant Uploads if enabled */}
                    {kycForm.hasCoApplicant === 'Yes' && (
                      <div className="space-y-4 border-t border-brand-100 dark:border-brand-850 pt-4 mt-6">
                        <h4 className="text-xs font-semibold text-brand-800 dark:text-white">Co-Applicant Document Proofs</h4>
                        
                        <div className="border border-brand-100 dark:border-brand-850 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-brand-800 dark:text-brand-200">Co-Applicant Aadhaar Proof *</span>
                            <label className="cursor-pointer inline-flex items-center gap-1 bg-brand-50 border border-brand-200 hover:bg-brand-100 text-brand-700 text-[10px] font-bold px-3 py-1.5 rounded-lg dark:bg-brand-900 dark:border-brand-800 dark:text-brand-300">
                              <Upload className="h-3 w-3" />
                              Choose File
                              <input
                                type="file"
                                accept="application/pdf,image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files && files[0]) handleKycFileUpload('coAadhaarUrl', files[0]);
                                }}
                              />
                            </label>
                          </div>
                          {kycForm.coAadhaarUrl ? (
                            <div className="flex items-center gap-2 text-[10px] text-green-700 bg-green-50/30 p-2 rounded-lg border border-green-200/50">
                              <Check className="h-3.5 w-3.5 shrink-0" />
                              <span>Uploaded: <a href={kycForm.coAadhaarUrl} target="_blank" rel="noreferrer" className="underline font-semibold">View Document</a></span>
                            </div>
                          ) : uploadingField === 'coAadhaarUrl' ? (
                            <div className="flex items-center gap-2 text-[10px] text-brand-600">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-brand-400">No document uploaded yet</p>
                          )}
                          {kycErrors.coAadhaarUrl && <p className="text-red-500 text-[10px]">{kycErrors.coAadhaarUrl}</p>}
                        </div>

                        <div className="border border-brand-100 dark:border-brand-850 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-brand-800 dark:text-brand-200">Co-Applicant PAN Card *</span>
                            <label className="cursor-pointer inline-flex items-center gap-1 bg-brand-50 border border-brand-200 hover:bg-brand-100 text-brand-700 text-[10px] font-bold px-3 py-1.5 rounded-lg dark:bg-brand-900 dark:border-brand-800 dark:text-brand-300">
                              <Upload className="h-3 w-3" />
                              Choose File
                              <input
                                type="file"
                                accept="application/pdf,image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files && files[0]) handleKycFileUpload('coPanUrl', files[0]);
                                }}
                              />
                            </label>
                          </div>
                          {kycForm.coPanUrl ? (
                            <div className="flex items-center gap-2 text-[10px] text-green-700 bg-green-50/30 p-2 rounded-lg border border-green-200/50">
                              <Check className="h-3.5 w-3.5 shrink-0" />
                              <span>Uploaded: <a href={kycForm.coPanUrl} target="_blank" rel="noreferrer" className="underline font-semibold">View Document</a></span>
                            </div>
                          ) : uploadingField === 'coPanUrl' ? (
                            <div className="flex items-center gap-2 text-[10px] text-brand-600">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-brand-400">No document uploaded yet</p>
                          )}
                          {kycErrors.coPanUrl && <p className="text-red-500 text-[10px]">{kycErrors.coPanUrl}</p>}
                        </div>

                        <div className="border border-brand-100 dark:border-brand-850 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-brand-800 dark:text-brand-200 font-sans">Co-Applicant Residence and Identification Proof *</span>
                            <label className="cursor-pointer inline-flex items-center gap-1 bg-brand-50 border border-brand-200 hover:bg-brand-100 text-brand-700 text-[10px] font-bold px-3 py-1.5 rounded-lg dark:bg-brand-900 dark:border-brand-800 dark:text-brand-300">
                              <Upload className="h-3 w-3" />
                              Choose File
                              <input
                                type="file"
                                accept="application/pdf,image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files && files[0]) handleKycFileUpload('coAddressProofUrl', files[0]);
                                }}
                              />
                            </label>
                          </div>
                          {kycForm.coAddressProofUrl ? (
                            <div className="flex items-center gap-2 text-[10px] text-green-700 bg-green-50/30 p-2 rounded-lg border border-green-200/50">
                              <Check className="h-3.5 w-3.5 shrink-0" />
                              <span>Uploaded: <a href={kycForm.coAddressProofUrl} target="_blank" rel="noreferrer" className="underline font-semibold">View Document</a></span>
                            </div>
                          ) : uploadingField === 'coAddressProofUrl' ? (
                            <div className="flex items-center gap-2 text-[10px] text-brand-600">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-brand-400">No document uploaded yet</p>
                          )}
                          {kycErrors.coAddressProofUrl && <p className="text-red-500 text-[10px]">{kycErrors.coAddressProofUrl}</p>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-brand-100 dark:border-brand-850 pt-4 mt-6">
                    <h3 className="font-serif text-sm font-semibold text-brand-900 dark:text-white mb-3">Preferences & Declarations</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
                          Are you considering a home loan for this property purchase?
                        </label>
                        <select
                          value={kycForm.homeLoan}
                          onChange={(e) => handleKycFieldChange('homeLoan', e.target.value)}
                          className="w-full max-w-xs rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>

                      <div className="rounded-xl border border-brand-200 bg-brand-50/20 p-4 text-xs dark:border-brand-850 dark:bg-brand-900/30">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" required className="mt-1 rounded accent-brand-700" />
                          <span className="leading-relaxed text-brand-700 dark:text-brand-300">
                            I/We hereby declare that all details and documentation submitted above are true, complete, and match exactly with my/our identification proof registry credentials.
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-brand-100 dark:border-brand-850">
                    <button
                      type="button"
                      onClick={() => setKycSubStep(2)}
                      className="inline-flex items-center gap-2 rounded-xl border border-brand-200 hover:bg-brand-50 px-4 py-2.5 text-xs font-semibold text-brand-850 transition-colors"
                    >
                      <ChevronLeft className="h-4.5 w-4.5" />
                      Back to Co-applicants
                    </button>
                    <button
                      type="submit"
                      disabled={submitKycMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-5 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {submitKycMutation.isPending ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin" />
                          Submitting KYC...
                        </>
                      ) : (
                        <>
                          Submit KYC Verification
                          <ChevronRight className="h-4.5 w-4.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </Card>
        )}

        {activeStage === 'PAYMENT_PENDING' && (
          <Card title="Stage 3: Booking Fee Verification" subtitle="Finalize registration by submitting the booking token fee">
            <div className="border-t border-brand-100 dark:border-brand-850 pt-6 space-y-6">
              <div className="rounded-xl bg-brand-50/50 p-6 border border-brand-100 dark:bg-brand-900/10 dark:border-brand-800 space-y-4">
                <h4 className="font-serif text-sm font-semibold text-brand-900 dark:text-white">Transaction Summary</h4>
                <div className="divide-y divide-brand-100 dark:divide-brand-800 text-xs font-semibold text-brand-700 dark:text-brand-300">
                  <div className="py-2.5 flex justify-between">
                    <span>Description</span>
                    <span className="text-brand-900 dark:text-white">GoodEarth Homeowner Booking Verification Token</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span>Registry Account ID</span>
                    <span className="font-mono text-brand-900 dark:text-white">{user?.id.substring(0, 8).toUpperCase()}-MOCK</span>
                  </div>
                  <div className="py-2.5 flex justify-between text-sm font-bold text-brand-900 dark:text-white">
                    <span>Amount Due</span>
                    <span>₹50,000.00</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50/50 p-4 border border-amber-200/50 text-[10px] leading-relaxed text-amber-800 dark:bg-amber-950/10 dark:border-amber-900/30 dark:text-amber-300">
                <strong>Dummy Payment Simulation Mode:</strong> Under development guidelines, this step processes the payment request through the backend `DummyPaymentProvider` which simulates a successful banking settlement automatically. No real funds will be transacted.
              </div>

              <div className="flex justify-end pt-4 border-t border-brand-100 dark:border-brand-850">
                <button
                  type="button"
                  disabled={simulatePaymentMutation.isPending}
                  onClick={() =>
                    simulatePaymentMutation.mutate({
                      amount: 50000,
                      currency: 'INR',
                      orderId: 'MOCK-ORDER-' + Math.floor(Math.random() * 100000),
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-6 py-3 text-xs font-bold tracking-wide uppercase transition-colors disabled:opacity-50"
                >
                  {simulatePaymentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      Authorizing simulated payment...
                    </>
                  ) : (
                    <>
                      Pay Booking Fee (Simulated)
                      <ChevronRight className="h-4.5 w-4.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
