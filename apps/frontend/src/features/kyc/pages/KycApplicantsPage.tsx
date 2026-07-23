import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KycStepper from '../components/KycStepper';
import KycNavigation from '../components/KycNavigation';
import KycLoadingSkeleton from '../components/KycLoadingSkeleton';
import KycApplicantFormSection from '../components/forms/KycApplicantFormSection';
import AutosaveIndicator from '../components/forms/AutosaveIndicator';
import useKycAutosave from '../hooks/useKycAutosave';
import kycService from '../services/kyc.service';
import { KycApplicationResponseDto } from '../types/kyc';

export const KycApplicantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [initialData, setInitialData] = useState<KycApplicationResponseDto | null>(null);

  const bookingId = 'BKG-2026-101';

  useEffect(() => {
    kycService.getKycByBooking(bookingId)
      .then(setInitialData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const {
    primaryApplicant,
    setPrimaryApplicant,
    jointApplicants,
    setJointApplicants,
    status,
    lastSavedAt,
    errors,
    validateForm,
    saveNow,
  } = useKycAutosave(bookingId, initialData);

  const handleAddJointApplicant = () => {
    if (jointApplicants.length >= 2) return;
    const nextType = jointApplicants.length === 0 ? 'JOINT_1' : 'JOINT_2';
    setJointApplicants([
      ...jointApplicants,
      { applicantType: nextType, address: {} },
    ]);
  };

  const handleRemoveJointApplicant = (index: number) => {
    const updated = [...jointApplicants];
    updated.splice(index, 1);
    setJointApplicants(updated);
  };

  const handleNext = async () => {
    const isValid = validateForm();
    if (!isValid) {
      alert('Please correct the validation errors before proceeding.');
      return;
    }
    const saved = await saveNow();
    if (saved) {
      navigate('/client/kyc/documents');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <KycLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Step 2: Applicant Information</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Provide primary and joint homebuyer contact, PAN, Aadhaar, and address information.
          </p>
        </div>

        <AutosaveIndicator status={status} lastSavedAt={lastSavedAt} onRetry={saveNow} />
      </div>

      <KycStepper currentStepId="applicants" status={initialData?.status} />

      {/* Primary Applicant Section */}
      <KycApplicantFormSection
        title="Primary Applicant Details"
        applicantType="PRIMARY"
        applicant={primaryApplicant}
        onChange={setPrimaryApplicant}
        errors={errors}
      />

      {/* Joint Applicants Section */}
      {jointApplicants.map((joint, idx) => (
        <KycApplicantFormSection
          key={joint.applicantType || idx}
          title={`Co-Applicant ${idx + 1} Details (${joint.applicantType})`}
          applicantType={joint.applicantType || (idx === 0 ? 'JOINT_1' : 'JOINT_2')}
          applicant={joint}
          onChange={(updated) => {
            const list = [...jointApplicants];
            list[idx] = updated;
            setJointApplicants(list);
          }}
          errors={errors}
          isRemovable
          onRemove={() => handleRemoveJointApplicant(idx)}
        />
      ))}

      {jointApplicants.length < 2 && (
        <button
          type="button"
          onClick={handleAddJointApplicant}
          className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Co-Applicant
        </button>
      )}

      <KycNavigation
        onBack={() => navigate('/client/kyc/property')}
        onNext={handleNext}
        onSaveDraft={saveNow}
        nextLabel="Save & Proceed to Documents"
      />
    </div>
  );
};

export default KycApplicantsPage;
