import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useUnitStore } from '../../../store/unitStore';
import { clientService } from '../../../services/client.service';
import { KycOptionSelector } from '../components/KycOptionSelector';
import { KycWizardHeader } from '../components/KycWizardHeader';
import { KycBottomActionBar } from '../components/KycBottomActionBar';
import { Step1PersonalDetails } from '../components/wizard-steps/Step1PersonalDetails';
import { Step2IdentityDetails } from '../components/wizard-steps/Step2IdentityDetails';
import { Step3AddressDetails } from '../components/wizard-steps/Step3AddressDetails';
import { Step4EmploymentDetails } from '../components/wizard-steps/Step4EmploymentDetails';
import { Step5NomineeDetails } from '../components/wizard-steps/Step5NomineeDetails';
import { Step6BankDetails } from '../components/wizard-steps/Step6BankDetails';
import { Step7TaxDetails } from '../components/wizard-steps/Step7TaxDetails';
import { Step8DocumentUploads } from '../components/wizard-steps/Step8DocumentUploads';
import { Step9ReviewSummary } from '../components/wizard-steps/Step9ReviewSummary';
import { Step10FinalSubmit } from '../components/wizard-steps/Step10FinalSubmit';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { activeUnit, setUnits } = useUnitStore();

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
    bankProofUrl: '',

    // Bank & Tax
    bankAccountName: '',
    bankName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    taxResidency: 'Resident Indian',
    gstinNo: '',

    // Nominee
    nomineeName: '',
    nomineeRelation: 'Spouse',
    nomineeDob: '',
    nomineePhone: '',
  });

  const [kycErrors, setKycErrors] = useState<Record<string, string>>({});
  const [kycDraftSuccess, setKycDraftSuccess] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

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

  // Fetch unit-scoped KYC application details
  const currentWorkflowId = activeUnit?.workflowId;
  const { data: kycData, refetch: refetchKyc } = useQuery({
    queryKey: ['clientKyc', currentWorkflowId],
    queryFn: () => clientService.getKyc(currentWorkflowId),
    enabled: !!user,
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
            setKycSubStep(9); // View summary review
          }
        } catch (e) {
          console.error('Failed to parse KYC draft data', e);
        }
      }
    }
  }, [kycData]);

  const handleKycFieldChange = (field: string, value: any) => {
    setKycForm((prev) => ({ ...prev, [field]: value }));
    if (kycErrors[field]) {
      setKycErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSaveDraft = () => {
    saveKycDraftMutation.mutate(kycForm);
  };

  const handleNextStep = () => {
    if (kycSubStep < 10) {
      setKycSubStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (kycSubStep > 1) {
      setKycSubStep((prev) => prev - 1);
    }
  };

  const handleKycSubmit = () => {
    submitKycMutation.mutate(kycForm);
  };

  const availableVerifiedKycs = (fetchedUnits || []).filter(
    (u: any) => (u.isKycVerified || u.kycStatus === 'SUBMITTED' || u.kycStatus === 'VERIFIED') && u.id !== activeUnit?.id
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 text-left">
      {/* Property Unit Context Banner */}
      {activeUnit && (
        <div className="p-4 rounded-2xl bg-brand-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center font-bold">
              🏠
            </div>
            <div>
              <span className="text-[10px] font-semibold text-brand-300 uppercase tracking-wider">Target Property Unit</span>
              <h3 className="text-sm font-bold">{activeUnit.unitName}</h3>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {activeUnit.kycStatus || 'KYC Pending'}
          </span>
        </div>
      )}

      {/* KYC Choice Screen or Wizard */}
      {!hasStartedKyc ? (
        <KycOptionSelector
          availableVerifiedKycs={availableVerifiedKycs}
          onReuseKyc={(sourceId) => reuseKycMutation.mutate(sourceId)}
          onStartNewKyc={() => setHasStartedKyc(true)}
          isReusing={reuseKycMutation.isPending}
        />
      ) : (
        <div className="space-y-6">
          <KycWizardHeader
            currentStep={kycSubStep}
            onStepClick={(step) => setKycSubStep(step)}
          />

          {kycSubStep === 1 && (
            <Step1PersonalDetails
              form={kycForm}
              onChange={handleKycFieldChange}
              errors={kycErrors}
            />
          )}

          {kycSubStep === 2 && (
            <Step2IdentityDetails
              form={kycForm}
              onChange={handleKycFieldChange}
              errors={kycErrors}
            />
          )}

          {kycSubStep === 3 && (
            <Step3AddressDetails
              form={kycForm}
              onChange={handleKycFieldChange}
              errors={kycErrors}
            />
          )}

          {kycSubStep === 4 && (
            <Step4EmploymentDetails
              form={kycForm}
              onChange={handleKycFieldChange}
              errors={kycErrors}
            />
          )}

          {kycSubStep === 5 && (
            <Step5NomineeDetails
              form={kycForm}
              onChange={handleKycFieldChange}
              errors={kycErrors}
            />
          )}

          {kycSubStep === 6 && (
            <Step6BankDetails
              form={kycForm}
              onChange={handleKycFieldChange}
              errors={kycErrors}
            />
          )}

          {kycSubStep === 7 && (
            <Step7TaxDetails
              form={kycForm}
              onChange={handleKycFieldChange}
              errors={kycErrors}
            />
          )}

          {kycSubStep === 8 && (
            <Step8DocumentUploads
              form={kycForm}
              onChange={handleKycFieldChange}
              uploadingField={uploadingField}
              setUploadingField={setUploadingField}
              errors={kycErrors}
            />
          )}

          {kycSubStep === 9 && (
            <Step9ReviewSummary
              form={kycForm}
              onJumpToStep={(step) => setKycSubStep(step)}
            />
          )}

          {kycSubStep === 10 && (
            <Step10FinalSubmit
              form={kycForm}
              onSubmit={handleKycSubmit}
              isSubmitting={submitKycMutation.isPending}
            />
          )}

          <KycBottomActionBar
            currentStep={kycSubStep}
            totalSteps={10}
            isSubmitting={submitKycMutation.isPending}
            isSavingDraft={saveKycDraftMutation.isPending}
            draftSuccess={kycDraftSuccess}
            onPrevStep={handlePrevStep}
            onNextStep={handleNextStep}
            onSaveDraft={handleSaveDraft}
            onResumeLater={() => navigate('/my-home')}
          />
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;
