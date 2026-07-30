import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  FileText,
  Eye,
  MessageSquare,
  Clock,
  User,
  Building2,
  Briefcase,
  MapPin,
  Landmark,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Printer,
  Download,
} from 'lucide-react';
import { KycApplicationResponseDto, DocumentSlotDto, ApplicantDto } from '../../types/kyc';
import kycService from '../../services/kyc.service';
import DocumentPreviewModal from '../documents/DocumentPreviewModal';
import { formatDateTime, formatDate } from '../../../../utils/dateFormatter';

interface AdminKycReviewConsoleProps {
  kycData: KycApplicationResponseDto;
  onRefresh: () => void;
  showOfferLetterButton?: boolean;
}

export const AdminKycReviewConsole: React.FC<AdminKycReviewConsoleProps> = ({ kycData, onRefresh, showOfferLetterButton = true }) => {
  // Modal Action States
  const [activeModal, setActiveModal] = useState<'GRANT_EDIT' | 'REJECT' | 'NOTE' | null>(null);
  const [modalReason, setModalReason] = useState<string>('');
  const [modalNote, setModalNote] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Document Preview Modal State
  const [previewSlot, setPreviewSlot] = useState<DocumentSlotDto | null>(null);

  // Offer Letter Preview States
  const [offerLetterModalOpen, setOfferLetterModalOpen] = useState<boolean>(false);
  const [offerLetterUrl, setOfferLetterUrl] = useState<string>('');
  const [offerLetterLoading, setOfferLetterLoading] = useState<boolean>(false);
  const [offerLetterWarning, setOfferLetterWarning] = useState<string | null>(null);

  // Collapsible section toggles
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    summary: true,
    applicants: true,
    documents: true,
    address: true,
    employment: true,
    loan: true,
    declarations: true,
    timeline: true,
    notes: true,
    audit: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const primary = kycData.primaryApplicant;
  const jointApplicants = kycData.jointApplicants || [];
  const allApplicants: Array<{ typeLabel: string; dto: ApplicantDto }> = [];
  if (primary) allApplicants.push({ typeLabel: 'Primary Applicant', dto: primary });
  jointApplicants.forEach((j, idx) => {
    allApplicants.push({
      typeLabel: j.applicantType === 'JOINT_1' ? 'Co-Applicant (Joint 1)' : `Third Applicant (Joint ${idx + 1})`,
      dto: j,
    });
  });

  const documentSlots = kycData.documentSlots || [];

  const isReviewableStatus =
    kycData.status === 'UNDER_REVIEW' ||
    kycData.status === 'SUBMITTED' ||
    kycData.status === 'RESUBMITTED';

  // Admin Actions
  const handleApprove = async () => {
    setActionError(null);
    setIsSubmitting(true);
    try {
      const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${baseUrl}/kyc/review/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ kycApplicationId: kycData.kycApplicationId, approvalScope: 'FULL_APPLICATION' }),
      });
      if (!res.ok) throw new Error('Failed to approve KYC application');

      setActionSuccess('KYC Application formally Approved. Form is locked.');
      onRefresh();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to approve application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrantEditAccess = async () => {
    if (!modalReason.trim()) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      await kycService.grantEditAccess({
        kycApplicationId: kycData.kycApplicationId,
        reason: modalReason.trim(),
      });
      setActionSuccess('Edit access granted to buyer. Form status set to EDIT_ENABLED.');
      setActiveModal(null);
      setModalReason('');
      onRefresh();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to grant edit access.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!modalReason.trim()) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${baseUrl}/kyc/review/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          kycApplicationId: kycData.kycApplicationId,
          rejectionReasonCode: 'INCOMPLETE_OR_INCORRECT',
          rejectionComments: modalReason.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to reject KYC application');

      setActionSuccess('KYC Application Rejected.');
      setActiveModal(null);
      setModalReason('');
      onRefresh();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to reject application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!modalNote.trim()) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      await kycService.addInternalNote({
        kycApplicationId: kycData.kycApplicationId,
        note: modalNote.trim(),
      });
      setActionSuccess('Private admin note saved successfully.');
      setActiveModal(null);
      setModalNote('');
      onRefresh();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to save note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewOfferLetter = async () => {
    setOfferLetterWarning(null);
    setActionError(null);
    setOfferLetterLoading(true);
    try {
      const statusRes = await kycService.getOfferLetterStatus(kycData.bookingId);
      if (!statusRes.generated) {
        setOfferLetterWarning(statusRes.message || 'Offer Letter has not been generated yet.');
      } else {
        const fileUrl = kycService.getOfferLetterFileUrl(kycData.bookingId);
        setOfferLetterUrl(fileUrl);
        setOfferLetterModalOpen(true);
      }
    } catch (err: any) {
      setOfferLetterWarning('Offer Letter has not been generated yet.');
    } finally {
      setOfferLetterLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 text-left font-sans print:p-0 print:space-y-2">
      {/* 1. COMPACT STICKY CONTROL HEADER */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3 print:static print:border-none print:shadow-none">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {primary?.fullName || 'Buyer Application'}
              </h2>
              <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                #{kycData.bookingId}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  kycData.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : kycData.status === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : kycData.status === 'EDIT_ENABLED'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                }`}
              >
                {kycData.status || 'SUBMITTED'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
              <span><strong>Project:</strong> GoodEarth Malhar</span>
              <span>•</span>
              <span><strong>Unit:</strong> {kycData.bookingId}</span>
              <span>•</span>
              <span><strong>Submitted:</strong> {formatDateTime(kycData.submittedAt)}</span>
              <span>•</span>
              <span><strong>Last Saved:</strong> {formatDateTime(kycData.lastSavedAt)}</span>
            </div>
          </div>
        </div>

        {/* Sticky Action Controls */}
        <div className="flex items-center gap-2 shrink-0 print:hidden">
          <button
            onClick={handlePrint}
            title="Print KYC Console Summary"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button
            onClick={handleApprove}
            disabled={isSubmitting || kycData.status === 'DRAFT' || !isReviewableStatus}
            title={kycData.status === 'DRAFT' ? 'This KYC application is still in DRAFT and has not been submitted by the buyer.' : 'Approve KYC Application'}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
          </button>
          {showOfferLetterButton && kycData.status === 'APPROVED' && (
            <button
              onClick={handleViewOfferLetter}
              disabled={offerLetterLoading}
              title="View Deal Offer Letter PDF"
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              {offerLetterLoading ? 'Checking Status...' : 'View Offer Letter'}
            </button>
          )}
          <button
            onClick={() => setActiveModal('GRANT_EDIT')}
            disabled={isSubmitting || kycData.status === 'DRAFT'}
            title={kycData.status === 'DRAFT' ? 'This KYC application is still in DRAFT and has not been submitted by the buyer.' : 'Grant Edit Access'}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Edit3 className="w-3.5 h-3.5" /> Grant Edit Access
          </button>
          <button
            onClick={() => setActiveModal('REJECT')}
            disabled={isSubmitting || kycData.status === 'DRAFT' || !isReviewableStatus}
            title={kycData.status === 'DRAFT' ? 'This KYC application is still in DRAFT and has not been submitted by the buyer.' : 'Reject KYC Application'}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      </div>

      {/* DRAFT Status Notice */}
      {kycData.status === 'DRAFT' && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-semibold flex items-center gap-2 print:hidden shadow-sm">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>This KYC application is still in DRAFT and has not been submitted by the buyer.</span>
        </div>
      )}

      {/* Notifications & Warning Banners */}
      {offerLetterWarning && (
        <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-between print:hidden shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>{offerLetterWarning}</span>
          </div>
          <button onClick={() => setOfferLetterWarning(null)} className="text-amber-700 font-bold hover:text-amber-900 px-1">✕</button>
        </div>
      )}

      {/* Notifications Banner */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-between print:hidden">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 font-bold">✕</button>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-between print:hidden">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-600 font-bold">✕</button>
        </div>
      )}

      {/* SECTION 1: APPLICATION SUMMARY MATRIX */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div
          onClick={() => toggleSection('summary')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-2"
        >
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-brand-600" /> Section 1: Verification Metadata Summary
          </h3>
          {openSections.summary ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>

        {openSections.summary && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-500 w-1/4">Application GUID:</td>
                  <td className="p-2.5 font-mono text-slate-900 dark:text-white w-1/4">{kycData.kycApplicationId}</td>
                  <td className="p-2.5 font-bold text-slate-500 w-1/4">Home Loan Assistance:</td>
                  <td className="p-2.5 font-semibold text-slate-900 dark:text-white w-1/4">{kycData.consideringHomeLoan || 'Not Specified'}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-500">Verified By:</td>
                  <td className="p-2.5 text-slate-900 dark:text-white">{kycData.verifiedBy || 'Pending Compliance Verification'}</td>
                  <td className="p-2.5 font-bold text-slate-500">Verification Timestamp:</td>
                  <td className="p-2.5 font-mono text-slate-900 dark:text-white">{formatDateTime(kycData.verifiedAt)}</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-500">Zoho CRM Sync Status:</td>
                  <td className="p-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        kycData.zohoSyncStatus === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : kycData.zohoSyncStatus === 'FAILED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {kycData.zohoSyncStatus || 'SUCCESS'}
                    </span>
                  </td>
                  <td className="p-2.5 font-bold text-slate-500">Zoho Last Synced:</td>
                  <td className="p-2.5 font-mono text-slate-900 dark:text-white">{formatDateTime(kycData.zohoLastSyncedAt || kycData.lastSavedAt)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: APPLICANTS COMPREHENSIVE MATRIX TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div
          onClick={() => toggleSection('applicants')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-2"
        >
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-brand-600" /> Section 2: Applicants Verification Matrix
          </h3>
          {openSections.applicants ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>

        {openSections.applicants && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-200 dark:border-slate-700 border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-700 text-[10px]">
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">Applicant Type</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">Title</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">Full Name</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">DOB</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">Gender</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">PAN</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">Aadhaar</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">Phone</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">Email</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">Occupation</th>
                  <th className="p-2.5">Relationship</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {allApplicants.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold text-brand-700 dark:text-brand-300 border-r border-slate-200 dark:border-slate-700">{item.typeLabel}</td>
                    <td className="p-2.5 font-medium border-r border-slate-200 dark:border-slate-700">{item.dto.salutation || 'N/A'}</td>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">{item.dto.fullName}</td>
                    <td className="p-2.5 font-mono border-r border-slate-200 dark:border-slate-700">{formatDate(item.dto.dateOfBirth)}</td>
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-700">{item.dto.gender || 'N/A'}</td>
                    <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">{item.dto.panNumber || 'N/A'}</td>
                    <td className="p-2.5 font-mono border-r border-slate-200 dark:border-slate-700">{item.dto.maskedAadhaarNumber || item.dto.aadhaarNumber || 'N/A'}</td>
                    <td className="p-2.5 font-mono border-r border-slate-200 dark:border-slate-700">{item.dto.phone || 'N/A'}</td>
                    <td className="p-2.5 font-mono border-r border-slate-200 dark:border-slate-700">{item.dto.email || 'N/A'}</td>
                    <td className="p-2.5 font-medium border-r border-slate-200 dark:border-slate-700">{item.dto.occupation || 'N/A'}</td>
                    <td className="p-2.5 text-[11px] text-slate-600 dark:text-slate-300">
                      {item.dto.guardianRelation && item.dto.guardianFirstName
                        ? `${item.dto.guardianRelation}: ${item.dto.guardianSalutation || ''} ${item.dto.guardianFirstName} ${item.dto.guardianLastName || ''}`
                        : item.dto.relation || 'Self'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: IDENTITY DOCUMENTS MATRIX TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div
          onClick={() => toggleSection('documents')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-2"
        >
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-brand-600" /> Section 3: Identity Documents Verification Table
          </h3>
          {openSections.documents ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>

        {openSections.documents && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-200 dark:border-slate-700 border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-700 text-[10px]">
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">Document Type</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">Uploaded File Name</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">Uploaded Date</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">Version</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">Status</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 print:hidden text-center">Preview</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 print:hidden text-center">Download</th>
                  <th className="p-2.5">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {documentSlots.length > 0 ? (
                  documentSlots.map((slot) => {
                    const isUploaded = Boolean(slot.currentVersion);
                    const fileName = isUploaded ? slot.currentVersion?.fileName : '—';
                    const uploadedDate = isUploaded ? formatDate(slot.currentVersion?.uploadedAt) : '—';
                    const versionStr = isUploaded ? `v${slot.currentVersion?.versionNumber}` : '—';

                    return (
                      <tr key={slot.documentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                          {slot.documentType} ({slot.applicantType})
                        </td>
                        <td className="p-2.5 font-mono text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">
                          {fileName}
                        </td>
                        <td className="p-2.5 font-mono border-r border-slate-200 dark:border-slate-700">
                          {uploadedDate}
                        </td>
                        <td className="p-2.5 font-mono border-r border-slate-200 dark:border-slate-700">
                          {versionStr}
                        </td>
                        <td className="p-2.5 font-semibold border-r border-slate-200 dark:border-slate-700">
                          {isUploaded ? (
                            <span className="text-emerald-700 font-bold">Uploaded</span>
                          ) : (
                            <span className="text-slate-400 italic">Not Uploaded</span>
                          )}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-700 print:hidden text-center">
                          {isUploaded ? (
                            <button
                              onClick={() => setPreviewSlot(slot)}
                              className="px-2.5 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-300 rounded font-bold text-xs inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Preview
                            </button>
                          ) : null}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-700 print:hidden text-center">
                          {isUploaded && slot.currentVersion ? (
                            <a
                              href={kycService.getFileUrl(slot.documentId, slot.currentVersion.versionNumber)}
                              target="_blank"
                              rel="noreferrer"
                              download={slot.currentVersion.fileName}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded font-bold text-xs inline-flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" /> Download
                            </a>
                          ) : null}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              slot.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : isUploaded
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isUploaded ? (slot.status || 'PENDING') : 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-slate-400 italic">
                      No documents uploaded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 4: ADDRESS DETAILS (SIDE-BY-SIDE STRUCTURED TABLES) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div
          onClick={() => toggleSection('address')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-2"
        >
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-brand-600" /> Section 4: Address Verification Tables
          </h3>
          {openSections.address ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>

        {openSections.address && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Communication Address Table */}
            <div>
              <h4 className="font-bold text-brand-700 uppercase text-[11px] mb-1.5">Communication Address (Primary)</h4>
              <table className="w-full text-left border border-slate-200 dark:border-slate-700 border-collapse">
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  <tr><td className="p-2 font-bold text-slate-500 w-1/3 bg-slate-50 dark:bg-slate-800">Street Address:</td><td className="p-2 font-semibold text-slate-900 dark:text-white">{primary?.address?.street || 'N/A'}</td></tr>
                  <tr><td className="p-2 font-bold text-slate-500 bg-slate-50 dark:bg-slate-800">Address Line 2:</td><td className="p-2 text-slate-900 dark:text-white">{primary?.address?.addressLine2 || 'N/A'}</td></tr>
                  <tr><td className="p-2 font-bold text-slate-500 bg-slate-50 dark:bg-slate-800">City:</td><td className="p-2 font-semibold text-slate-900 dark:text-white">{primary?.address?.city || 'N/A'}</td></tr>
                  <tr><td className="p-2 font-bold text-slate-500 bg-slate-50 dark:bg-slate-800">State:</td><td className="p-2 font-semibold text-slate-900 dark:text-white">{primary?.address?.state || 'N/A'}</td></tr>
                  <tr><td className="p-2 font-bold text-slate-500 bg-slate-50 dark:bg-slate-800">Postal PIN Code:</td><td className="p-2 font-mono font-bold text-slate-900 dark:text-white">{primary?.address?.pincode || 'N/A'}</td></tr>
                  <tr><td className="p-2 font-bold text-slate-500 bg-slate-50 dark:bg-slate-800">Country:</td><td className="p-2 text-slate-900 dark:text-white">{primary?.address?.country || 'India'}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Permanent Address Table */}
            <div>
              <h4 className="font-bold text-brand-700 uppercase text-[11px] mb-1.5">Permanent / Secondary Address</h4>
              <table className="w-full text-left border border-slate-200 dark:border-slate-700 border-collapse">
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {jointApplicants.length > 0 && jointApplicants[0].address ? (
                    <>
                      <tr><td className="p-2 font-bold text-slate-500 w-1/3 bg-slate-50 dark:bg-slate-800">Street Address:</td><td className="p-2 font-semibold text-slate-900 dark:text-white">{jointApplicants[0].address.street || 'Same as Primary'}</td></tr>
                      <tr><td className="p-2 font-bold text-slate-500 bg-slate-50 dark:bg-slate-800">Address Line 2:</td><td className="p-2 text-slate-900 dark:text-white">{jointApplicants[0].address.addressLine2 || 'N/A'}</td></tr>
                      <tr><td className="p-2 font-bold text-slate-500 bg-slate-50 dark:bg-slate-800">City:</td><td className="p-2 font-semibold text-slate-900 dark:text-white">{jointApplicants[0].address.city || 'N/A'}</td></tr>
                      <tr><td className="p-2 font-bold text-slate-500 bg-slate-50 dark:bg-slate-800">State:</td><td className="p-2 font-semibold text-slate-900 dark:text-white">{jointApplicants[0].address.state || 'N/A'}</td></tr>
                      <tr><td className="p-2 font-bold text-slate-500 bg-slate-50 dark:bg-slate-800">Postal PIN Code:</td><td className="p-2 font-mono font-bold text-slate-900 dark:text-white">{jointApplicants[0].address.pincode || 'N/A'}</td></tr>
                      <tr><td className="p-2 font-bold text-slate-500 bg-slate-50 dark:bg-slate-800">Country:</td><td className="p-2 text-slate-900 dark:text-white">{jointApplicants[0].address.country || 'India'}</td></tr>
                    </>
                  ) : (
                    <tr><td colSpan={2} className="p-4 text-center text-slate-400 italic">Same as Primary Communication Address.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: EMPLOYMENT DETAILS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div
          onClick={() => toggleSection('employment')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-2"
        >
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-3.5 h-3.5 text-brand-600" /> Section 5: Employment Particulars Table
          </h3>
          {openSections.employment ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>

        {openSections.employment && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-200 dark:border-slate-700 border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-700 text-[10px]">
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">Applicant</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700">Occupation / Profession</th>
                  <th className="p-2.5">Employment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {allApplicants.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">{item.dto.fullName} ({item.typeLabel})</td>
                    <td className="p-2.5 font-semibold text-brand-700 border-r border-slate-200 dark:border-slate-700">{item.dto.occupation || 'N/A'}</td>
                    <td className="p-2.5 text-slate-600">{item.dto.occupation ? 'Recorded' : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 6: HOME LOAN DETAILS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div
          onClick={() => toggleSection('loan')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-2"
        >
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Landmark className="w-3.5 h-3.5 text-brand-600" /> Section 6: Home Loan Assistance Table
          </h3>
          {openSections.loan ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>

        {openSections.loan && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-200 dark:border-slate-700 border-collapse text-xs">
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                <tr>
                  <td className="p-2.5 font-bold text-slate-500 w-1/3 bg-slate-50 dark:bg-slate-800">Home Loan Requested:</td>
                  <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                    {kycData.consideringHomeLoan === 'Yes' ? 'Yes' : 'No Home Loan Requested.'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 7: DECLARATIONS SUMMARY TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div
          onClick={() => toggleSection('declarations')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-2"
        >
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FileCheck className="w-3.5 h-3.5 text-brand-600" /> Section 7: Declarations & Verification Status
          </h3>
          {openSections.declarations ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>

        {openSections.declarations && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-200 dark:border-slate-700 border-collapse text-xs">
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                <tr>
                  <td className="p-2.5 font-bold text-slate-500 w-1/3 bg-slate-50 dark:bg-slate-800">Legal Terms Accepted:</td>
                  <td className="p-2.5 font-bold text-emerald-700">✓ Accepted by Primary Applicant</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-500 bg-slate-50 dark:bg-slate-800">Submission Timestamp:</td>
                  <td className="p-2.5 font-mono text-slate-900 dark:text-white">{formatDateTime(kycData.submittedAt)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 8: TIMELINE (REAL EVENTS ONLY) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div
          onClick={() => toggleSection('timeline')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-2"
        >
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-brand-600" /> Section 8: KYC Audit Timeline
          </h3>
          {openSections.timeline ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>

        {openSections.timeline && (
          <div className="relative border-l-2 border-brand-200 dark:border-brand-800 pl-4 space-y-3 ml-2 py-1 text-xs font-semibold">
            {kycData.applicationDate && (
              <div className="relative pl-4">
                <div className="absolute left-[-21px] top-1 h-3 w-3 rounded-full bg-brand-500" />
                <span className="font-bold text-slate-900 dark:text-white">Draft Application Initialized</span>
                <span className="text-[10px] text-slate-400 block font-mono">{formatDate(kycData.applicationDate)}</span>
              </div>
            )}
            {kycData.submittedAt && (
              <div className="relative pl-4">
                <div className="absolute left-[-21px] top-1 h-3 w-3 rounded-full bg-indigo-600" />
                <span className="font-bold text-slate-900 dark:text-white">Application Submitted by Buyer</span>
                <span className="text-[10px] text-slate-400 block font-mono">{formatDateTime(kycData.submittedAt)}</span>
              </div>
            )}
            {kycData.verifiedAt && (
              <div className="relative pl-4">
                <div className="absolute left-[-21px] top-1 h-3 w-3 rounded-full bg-emerald-600" />
                <span className="font-bold text-emerald-700 dark:text-emerald-400">KYC Verified & Approved</span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {formatDateTime(kycData.verifiedAt)} by {kycData.verifiedBy || 'Admin'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 9: PRIVATE ADMIN NOTES (TABLE FORMAT) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" /> Section 9: Private Admin Notes
            </h3>
            <span className="text-[9px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">Staff Only</span>
          </div>
          <button
            onClick={() => setActiveModal('NOTE')}
            className="px-3 py-1 bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-lg text-xs font-bold transition-colors print:hidden"
          >
            + Add Private Note
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border border-slate-200 dark:border-slate-700 border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-700 text-[10px]">
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-1/4">Date</th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-1/4">Author</th>
                <th className="p-2.5">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {kycData.internalNotes ? (
                <tr>
                  <td className="p-2.5 font-mono text-[11px] border-r border-slate-200 dark:border-slate-700">{formatDateTime(kycData.lastSavedAt)}</td>
                  <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">Admin Staff</td>
                  <td className="p-2.5 whitespace-pre-wrap text-slate-800 dark:text-slate-200">{kycData.internalNotes}</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={3} className="p-3 text-center text-slate-400 italic">No admin notes available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 10: AUDIT LOGS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div
          onClick={() => toggleSection('audit')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-2"
        >
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-brand-600" /> Section 10: Audit Logs Table
          </h3>
          {openSections.audit ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>

        {openSections.audit && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-200 dark:border-slate-700 border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-700 text-[10px]">
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-1/4">Timestamp</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-1/4">User</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-1/4">Action</th>
                  <th className="p-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {kycData.submittedAt && (
                  <tr>
                    <td className="p-2.5 font-mono text-[11px] border-r border-slate-200 dark:border-slate-700">{formatDateTime(kycData.submittedAt)}</td>
                    <td className="p-2.5 font-bold border-r border-slate-200 dark:border-slate-700">{primary?.fullName || 'Buyer'}</td>
                    <td className="p-2.5 font-semibold text-indigo-700 border-r border-slate-200 dark:border-slate-700">KYC Submitted</td>
                    <td className="p-2.5 text-slate-600">Application submitted for admin review</td>
                  </tr>
                )}
                {kycData.verifiedAt && (
                  <tr>
                    <td className="p-2.5 font-mono text-[11px] border-r border-slate-200 dark:border-slate-700">{formatDateTime(kycData.verifiedAt)}</td>
                    <td className="p-2.5 font-bold border-r border-slate-200 dark:border-slate-700">{kycData.verifiedBy || 'Admin'}</td>
                    <td className="p-2.5 font-semibold text-emerald-700 border-r border-slate-200 dark:border-slate-700">KYC Approved</td>
                    <td className="p-2.5 text-slate-600">Full application verified and locked</td>
                  </tr>
                )}
                {!kycData.submittedAt && !kycData.verifiedAt && (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-slate-400 italic">No audit logs available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}

      {/* Grant Edit Access Modal */}
      {activeModal === 'GRANT_EDIT' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-500" /> Grant Edit Access to Buyer
            </h3>
            <p className="text-xs text-slate-500">
              Unlocks the buyer's KYC form and displays an "Action Required" banner with your instructions.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason / Instructions for Buyer (Mandatory) *
              </label>
              <textarea
                rows={3}
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="e.g. Upload clearer PAN card photo, update permanent address..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantEditAccess}
                disabled={!modalReason.trim() || isSubmitting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Grant Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {activeModal === 'REJECT' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" /> Reject KYC Application
            </h3>
            <p className="text-xs text-slate-500">Provide rejection comments.</p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rejection Comments (Mandatory) *
              </label>
              <textarea
                rows={3}
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!modalReason.trim() || isSubmitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Note Modal */}
      {activeModal === 'NOTE' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" /> Add Private Admin Note
            </h3>
            <p className="text-xs text-slate-500">
              This note is visible only to staff and will not be shared with the buyer.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Internal Note *
              </label>
              <textarea
                rows={3}
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="Enter internal compliance notes..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!modalNote.trim() || isSubmitting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Stream Preview Modal */}
      {previewSlot && previewSlot.currentVersion && (
        <DocumentPreviewModal
          isOpen={Boolean(previewSlot)}
          onClose={() => setPreviewSlot(null)}
          fileName={previewSlot.currentVersion.fileName || 'Document.pdf'}
          fileUrl={kycService.getFileUrl(previewSlot.documentId, previewSlot.currentVersion.versionNumber)}
        />
      )}

      {/* Offer Letter Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={offerLetterModalOpen}
        onClose={() => setOfferLetterModalOpen(false)}
        fileName={`Offer_Letter_${kycData.bookingId}.pdf`}
        fileUrl={offerLetterUrl}
        mimeType="application/pdf"
      />
    </div>
  );
};

export default AdminKycReviewConsole;
