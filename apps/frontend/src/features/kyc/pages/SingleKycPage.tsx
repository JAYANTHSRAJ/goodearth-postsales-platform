import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Sparkles,
  Calendar,
  CheckCircle2,
  Users,
  UserPlus,
  Landmark,
  Save,
  Send,
  Building2,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import KycApplicantFormSection from '../components/forms/KycApplicantFormSection';
import KycDocumentSlotCard from '../components/documents/KycDocumentSlotCard';
import AutosaveIndicator from '../components/forms/AutosaveIndicator';
import KycValidationChecklist from '../components/review/KycValidationChecklist';
import KycLoadingSkeleton from '../components/KycLoadingSkeleton';
import useKycAutosave from '../hooks/useKycAutosave';
import kycService from '../services/kyc.service';
import { KycApplicationResponseDto, KycValidationSummaryResponseDto } from '../types/kyc';
import { useUnitStore } from '../../../store/unitStore';

export const SingleKycPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { activeUnit } = useUnitStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [initialData, setInitialData] = useState<KycApplicationResponseDto | null>(null);
  const [validationSummary, setValidationSummary] = useState<KycValidationSummaryResponseDto | null>(null);

  // Form Collapse / Expand Accordion States
  const [isHeaderOpen, setIsHeaderOpen] = useState<boolean>(true);
  const [isPrimaryOpen, setIsPrimaryOpen] = useState<boolean>(true);
  const [isCoApplicantOpen, setIsCoApplicantOpen] = useState<boolean>(true);
  const [isThirdApplicantOpen, setIsThirdApplicantOpen] = useState<boolean>(true);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(true);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(true);

  // Declaration state
  const [declarationAccepted, setDeclarationAccepted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const bookingId =
    searchParams.get('bookingId') ||
    activeUnit?.unitName ||
    activeUnit?.zohoDealName ||
    activeUnit?.workflowId ||
    activeUnit?.id ||
    'BKG-2026-101';

  const loadInitialData = async () => {
    try {
      const data = await kycService.getKycByBooking(bookingId);
      setInitialData(data);

      const summary = await kycService.validateKyc(bookingId).catch(() => null);
      if (summary) setValidationSummary(summary);
    } catch {
      // Handled in UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [bookingId]);

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
      setIsCoApplicantOpen(true);
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
      setIsThirdApplicantOpen(true);
    } else {
      if (jointApplicants.length > 1) {
        setJointApplicants([jointApplicants[0]]);
      }
    }
  };

  const handleSaveDraft = async () => {
    const saved = await saveNow();
    if (saved) {
      loadInitialData();
    }
  };

  const handleSubmitKyc = async () => {
    setSubmitError(null);
    if (!declarationAccepted) {
      setSubmitError('You must accept the legal declaration before submitting your application.');
      return;
    }

    const isValid = validateForm();
    if (!isValid) {
      setSubmitError('Please fix all required validation errors before final submission.');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveNow();
      if (initialData?.kycApplicationId) {
        await kycService.submitKyc({
          kycApplicationId: initialData.kycApplicationId,
          declarationAccepted: true,
        });
        setSubmitSuccess(true);
        loadInitialData();
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit KYC application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <KycLoadingSkeleton />
      </div>
    );
  }

  const coApplicantDto = jointApplicants.find((a) => a.applicantType === 'JOINT_1') || jointApplicants[0];
  const thirdApplicantDto = jointApplicants.find((a) => a.applicantType === 'JOINT_2') || jointApplicants[1];

  const documentSlots = initialData?.documentSlots || [];
  const kycApplicationId = initialData?.kycApplicationId || '';
  const canEdit = initialData?.status === 'DRAFT' || initialData?.status === 'ACTION_REQUIRED';

  // Filter additional slots (Address proof, Voter ID, etc.)
  const additionalSlots = documentSlots.filter(
    (s) => s.documentType === 'ADDRESS_PROOF' || s.documentType === 'VOTER_ID' || s.documentType === 'OTHER'
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Bar Header & Platform Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> GoodEarth Buyer Onboarding Platform
          </div>
          <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white">Single-Page KYC Application</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete your applicant verification, identity documents, family details and address in one unified form.
          </p>
        </div>

        <AutosaveIndicator status={status} lastSavedAt={lastSavedAt} onRetry={handleSaveDraft} />
      </div>

      {/* Submission Success Banner */}
      {(submitSuccess || initialData?.status === 'SUBMITTED' || initialData?.status === 'APPROVED') && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
              KYC Application Submitted Successfully!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
              Your applicant information and WorkDrive document proofs have been synchronized with Zoho CRM. Our post-sales compliance team will verify your records shortly.
            </p>
          </div>
        </div>
      )}

      {/* READ-ONLY APPLICATION HEADER SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white rounded-3xl shadow-xl border border-slate-800 overflow-hidden">
        <div
          onClick={() => setIsHeaderOpen(!isHeaderOpen)}
          className="p-6 sm:p-8 flex items-center justify-between cursor-pointer select-none border-b border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[11px] font-semibold mb-1">
                <Sparkles className="w-3 h-3" /> Official Property Booking Header
              </div>
              <h2 className="text-xl font-bold font-serif text-white">Application Particulars & Booking Reference</h2>
            </div>
          </div>
          <button type="button" className="text-slate-400 hover:text-white p-1">
            {isHeaderOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {isHeaderOpen && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Application Date</p>
                <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <Calendar className="w-3.5 h-3.5 text-brand-400" />
                  <input
                    type="text"
                    value={applicationDate}
                    onChange={(e) => setApplicationDate(e.target.value)}
                    disabled={!canEdit}
                    placeholder="dd-MM-yyyy"
                    className="bg-transparent border-b border-white/20 w-24 text-white font-bold text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Booking Number</p>
                <p className="text-sm font-bold text-white truncate">{bookingId}</p>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Project</p>
                <p className="text-sm font-bold text-white truncate">{activeUnit?.projectName || 'GoodEarth Malhar'}</p>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unit Number</p>
                <p className="text-sm font-bold text-white truncate">{activeUnit?.unitName || bookingId}</p>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Buyer Name</p>
                <p className="text-sm font-bold text-white truncate">
                  {primaryApplicant.fullName || `${primaryApplicant.firstName || ''} ${primaryApplicant.lastName || ''}`.trim() || 'Primary Buyer'}
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Booking Stage</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {initialData?.status || 'DRAFT'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1: PRIMARY APPLICANT FORM */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <User className="w-4 h-4 text-brand-500" /> Section 1: Primary Applicant
          </div>
          <button
            type="button"
            onClick={() => setIsPrimaryOpen(!isPrimaryOpen)}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            {isPrimaryOpen ? 'Collapse Primary Form' : 'Expand Primary Form'}
            {isPrimaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isPrimaryOpen && (
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
        )}
      </div>

      {/* CO-APPLICANT TOGGLE CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Do you have a Co-Applicant?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Indicate whether property is owned jointly with spouse, family member or co-buyer.</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-800 dark:text-slate-200">
              <input
                type="radio"
                name="hasCoApplicantRadio"
                value="No"
                checked={hasCoApplicant === 'No'}
                onChange={() => handleCoApplicantToggle('No')}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
              />
              <span>(•) No</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-800 dark:text-slate-200">
              <input
                type="radio"
                name="hasCoApplicantRadio"
                value="Yes"
                checked={hasCoApplicant === 'Yes'}
                onChange={() => handleCoApplicantToggle('Yes')}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
              />
              <span>( ) Yes</span>
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 2: CO-APPLICANT FORM (Inline expanded when Yes) */}
      {hasCoApplicant === 'Yes' && coApplicantDto && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <Users className="w-4 h-4 text-brand-500" /> Section 2: Co-Applicant Details
            </div>
            <button
              type="button"
              onClick={() => setIsCoApplicantOpen(!isCoApplicantOpen)}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              {isCoApplicantOpen ? 'Collapse Co-Applicant Form' : 'Expand Co-Applicant Form'}
              {isCoApplicantOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {isCoApplicantOpen && (
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
        </div>
      )}

      {/* THIRD APPLICANT TOGGLE CARD (Shown if Co-Applicant is Yes) */}
      {hasCoApplicant === 'Yes' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Do you wish to add a 3rd Joint Owner?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Include third applicant for legal property registration.</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="hasThirdApplicantRadio"
                  value="No"
                  checked={hasThirdApplicant === 'No'}
                  onChange={() => handleThirdApplicantToggle('No')}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                />
                <span>(•) No</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="hasThirdApplicantRadio"
                  value="Yes"
                  checked={hasThirdApplicant === 'Yes'}
                  onChange={() => handleThirdApplicantToggle('Yes')}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                />
                <span>( ) Yes</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: THIRD APPLICANT FORM (Inline expanded when Yes) */}
      {hasCoApplicant === 'Yes' && hasThirdApplicant === 'Yes' && thirdApplicantDto && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <UserPlus className="w-4 h-4 text-brand-500" /> Section 3: Third Applicant Details
            </div>
            <button
              type="button"
              onClick={() => setIsThirdApplicantOpen(!isThirdApplicantOpen)}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              {isThirdApplicantOpen ? 'Collapse Third Applicant Form' : 'Expand Third Applicant Form'}
              {isThirdApplicantOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {isThirdApplicantOpen && (
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
        </div>
      )}

      {/* HOME LOAN ASSISTANCE SECTION */}
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

      {/* SECTION 4: ADDITIONAL MANDATORY DOCUMENTS & SLOTS */}
      {additionalSlots.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div
            onClick={() => setIsDocsOpen(!isDocsOpen)}
            className="flex items-center justify-between cursor-pointer select-none border-b border-slate-100 dark:border-slate-800 pb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Additional Document Proofs</h3>
                <p className="text-xs text-slate-500">Address proof and supplementary verification files</p>
              </div>
            </div>
            <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
              {isDocsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {isDocsOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {additionalSlots.map((slot) => (
                <KycDocumentSlotCard
                  key={slot.documentId}
                  slot={slot}
                  kycApplicationId={kycApplicationId}
                  onRefresh={loadInitialData}
                  canEdit={canEdit}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: REAL-TIME VALIDATION SUMMARY CHECKLIST & SUBMISSION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div
          onClick={() => setIsReviewOpen(!isReviewOpen)}
          className="flex items-center justify-between cursor-pointer select-none border-b border-slate-100 dark:border-slate-800 pb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Validation Summary & Legal Declaration</h3>
              <p className="text-xs text-slate-500">Review required fields, accept declaration, and submit KYC</p>
            </div>
          </div>
          <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            {isReviewOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {isReviewOpen && (
          <div className="space-y-6">
            {validationSummary && (
              <KycValidationChecklist kycData={initialData} validationSummary={validationSummary} bookingId={bookingId} />
            )}

            {submitError && (
              <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900">
                {submitError}
              </div>
            )}

            {/* Declaration Checkbox */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-start gap-3">
              <input
                id="kyc-single-declaration"
                type="checkbox"
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                disabled={!canEdit}
                className="mt-0.5 h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="kyc-single-declaration" className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed cursor-pointer font-medium">
                I hereby declare that all information and identity document proofs provided above are true, complete, and authentic. I authorize GoodEarth to process this data for legal property registration and Zoho CRM synchronization.
              </label>
            </div>

            {/* Final Action Buttons Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center justify-center gap-2 transition-all"
              >
                <Save className="w-4 h-4 text-brand-600" />
                Save Draft
              </button>

              <button
                type="button"
                onClick={handleSubmitKyc}
                disabled={!canEdit || isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting to Zoho CRM...' : 'Submit KYC Application'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleKycPage;
