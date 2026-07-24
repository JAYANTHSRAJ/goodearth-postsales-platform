import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Users, UserPlus, ShieldCheck, Sparkles, Calendar, CheckCircle2, Landmark } from 'lucide-react';
import KycStepper from '../components/KycStepper';
import KycNavigation from '../components/KycNavigation';
import KycLoadingSkeleton from '../components/KycLoadingSkeleton';
import KycApplicantFormSection from '../components/forms/KycApplicantFormSection';
import AutosaveIndicator from '../components/forms/AutosaveIndicator';
import useKycAutosave from '../hooks/useKycAutosave';
import kycService from '../services/kyc.service';
import { KycApplicationResponseDto } from '../types/kyc';
import { useUnitStore } from '../../../store/unitStore';

export const KycApplicantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeUnit } = useUnitStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [initialData, setInitialData] = useState<KycApplicationResponseDto | null>(null);

  const bookingId = searchParams.get('bookingId') || activeUnit?.unitName || activeUnit?.workflowId || activeUnit?.id || 'BKG-2026-101';

  const loadInitialData = async () => {
    try {
      const data = await kycService.getKycByBooking(bookingId);
      setInitialData(data);
    } catch {
      // Handled in UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
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

  const documentSlots = initialData?.documentSlots || [];
  const kycApplicationId = initialData?.kycApplicationId || '';
  const canEdit = initialData?.status === 'DRAFT' || initialData?.status === 'ACTION_REQUIRED';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header & Platform Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> GoodEarth Buyer Onboarding
          </div>
          <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white">KYC & Applicant Registration</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official buyer identification and contact verification for legal agreement generation
          </p>
        </div>

        <AutosaveIndicator status={status} lastSavedAt={lastSavedAt} onRetry={saveNow} />
      </div>

      <KycStepper currentStepId="applicants" status={initialData?.status} />

      {/* Platform Hero Card Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> GoodEarth Post-Sales Portal
            </div>
            <h2 className="text-2xl font-bold font-serif tracking-tight text-white">Applicant Registration</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Please enter your full details exactly as they appear on your government-issued ID proofs.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15">
            <Calendar className="w-5 h-5 text-brand-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Application Date</div>
              <input
                type="text"
                placeholder="dd-MM-yyyy"
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-white outline-none w-28 placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Instructions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs text-slate-300">
          <div className="flex items-start gap-2.5 bg-white/5 p-3 rounded-xl border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <span>All entries will be reflected across all legal sale agreements and registry documents.</span>
          </div>
          <div className="flex items-start gap-2.5 bg-white/5 p-3 rounded-xl border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <span>Ensure name, Aadhaar, and PAN numbers match attached proof documents exactly.</span>
          </div>
        </div>
      </div>

      {/* Primary Applicant Section */}
      <KycApplicantFormSection
        title="Primary Applicant"
        applicantType="PRIMARY"
        applicant={primaryApplicant}
        onChange={setPrimaryApplicant}
        errors={errors}
        documentSlots={documentSlots}
        kycApplicationId={kycApplicationId}
        onRefreshDocuments={loadInitialData}
        canEdit={canEdit}
      />

      {/* Co-Applicant Segmented Cards Choice */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-9 h-9 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Co-Applicant Selection</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Do you wish to add a joint applicant or co-owner to this booking?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            type="button"
            onClick={() => handleCoApplicantToggle('No')}
            className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all ${
              hasCoApplicant === 'No'
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${hasCoApplicant === 'No' ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">Single Primary Applicant</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Property will be registered under one buyer name.</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleCoApplicantToggle('Yes')}
            className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all ${
              hasCoApplicant === 'Yes'
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${hasCoApplicant === 'Yes' ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">Add Joint Co-Applicant</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add spouse, parent, or business partner as joint buyer.</div>
            </div>
          </button>
        </div>
      </div>

      {/* Co-Applicant Details Section */}
      {hasCoApplicant === 'Yes' && coApplicantDto && (
        <KycApplicantFormSection
          title="Co-Applicant Details"
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
          documentSlots={documentSlots}
          kycApplicationId={kycApplicationId}
          onRefreshDocuments={loadInitialData}
          canEdit={canEdit}
        />
      )}

      {/* Third Applicant Segmented Choice (Shown if Co-Applicant is Yes) */}
      {hasCoApplicant === 'Yes' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-9 h-9 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Third Applicant Option</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Do you wish to register a 3rd joint owner on the property?</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => handleThirdApplicantToggle('No')}
              className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all ${
                hasThirdApplicant === 'No'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${hasThirdApplicant === 'No' ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">No 3rd Applicant</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Two owners on booking.</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleThirdApplicantToggle('Yes')}
              className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all ${
                hasThirdApplicant === 'Yes'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${hasThirdApplicant === 'Yes' ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Add 3rd Joint Owner</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Include 3rd applicant details.</div>
              </div>
            </button>
          </div>
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
          documentSlots={documentSlots}
          kycApplicationId={kycApplicationId}
          onRefreshDocuments={loadInitialData}
          canEdit={canEdit}
        />
      )}

      {/* Home Loan Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-9 h-9 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Home Loan Assistance</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Are you considering applying for a home loan for this unit purchase?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            type="button"
            onClick={() => setConsideringHomeLoan('No')}
            className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all ${
              consideringHomeLoan === 'No'
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${consideringHomeLoan === 'No' ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">Self-Funded / No Loan</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Payment will be made directly without bank financing.</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setConsideringHomeLoan('Yes')}
            className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all ${
              consideringHomeLoan === 'Yes'
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${consideringHomeLoan === 'Yes' ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">Applying for Home Loan</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">GoodEarth home loan desk will assist with bank sanction documents.</div>
            </div>
          </button>
        </div>
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
