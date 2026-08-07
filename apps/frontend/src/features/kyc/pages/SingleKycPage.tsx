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
import { CopyKycModal } from '../components/CopyKycModal';
import { KycApplicationResponseDto, KycValidationSummaryResponseDto, KycApplicationStatus, KycCopySourceDto } from '../types/kyc';
import { useUnitStore } from '../../../store/unitStore';

export const SingleKycPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { activeUnit } = useUnitStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [initialData, setInitialData] = useState<KycApplicationResponseDto | null>(null);
  const [validationSummary, setValidationSummary] = useState<KycValidationSummaryResponseDto | null>(null);

  // Copy KYC Modal states
  const [copySources, setCopySources] = useState<KycCopySourceDto[]>([]);
  const [showCopyModal, setShowCopyModal] = useState<boolean>(false);

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
      if (data?.documentSlots) {
        setDocumentSlots(data.documentSlots);
      }

      const targetId = data.bookingId || bookingId;
      const summary = await kycService.validateKyc(targetId).catch(() => null);
      if (summary) setValidationSummary(summary);

      // Check if target KYC is empty and offer copy from existing properties if available
      if (!data?.primaryApplicant?.fullName && (data?.status === 'DRAFT' || !data?.submittedAt)) {
        const targetWfId = activeUnit?.workflowId || activeUnit?.id;
        try {
          const sources = await kycService.getAvailableSources(targetWfId);
          if (sources && sources.length > 0) {
            setCopySources(sources);
            setShowCopyModal(true);
          }
        } catch (err) {
          console.warn('Failed to fetch KYC copy sources:', err);
        }
      }
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

  const handlePerformCopy = async (selectedSourceId: string) => {
    const targetWfId = activeUnit?.workflowId || activeUnit?.id || bookingId;
    try {
      await kycService.copyKycFromSource(targetWfId, {
        sourceWorkflowId: selectedSourceId,
        overwrite: true,
      });
      setShowCopyModal(false);
      await loadInitialData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to copy KYC data from selected property.');
    }
  };

  const [documentSlots, setDocumentSlots] = useState<KycApplicationResponseDto['documentSlots']>([]);

  const refreshDocumentsSilently = async () => {
    try {
      const data = await kycService.getKycByBooking(bookingId);
      if (data?.documentSlots) {
        setDocumentSlots(data.documentSlots);
      }
      const targetId = data?.bookingId || bookingId;
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
    await saveNow();
    refreshDocumentsSilently();
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
      <div className="max-w-6xl mx-auto px-4 py-6">
        <KycLoadingSkeleton />
      </div>
    );
  }

  const coApplicantDto = jointApplicants.find((a) => a.applicantType === 'JOINT_1') || jointApplicants[0];
  const thirdApplicantDto = jointApplicants.find((a) => a.applicantType === 'JOINT_2') || jointApplicants[1];

  const currentSlots = documentSlots || [];
  const kycApplicationId = initialData?.kycApplicationId || '';

  // Determine if buyer can edit form
  const currentStatus: KycApplicationStatus = initialData?.status || 'DRAFT';
  const canEdit =
    initialData?.canBuyerEdit ??
    (currentStatus === 'DRAFT' || currentStatus === 'ACTION_REQUIRED' || currentStatus === 'EDIT_ENABLED');

  // Filter additional slots (Address proof, Voter ID, etc.)
  const additionalSlots = currentSlots.filter(
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

  const completionPercent = initialData?.completionPercentage !== undefined
    ? initialData.completionPercentage
    : (() => {
        const reqSlots = currentSlots.filter(s => s.isRequired);
        const uploadedCount = reqSlots.filter(s => s.currentVersion).length;
        const docsP = reqSlots.length > 0 ? Math.round((uploadedCount / reqSlots.length) * 50) : 50;
        const formP = primaryApplicant.fullName && primaryApplicant.panNumber && primaryApplicant.aadhaarNumber ? 50 : 25;
        return Math.min(100, docsP + formP);
      })();

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
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* HEADER & PROGRESS INDICATOR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" /> GoodEarth Post-Sales Portal
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Buyer KYC Verification
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Complete your KYC details and identity uploads for legal documentation and property registration.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.color} shadow-2xs`}>
                ● {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* KYC Progress Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-brand-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 shrink-0">
            KYC Progress: {completionPercent}% Complete
          </span>
        </div>
      </div>

      {/* ACTION REQUIRED BANNER */}
      {(currentStatus === 'EDIT_ENABLED' || currentStatus === 'ACTION_REQUIRED') && (
        <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 shadow-xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-sm font-bold text-orange-950 dark:text-orange-200">
              Action Required: Edit Access Granted by GoodEarth Admin
            </h3>
            {initialData?.editReason && (
              <p className="text-xs text-orange-800 dark:text-orange-300 font-medium">
                Reason: "{initialData.editReason}"
              </p>
            )}
            <p className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed">
              Please review the details, update the required fields or document uploads, and click <span className="font-bold">Resubmit KYC Application</span> below.
            </p>
          </div>
        </div>
      )}

      {/* READ-ONLY / SUBMITTED BANNER */}
      {!canEdit && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-1 max-w-xl mx-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {currentStatus === 'APPROVED' ? 'KYC Approved & Verified' : 'KYC Submitted Successfully'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {currentStatus === 'APPROVED'
                ? 'Your KYC application has been verified and approved by GoodEarth Admin.'
                : 'Thank you for submitting your KYC. Our GoodEarth Admin Team is reviewing your application. You will receive updates by email and inside the portal.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowReadOnlyForm(!showReadOnlyForm)}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Eye className="w-4 h-4 text-brand-500" />
              {showReadOnlyForm ? 'Hide Submitted KYC Details' : 'View Submitted KYC Details'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/client/dashboard')}
              className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* WORKFLOW TIMELINE */}
      <KycWorkflowTimeline
        status={currentStatus}
        submittedAt={initialData?.submittedAt}
        verifiedAt={initialData?.verifiedAt}
        verifiedBy={initialData?.verifiedBy}
      />

      {/* FORM SECTION CONTAINER */}
      {(canEdit || showReadOnlyForm) && (
        <div className="space-y-6">
          {/* BOOKING REFERENCE ACCORDION */}
          <div className="bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800 overflow-hidden">
            <div
              onClick={() => setIsHeaderOpen(!isHeaderOpen)}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none border-b border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[10px] font-semibold mb-0.5">
                    <Sparkles className="w-3 h-3" /> Property Particulars
                  </div>
                  <h2 className="text-base font-bold text-white">Booking Reference Details</h2>
                </div>
              </div>
              <button type="button" className="text-slate-400 hover:text-white p-1">
                {isHeaderOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {isHeaderOpen && (
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Application Date</p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Calendar className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                      <input
                        type="text"
                        value={applicationDate}
                        onChange={(e) => canEdit && setApplicationDate(e.target.value)}
                        readOnly={!canEdit}
                        className="bg-transparent border-none text-white focus:ring-0 p-0 text-xs font-bold w-full"
                      />
                    </div>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Booking ID</p>
                    <p className="text-xs font-bold text-brand-300 truncate">{bookingId}</p>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unit Ref</p>
                    <p className="text-xs font-bold text-white truncate">
                      {activeUnit?.unitName || 'GoodEarth Villa'}
                    </p>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Project</p>
                    <p className="text-xs font-bold text-white truncate">
                      {activeUnit?.projectName || 'GoodEarth Malhar'}
                    </p>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">KYC Status</p>
                    <span className="inline-block px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 text-[10px] font-bold border border-brand-500/30">
                      {badge.label}
                    </span>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Completion</p>
                    <p className="text-xs font-bold text-emerald-400">
                      {completionPercent}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 1: PRIMARY APPLICANT FORM ACCORDION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div
              onClick={() => setIsPrimaryOpen(!isPrimaryOpen)}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Section 1: Primary Applicant Details</h3>
                  <p className="text-[11px] text-slate-400">Personal info, address, identity & document uploads</p>
                </div>
              </div>
              <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                {isPrimaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {isPrimaryOpen && (
              <div className="p-4 sm:p-6">
                <KycApplicantFormSection
                  title="Primary Applicant Details"
                  applicantType="PRIMARY"
                  applicant={primaryApplicant}
                  onChange={(updated) => canEdit && setPrimaryApplicant(updated)}
                  errors={errors}
                  documentSlots={currentSlots}
                  kycApplicationId={kycApplicationId}
                  onRefreshDocuments={refreshDocumentsSilently}
                  canEdit={canEdit}
                />
              </div>
            )}
          </div>

          {/* CO-APPLICANT TOGGLE CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Do you have a Co-Applicant?</h3>
                  <p className="text-[11px] text-slate-400">Include joint owner for legal property registration.</p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
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
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
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

          {/* SECTION 2: CO-APPLICANT FORM ACCORDION */}
          {hasCoApplicant === 'Yes' && coApplicantDto && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div
                onClick={() => setIsCoApplicantOpen(!isCoApplicantOpen)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Section 2: Co-Applicant Details</h3>
                    <p className="text-[11px] text-slate-400">Co-owner personal info, address, identity & document uploads</p>
                  </div>
                </div>
                <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                  {isCoApplicantOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {isCoApplicantOpen && (
                <div className="p-4 sm:p-6">
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
                    documentSlots={currentSlots}
                    kycApplicationId={kycApplicationId}
                    onRefreshDocuments={refreshDocumentsSilently}
                    canEdit={canEdit}
                  />
                </div>
              )}
            </div>
          )}

          {/* THIRD APPLICANT TOGGLE CARD */}
          {hasCoApplicant === 'Yes' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Do you wish to add a 3rd Joint Owner?</h3>
                    <p className="text-[11px] text-slate-400">Include third applicant for legal property registration.</p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
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
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
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

          {/* SECTION 3: THIRD APPLICANT FORM ACCORDION */}
          {hasCoApplicant === 'Yes' && hasThirdApplicant === 'Yes' && thirdApplicantDto && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div
                onClick={() => setIsThirdApplicantOpen(!isThirdApplicantOpen)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Section 3: Third Applicant Details</h3>
                    <p className="text-[11px] text-slate-400">Third co-owner personal info, address & identity</p>
                  </div>
                </div>
                <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                  {isThirdApplicantOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {isThirdApplicantOpen && (
                <div className="p-4 sm:p-6">
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
                    documentSlots={currentSlots}
                    kycApplicationId={kycApplicationId}
                    onRefreshDocuments={refreshDocumentsSilently}
                    canEdit={canEdit}
                  />
                </div>
              )}
            </div>
          )}

          {/* HOME LOAN ASSISTANCE SECTION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold">
                <Landmark className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Home Loan Assistance</h3>
                <p className="text-[11px] text-slate-400">Are you considering applying for a home loan for this unit purchase?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => canEdit && setConsideringHomeLoan('No')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  consideringHomeLoan === 'No'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-1 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${consideringHomeLoan === 'No' ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Self-Funded / No Loan</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Payment will be made directly without bank financing.</div>
                </div>
              </button>

              <button
                type="button"
                disabled={!canEdit}
                onClick={() => canEdit && setConsideringHomeLoan('Yes')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  consideringHomeLoan === 'Yes'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-1 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${consideringHomeLoan === 'Yes' ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Applying for Home Loan</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">GoodEarth home loan desk will assist with bank sanction documents.</div>
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 4: ADDITIONAL MANDATORY DOCUMENTS & SLOTS ACCORDION */}
          {additionalSlots.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div
                onClick={() => setIsDocsOpen(!isDocsOpen)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Additional Document Proofs</h3>
                    <p className="text-[11px] text-slate-400">Address proof and supplementary verification files</p>
                  </div>
                </div>
                <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                  {isDocsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {isDocsOpen && (
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: REAL-TIME VALIDATION SUMMARY & LEGAL DECLARATION */}
          {canEdit && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div
                onClick={() => setIsReviewOpen(!isReviewOpen)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Validation Summary & Legal Declaration</h3>
                    <p className="text-[11px] text-slate-400">Review required fields, accept declaration, and submit KYC</p>
                  </div>
                </div>
                <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                  {isReviewOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {isReviewOpen && (
                <div className="p-4 sm:p-6 space-y-5">
                  {validationSummary && (
                    <KycValidationChecklist kycData={initialData} validationSummary={validationSummary} bookingId={bookingId} />
                  )}

                  {submitError && (
                    <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900">
                      {submitError}
                    </div>
                  )}

                  {/* Declaration Checkbox */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start gap-3">
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
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STICKY ACTION BAR AT BOTTOM */}
      {canEdit && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-2xl">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <AutosaveIndicator status={status} lastSavedAt={lastSavedAt} onRetry={handleSaveDraft} />
              <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 sm:hidden">
                <span>{completionPercent}% Complete</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-700"
              >
                <Save className="w-3.5 h-3.5 text-brand-500" />
                Save Draft
              </button>

              <button
                type="button"
                onClick={handleSubmitKyc}
                disabled={!canEdit || isSubmitting}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting
                  ? 'Submitting...'
                  : currentStatus === 'EDIT_ENABLED' || currentStatus === 'ACTION_REQUIRED'
                  ? 'Resubmit KYC'
                  : 'Submit KYC Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCopyModal && copySources.length > 0 && (
        <CopyKycModal
          sources={copySources}
          targetUnitName={activeUnit?.unitName || activeUnit?.zohoDealName || 'this property'}
          onCopy={handlePerformCopy}
          onClose={() => setShowCopyModal(false)}
        />
      )}
    </div>
  );
};

export default SingleKycPage;
