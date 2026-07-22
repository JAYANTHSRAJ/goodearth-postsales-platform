import React, { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useUnitStore } from '../../../store/unitStore';
import { clientService } from '../../../services/client.service';
import { KycOptionSelector } from '../components/KycOptionSelector';
import { KycWizardHeader } from '../components/KycWizardHeader';
import { KycBottomActionBar } from '../components/KycBottomActionBar';
import { Step1ApplicationDetails } from '../components/wizard-steps/Step1ApplicationDetails';
import { Step2PrimaryApplicant } from '../components/wizard-steps/Step2PrimaryApplicant';
import { Step3PrimaryAddress } from '../components/wizard-steps/Step3PrimaryAddress';
import { Step4IdentityInformation } from '../components/wizard-steps/Step4IdentityInformation';
import { Step5CoApplicant } from '../components/wizard-steps/Step5CoApplicant';
import { Step6ThirdApplicant } from '../components/wizard-steps/Step6ThirdApplicant';
import { Step7LoanAndTax } from '../components/wizard-steps/Step7LoanAndTax';
import { Step8DocumentUploadPlaceholder } from '../components/wizard-steps/Step8DocumentUploadPlaceholder';
import { Step9ReviewSummary } from '../components/wizard-steps/Step9ReviewSummary';
import { Step10Confirmation } from '../components/wizard-steps/Step10Confirmation';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { activeUnit, setUnits } = useUnitStore();

  const [hasStartedKyc, setHasStartedKyc] = useState(false);
  const [kycSubStep, setKycSubStep] = useState(1);
  const [isDirty, setIsDirty] = useState(false);

  const [kycForm, setKycForm] = useState<Record<string, any>>({
    applicationDate: new Date().toISOString().split('T')[0],
    homeLoanRequired: 'No',
    primaryApplicant: {
      salutation: 'Mr.',
      firstName: '',
      lastName: '',
      email: '',
      phoneCode: '91',
      phoneNumber: '',
      relationType: 'S/o',
      relationSalutation: 'Mr.',
      relationFirstName: '',
      relationLastName: '',
      dob: '',
      occupation: 'Corporate Employee',
      industry: 'Information Technology',
      company: '',
      annualIncome: 'INR 15L - 25L',
      aadhaarNo: '',
      panNo: '',
      passportNo: '',
      voterId: '',
      address: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: 'India',
        postalCode: '',
        residenceType: 'Own Apartment',
      },
    },
    hasCoApplicant: 'No',
    coApplicant: null,
    hasThirdApplicant: 'No',
    thirdApplicant: null,
    bankAccountName: '',
    bankName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    taxResidency: 'Resident Indian',
    gstinNo: '',
  });

  const [kycErrors, setKycErrors] = useState<Record<string, string>>({});
  const [kycDraftSuccess, setKycDraftSuccess] = useState(false);

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
    queryFn: () => clientService.getKyc(currentWorkflowId!),
    enabled: !!user && !!currentWorkflowId,
  });

  // Save KYC draft mutation
  const saveKycDraftMutation = useMutation({
    mutationFn: (data: any) => clientService.saveKycDraft(data, currentWorkflowId),
    onSuccess: () => {
      setKycDraftSuccess(true);
      setIsDirty(false);
      setTimeout(() => setKycDraftSuccess(false), 3000);
      refetchKyc();
    },
  });

  // Submit KYC mutation
  const submitKycMutation = useMutation({
    mutationFn: (payload: { form: any; agreeAccuracy: boolean; agreeTerms: boolean }) => {
      return clientService.submitKyc(
        {
          workflowId: currentWorkflowId,
          form: payload.form,
          agreeAccuracy: payload.agreeAccuracy,
          agreeTerms: payload.agreeTerms,
        },
        currentWorkflowId
      );
    },
    onSuccess: () => {
      updateUser({ onboardingStage: 'COMPLETED' });
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
          if (data.isLocked || data.status === 'SUBMITTED' || data.status === 'APPROVED') {
            setHasStartedKyc(true);
            setKycSubStep(9); // View review summary
          }
        } catch (e) {
          console.error('Failed to parse KYC draft data JSON', e);
        }
      }
    }
  }, [kycData]);

  // 30-Second Auto-Save Timer if dirty
  const latestFormRef = useRef(kycForm);
  latestFormRef.current = kycForm;

  useEffect(() => {
    const timer = setInterval(() => {
      if (isDirty && hasStartedKyc && !saveKycDraftMutation.isPending) {
        saveKycDraftMutation.mutate(latestFormRef.current);
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [isDirty, hasStartedKyc]);

  const handleKycFieldChange = (field: string, value: any) => {
    setKycForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
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
    saveKycDraftMutation.mutate(kycForm);
    if (kycSubStep < 10) {
      setKycSubStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    saveKycDraftMutation.mutate(kycForm);
    if (kycSubStep > 1) {
      setKycSubStep((prev) => prev - 1);
    }
  };

  const handleKycSubmit = (agreeAccuracy: boolean, agreeTerms: boolean) => {
    submitKycMutation.mutate({
      form: kycForm,
      agreeAccuracy,
      agreeTerms,
    });
  };

  const availableVerifiedKycs = (fetchedUnits || []).filter(
    (u: any) => (u.isKycVerified || u.kycStatus === 'SUBMITTED' || u.kycStatus === 'APPROVED') && u.id !== activeUnit?.id
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

      {/* KYC Choice Screen or 10-Step Wizard */}
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
            <Step1ApplicationDetails
              form={kycForm}
              onChange={handleKycFieldChange}
              errors={kycErrors}
            />
          )}

          {kycSubStep === 2 && (
            <Step2PrimaryApplicant
              form={kycForm}
              onChange={handleKycFieldChange}
              errors={kycErrors}
            />
          )}

          {kycSubStep === 3 && (
            <Step3PrimaryAddress
              form={kycForm}
              onChange={handleKycFieldChange}
              errors={kycErrors}
            />
          )}

          {kycSubStep === 4 && (
            <Step4IdentityInformation
              form={kycForm}
              onChange={handleKycFieldChange}
              errors={kycErrors}
            />
          )}

          {kycSubStep === 5 && (
            <Step5CoApplicant
              form={kycForm}
              onChange={handleKycFieldChange}
              errors={kycErrors}
            />
          )}

          {kycSubStep === 6 && (
            <Step6ThirdApplicant
              form={kycForm}
              onChange={handleKycFieldChange}
              errors={kycErrors}
            />
          )}

          {kycSubStep === 7 && (
            <Step7LoanAndTax
              form={kycForm}
              onChange={handleKycFieldChange}
              errors={kycErrors}
            />
          )}

          {kycSubStep === 8 && (
            <Step8DocumentUploadPlaceholder
              form={kycForm}
              onChange={handleKycFieldChange}
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
            <Step10Confirmation
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
