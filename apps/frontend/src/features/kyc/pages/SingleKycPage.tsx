import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Sparkles,
  Calendar,
  CheckCircle2,
  UserPlus,
  Landmark,
  Save,
  Send,
  Building2,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import KycApplicantFormSection from '../components/forms/KycApplicantFormSection';
import KycDocumentSlotCard from '../components/documents/KycDocumentSlotCard';
import AutosaveIndicator from '../components/forms/AutosaveIndicator';
import KycValidationChecklist from '../components/review/KycValidationChecklist';
import KycLoadingSkeleton from '../components/KycLoadingSkeleton';
import { KycWorkflowTimeline } from '../components/KycWorkflowTimeline';
import useKycAutosave from '../hooks/useKycAutosave';
import kycService from '../services/kyc.service';
import { KycApplicationResponseDto, KycValidationSummaryResponseDto, KycApplicationStatus } from '../types/kyc';
import { useUnitStore } from '../../../store/unitStore';

export const SingleKycPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { activeUnit } = useUnitStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [initialData, setInitialData] = useState<KycApplicationResponseDto | null>(null);
  const [validationSummary, setValidationSummary] = useState<KycValidationSummaryResponseDto | null>(null);

  // Read-only toggle view state for submitted applications
  const [showReadOnlyForm, setShowReadOnlyForm] = useState<boolean>(false);

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

  const [noBookingFoundError, setNoBookingFoundError] = useState<string | null>(null);

  const bookingId =
    searchParams.get('bookingId') ||
    activeUnit?.unitName ||
    activeUnit?.zohoDealName ||
    activeUnit?.workflowId ||
    activeUnit?.id ||
    'current';

  const isNewFormRoute = location.pathname.endsWith('/new') || searchParams.get('new') === 'true';

  const loadInitialData = async () => {
    setLoading(true);
    setNoBookingFoundError(null);
    try {
      let data: KycApplicationResponseDto;
      if (isNewFormRoute) {
        data = await kycService.createKycApplication(bookingId);
      } else {
        data = await kycService.getKycByBooking(bookingId);
      }
      setInitialData(data);

      const targetId = data.bookingId || bookingId;
      const summary = await kycService.validateKyc(targetId).catch(() => null);
      if (summary) setValidationSummary(summary);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'No active booking found for this user.';
      if (msg.includes('No active booking found') || err?.response?.status === 404) {
        setNoBookingFoundError('No active booking found for your account. Please contact support or complete unit booking.');
      } else {
        setSubmitError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshDocumentsSilently = async () => {
    try {
      const data = await kycService.getKycByBooking(bookingId);
      setInitialData(data);
      const targetId = data.bookingId || bookingId;
      const summary = await kycService.validateKyc(targetId).catch(() => null);
      if (summary) setValidationSummary(summary);
    } catch (err) {
      console.warn('Failed silent document refresh:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [bookingId, isNewFormRoute]);

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
        if (initialData.status === 'EDIT_ENABLED' || initialData.status === 'ACTION_REQUIRED') {
          await kycService.resubmitKyc({
            kycApplicationId: initialData.kycApplicationId,
            declarationAccepted: true,
          });
        } else {
          await kycService.submitKyc({
            kycApplicationId: initialData.kycApplicationId,
            declarationAccepted: true,
          });
        }
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

  // Determine if buyer can edit form
  const currentStatus: KycApplicationStatus = initialData?.status || 'DRAFT';
  const canEdit =
    initialData?.canBuyerEdit ??
    (currentStatus === 'DRAFT' || currentStatus === 'ACTION_REQUIRED' || currentStatus === 'EDIT_ENABLED');

  // Filter additional slots (Address proof, Voter ID, etc.)
  const additionalSlots = documentSlots.filter(
    (s) => s.documentType === 'ADDRESS_PROOF' || s.documentType === 'VOTER_ID' || s.documentType === 'OTHER'
  );

  // Status Badge Colors & Labels
  const getStatusBadge = (st: KycApplicationStatus) => {
    switch (st) {
      case 'DRAFT':
        return { label: 'Draft', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300' };
      case 'SUBMITTED':
        return { label: 'Submitted', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200' };
      case 'UNDER_REVIEW':
        return { label: 'Under Review', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200' };
      case 'EDIT_ENABLED':
      case 'ACTION_REQUIRED':
        return { label: 'Action Required', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200' };
      case 'RESUBMITTED':
        return { label: 'Resubmitted', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200' };
      case 'APPROVED':
        return { label: 'Approved', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200' };
      case 'REJECTED':
        return { label: 'Rejected', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200' };
      default:
        return { label: st, color: 'bg-slate-100 text-slate-700' };
    }
  };

  const badge = getStatusBadge(currentStatus);

  if (noBookingFoundError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">No Active Booking Found</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {noBookingFoundError}
          </p>
        </div>
        <button
          onClick={() => navigate('/my-home')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* PART 1: CLEAN PROFESSIONAL HEADER & STATUS BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> GoodEarth Post-Sales Platform
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Buyer KYC Verification
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Please complete your KYC information for legal documentation and property registration.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${badge.color} shadow-xs`}>
            ● {badge.label}
          </span>
          {canEdit && <AutosaveIndicator status={status} lastSavedAt={lastSavedAt} onRetry={handleSaveDraft} />}
        </div>
      </div>

      {/* PART 10/11: ACTION REQUIRED BANNER WHEN EDIT ACCESS IS GRANTED */}
      {(currentStatus === 'EDIT_ENABLED' || currentStatus === 'ACTION_REQUIRED') && (
        <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-3xl p-6 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-base font-bold text-orange-950 dark:text-orange-200">
              Action Required: Edit Access Granted by GoodEarth Admin
            </h3>
            {initialData?.editReason && (
              <p className="text-xs text-orange-800 dark:text-orange-300 font-medium">
                Reason: "{initialData.editReason}"
              </p>
            )}
            <p className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed">
              Our GoodEarth Admin team has unlocked your application. Please review the details, make the required updates, and click <span className="font-bold">Resubmit KYC Application</span> when ready.
            </p>
          </div>
        </div>
      )}

      {/* PART 4: AFTER SUBMISSION SUCCESS BANNER & READ-ONLY BANNER */}
      {!canEdit && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-center">
          <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {currentStatus === 'APPROVED' ? 'KYC Approved & Verified' : 'KYC Submitted Successfully'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {currentStatus === 'APPROVED'
                ? 'Your KYC application has been verified and approved by GoodEarth Admin.'
                : 'Thank you for submitting your KYC. Our GoodEarth Admin Team is reviewing your application. You will receive updates by email and inside the portal. No further action is required.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => setShowReadOnlyForm(!showReadOnlyForm)}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Eye className="w-4 h-4 text-brand-500" />
              {showReadOnlyForm ? 'Hide Submitted KYC Details' : 'View Submitted KYC Details'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/client/dashboard')}
              className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* PART 13: WORKFLOW TIMELINE */}
      <KycWorkflowTimeline
        status={currentStatus}
        submittedAt={initialData?.submittedAt}
        verifiedAt={initialData?.verifiedAt}
        verifiedBy={initialData?.verifiedBy}
      />

      {/* FORM SECTION CONTAINER (Editable when canEdit is true, or visible in read-only mode when showReadOnlyForm is true) */}
      {(canEdit || showReadOnlyForm) && (
        <div className="space-y-8">
          {/* READ-ONLY APPLICATION PARTICULARS HEADER */}
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
                    <Sparkles className="w-3 h-3" /> Property Booking Particulars
                  </div>
                  <h2 className="text-xl font-bold font-serif text-white">Booking Reference Details</h2>
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
                        onChange={(e) => canEdit && setApplicationDate(e.target.value)}
                        readOnly={!canEdit}
                        className="bg-transparent border-none text-white focus:ring-0 p-0 text-sm font-bold w-full"
                      />
                    </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Booking ID</p>
                    <p className="text-sm font-bold text-brand-300 truncate">{bookingId}</p>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unit Ref</p>
                    <p className="text-sm font-bold text-white truncate">
                      {activeUnit?.unitName || 'GoodEarth Villa'}
                    </p>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Project</p>
                    <p className="text-sm font-bold text-white truncate">
                      {activeUnit?.projectName || 'GoodEarth Malhar'}
                    </p>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">KYC Status</p>
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-brand-500/20 text-brand-300 text-xs font-bold border border-brand-500/30">
                      {badge.label}
                    </span>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Completion</p>
                    <p className="text-sm font-bold text-emerald-400">
                      {validationSummary?.overallValid ? '100%' : 'In Progress'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 1: PRIMARY APPLICANT FORM */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <User className="w-4 h-4 text-brand-500" /> Section 1: Primary Applicant Details
              </div>
              <button
                type="button"
                onClick={() => setIsPrimaryOpen(!isPrimaryOpen)}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                {isPrimaryOpen ? 'Collapse Primary Applicant Form' : 'Expand Primary Applicant Form'}
                {isPrimaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {isPrimaryOpen && (
              <KycApplicantFormSection
                title="Primary Applicant Details"
                applicantType="PRIMARY"
                applicant={primaryApplicant}
                onChange={(updated) => canEdit && setPrimaryApplicant(updated)}
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
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Do you have a Co-Applicant?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Include joint owner for legal property registration.</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name="hasCoApplicantRadio"
                    value="No"
                    checked={hasCoApplicant === 'No'}
                    onChange={() => canEdit && handleCoApplicantToggle('No')}
                    disabled={!canEdit}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                  />
                  <span>No</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name="hasCoApplicantRadio"
                    value="Yes"
                    checked={hasCoApplicant === 'Yes'}
                    onChange={() => canEdit && handleCoApplicantToggle('Yes')}
                    disabled={!canEdit}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                  />
                  <span>Yes</span>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 2: CO-APPLICANT FORM */}
          {hasCoApplicant === 'Yes' && coApplicantDto && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <UserPlus className="w-4 h-4 text-brand-500" /> Section 2: Co-Applicant Details
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
                    if (!canEdit) return;
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

          {/* THIRD APPLICANT TOGGLE CARD */}
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
                      onChange={() => canEdit && handleThirdApplicantToggle('No')}
                      disabled={!canEdit}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                    />
                    <span>No</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="radio"
                      name="hasThirdApplicantRadio"
                      value="Yes"
                      checked={hasThirdApplicant === 'Yes'}
                      onChange={() => canEdit && handleThirdApplicantToggle('Yes')}
                      disabled={!canEdit}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                    />
                    <span>Yes</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: THIRD APPLICANT FORM */}
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
                    if (!canEdit) return;
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
                disabled={!canEdit}
                onClick={() => canEdit && setConsideringHomeLoan('No')}
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
                disabled={!canEdit}
                onClick={() => canEdit && setConsideringHomeLoan('Yes')}
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
                      onRefresh={refreshDocumentsSilently}
                      canEdit={canEdit}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: REAL-TIME VALIDATION SUMMARY CHECKLIST & SUBMISSION */}
          {canEdit && (
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
                      I hereby declare that all information and identity document proofs provided above are true, complete, and authentic. I authorize GoodEarth to process this data for legal property registration.
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
                      {isSubmitting
                        ? 'Submitting KYC Application...'
                        : currentStatus === 'EDIT_ENABLED' || currentStatus === 'ACTION_REQUIRED'
                        ? 'Resubmit KYC Application'
                        : 'Submit KYC Application'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SingleKycPage;
