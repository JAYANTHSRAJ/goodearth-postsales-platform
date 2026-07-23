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
    validateForm,
    saveNow,
  } = useKycAutosave(bookingId, initialData);

  const handleCoApplicantToggle = (value: string) => {
    setHasCoApplicant(value);
    if (value === 'Yes') {
      if (jointApplicants.length === 0) {
        setJointApplicants([{ applicantType: 'JOINT_1', address: {} }]);
      }
    } else {
      setHasThirdApplicant('No');
      setJointApplicants([]);
    }
  };

  const handleThirdApplicantToggle = (value: string) => {
    setHasThirdApplicant(value);
    if (value === 'Yes') {
      if (jointApplicants.length === 1) {
        setJointApplicants([
          jointApplicants[0],
          { applicantType: 'JOINT_2', address: {} },
        ]);
      }
    } else {
      if (jointApplicants.length > 1) {
        setJointApplicants([jointApplicants[0]]);
      }
    }
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

  const coApplicantDto = jointApplicants.find((a) => a.applicantType === 'JOINT_1') || jointApplicants[0];
  const thirdApplicantDto = jointApplicants.find((a) => a.applicantType === 'JOINT_2') || jointApplicants[1];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Top Bar with Autosave */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Saarang KYC Form</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Good Earth - Application Form & Buyer Verification
          </p>
        </div>

        <AutosaveIndicator status={status} lastSavedAt={lastSavedAt} onRetry={saveNow} />
      </div>

      <KycStepper currentStepId="applicants" status={initialData?.status} />

      {/* Header Banner & Instructions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-center sm:text-left">
        <div className="flex flex-col items-center justify-center space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-brand-500/10 dark:bg-brand-400/10 flex items-center justify-center font-serif text-brand-700 dark:text-brand-300 font-bold text-xl">
            GE
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-serif">Good Earth - Application form</h2>
        </div>

        {/* Instructions */}
        <div className="bg-amber-50/50 dark:bg-slate-800/50 border border-amber-200/60 dark:border-slate-700 rounded-xl p-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <p className="font-bold text-amber-900 dark:text-amber-300">Instructions:</p>
          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
            <li>All the particulars entered here will be reflected in all future legal documents.</li>
            <li>Kindly ensure that there are no errors in the entry fields, and that the correct document is uploaded.</li>
            <li>Please ensure that your details are as per your address proof & Identity proof attached in this form.</li>
            <li>Fill your details in title case.</li>
          </ul>
        </div>

        {/* Application Date */}
        <div className="pt-2 max-w-xs">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Application date <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="dd-MM-yyyy"
            value={applicationDate}
            onChange={(e) => setApplicationDate(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">Format: dd-MM-yyyy</span>
        </div>
      </div>

      {/* Primary Applicant Section */}
      <KycApplicantFormSection
        title="Applicant Details"
        applicantType="PRIMARY"
        applicant={primaryApplicant}
        onChange={setPrimaryApplicant}
        errors={errors}
      />

      {/* Co-Applicant Conditional Question */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
        <label className="block text-sm font-bold text-slate-900 dark:text-white">
          Do you have co-applicant? <span className="text-rose-500">*</span>
        </label>
        <select
          value={hasCoApplicant}
          onChange={(e) => handleCoApplicantToggle(e.target.value)}
          className="w-full max-w-xs px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
        >
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </div>

      {/* Co-Applicant Details Section */}
      {hasCoApplicant === 'Yes' && coApplicantDto && (
        <KycApplicantFormSection
          title="Co-applicant Details"
          applicantType="JOINT_1"
          applicant={coApplicantDto}
          primaryApplicantAddress={primaryApplicant.address}
          onChange={(updated) => {
            const list = [...jointApplicants];
            const idx = list.findIndex((a) => a.applicantType === 'JOINT_1');
            if (idx >= 0) list[idx] = updated;
            else list.unshift(updated);
            setJointApplicants(list);
          }}
          errors={errors}
        />
      )}

      {/* Third Applicant Conditional Question (Shown if Co-Applicant is Yes) */}
      {hasCoApplicant === 'Yes' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
          <label className="block text-sm font-bold text-slate-900 dark:text-white">
            Do you have third applicant? <span className="text-rose-500">*</span>
          </label>
          <select
            value={hasThirdApplicant}
            onChange={(e) => handleThirdApplicantToggle(e.target.value)}
            className="w-full max-w-xs px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
      )}

      {/* Third Applicant Details Section */}
      {hasCoApplicant === 'Yes' && hasThirdApplicant === 'Yes' && thirdApplicantDto && (
        <KycApplicantFormSection
          title="Third Applicant Details"
          applicantType="JOINT_2"
          applicant={thirdApplicantDto}
          primaryApplicantAddress={primaryApplicant.address}
          secondaryApplicantAddress={coApplicantDto?.address}
          onChange={(updated) => {
            const list = [...jointApplicants];
            const idx = list.findIndex((a) => a.applicantType === 'JOINT_2');
            if (idx >= 0) list[idx] = updated;
            else list.push(updated);
            setJointApplicants(list);
          }}
          errors={errors}
        />
      )}

      {/* Home Loan Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
        <label className="block text-sm font-bold text-slate-900 dark:text-white">
          Are you considering a home loan? <span className="text-rose-500">*</span>
        </label>
        <select
          value={consideringHomeLoan}
          onChange={(e) => setConsideringHomeLoan(e.target.value)}
          className="w-full max-w-xs px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
        >
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </div>

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
