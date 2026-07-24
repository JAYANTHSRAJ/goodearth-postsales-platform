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
} from 'lucide-react';
import { KycApplicationResponseDto, DocumentSlotDto, ApplicantDto } from '../../types/kyc';
import kycService from '../../services/kyc.service';
import DocumentPreviewModal from '../documents/DocumentPreviewModal';

interface AdminKycReviewConsoleProps {
  kycData: KycApplicationResponseDto;
  onRefresh: () => void;
}

export const AdminKycReviewConsole: React.FC<AdminKycReviewConsoleProps> = ({ kycData, onRefresh }) => {
  // Modal Action States
  const [activeModal, setActiveModal] = useState<'GRANT_EDIT' | 'REJECT' | 'NOTE' | null>(null);
  const [modalReason, setModalReason] = useState<string>('');
  const [modalNote, setModalNote] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Document Preview Modal State
  const [previewSlot, setPreviewSlot] = useState<DocumentSlotDto | null>(null);

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

  return (
    <div className="space-y-6 text-left font-sans">
      {/* STICKY TOP HEADER CONTROL BAR */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-serif font-bold flex items-center justify-center text-lg">
            {primary?.fullName?.charAt(0) || 'K'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {primary?.fullName || 'Buyer Application'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
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
                {kycData.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Submitted: {kycData.submittedAt ? new Date(kycData.submittedAt).toLocaleDateString('en-IN') : 'N/A'}</span>
              <span>•</span>
              <span>Completion: {kycData.completionPercentage || 0}%</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Sticky Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleApprove}
            disabled={isSubmitting || kycData.status === 'APPROVED'}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve
          </button>
          <button
            onClick={() => setActiveModal('GRANT_EDIT')}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Edit3 className="w-4 h-4" /> Grant Edit Access
          </button>
          <button
            onClick={() => setActiveModal('REJECT')}
            disabled={isSubmitting || kycData.status === 'REJECTED'}
            className="flex-1 sm:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>
        </div>
      </div>

      {/* Notifications Banner */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 font-bold">✕</button>
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-xs font-bold flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-600 font-bold">✕</button>
        </div>
      )}

      {/* SECTION 1: APPLICATION SUMMARY */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div
          onClick={() => toggleSection('summary')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" /> Section 1: Application Summary
          </h3>
          {openSections.summary ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {openSections.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs font-semibold">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Booking Number</span>
              <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{kycData.bookingId}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Buyer Name</span>
              <span className="text-slate-900 dark:text-white font-bold">{primary?.fullName || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 truncate block">{primary?.email || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mobile Number</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{primary?.phone || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Submission Date</span>
              <span className="text-slate-900 dark:text-white">{kycData.submittedAt ? new Date(kycData.submittedAt).toLocaleDateString('en-IN') : 'Not Submitted'}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Workflow Status</span>
              <span className="font-bold text-brand-600">{kycData.status}</span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: APPLICANTS COMPARISON TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div
          onClick={() => toggleSection('applicants')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-brand-600" /> Section 2: Applicants Verification Matrix
          </h3>
          {openSections.applicants ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {openSections.applicants && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">Applicant Type</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">DOB</th>
                  <th className="p-3">PAN</th>
                  <th className="p-3">Aadhaar</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Occupation</th>
                  <th className="p-3">Family Particulars</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allApplicants.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-brand-600 dark:text-brand-400">{item.typeLabel}</td>
                    <td className="p-3 font-medium">{item.dto.salutation || 'N/A'}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{item.dto.fullName}</td>
                    <td className="p-3 font-mono">{item.dto.dateOfBirth || 'N/A'}</td>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{item.dto.panNumber || 'N/A'}</td>
                    <td className="p-3 font-mono">{item.dto.maskedAadhaarNumber || item.dto.aadhaarNumber || 'N/A'}</td>
                    <td className="p-3 font-mono">{item.dto.phone || 'N/A'}</td>
                    <td className="p-3 font-mono">{item.dto.email || 'N/A'}</td>
                    <td className="p-3 font-medium">{item.dto.occupation || 'N/A'}</td>
                    <td className="p-3 text-[11px] text-slate-500">
                      {item.dto.guardianRelation && item.dto.guardianFirstName
                        ? `${item.dto.guardianRelation}: ${item.dto.guardianSalutation || ''} ${item.dto.guardianFirstName} ${item.dto.guardianLastName || ''}`
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: IDENTITY DOCUMENTS GRID */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div
          onClick={() => toggleSection('documents')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" /> Section 3: Uploaded Identity Documents Grid
          </h3>
          {openSections.documents ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {openSections.documents && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">Document Name</th>
                  <th className="p-3">Slot Type</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Uploaded Version</th>
                  <th className="p-3">Verification Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {documentSlots.length > 0 ? (
                  documentSlots.map((slot) => (
                    <tr key={slot.documentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-500 shrink-0" />
                        <span>{slot.currentVersion?.fileName || slot.documentType}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px]">{slot.documentType}</td>
                      <td className="p-3 font-mono text-[11px]">{slot.documentCategory}</td>
                      <td className="p-3 font-mono">
                        {slot.currentVersion ? `v${slot.currentVersion.versionNumber}` : 'No Upload'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            slot.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : slot.currentVersion
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {slot.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {slot.currentVersion ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setPreviewSlot(slot)}
                              className="px-3 py-1.5 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 rounded-xl font-bold hover:bg-brand-100 flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Preview
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Not Uploaded</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No documents uploaded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 4: ADDRESS DETAILS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div
          onClick={() => toggleSection('address')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600" /> Section 4: Address Details
          </h3>
          {openSections.address ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {openSections.address && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-brand-600 uppercase text-[11px]">Primary Applicant Address</h4>
              <div className="space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                <div><span className="text-slate-400">Street Address:</span> {primary?.address?.street || 'N/A'}</div>
                <div><span className="text-slate-400">Address Line 2:</span> {primary?.address?.addressLine2 || 'N/A'}</div>
                <div><span className="text-slate-400">City:</span> {primary?.address?.city || 'N/A'}</div>
                <div><span className="text-slate-400">State:</span> {primary?.address?.state || 'N/A'}</div>
                <div><span className="text-slate-400">Postal PIN Code:</span> {primary?.address?.pincode || 'N/A'}</div>
                <div><span className="text-slate-400">Country:</span> {primary?.address?.country || 'India'}</div>
              </div>
            </div>

            {jointApplicants.length > 0 && jointApplicants[0].address && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-brand-600 uppercase text-[11px]">Co-Applicant Address</h4>
                <div className="space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                  <div><span className="text-slate-400">Street Address:</span> {jointApplicants[0].address.street || 'Same as Primary'}</div>
                  <div><span className="text-slate-400">Address Line 2:</span> {jointApplicants[0].address.addressLine2 || 'N/A'}</div>
                  <div><span className="text-slate-400">City:</span> {jointApplicants[0].address.city || 'N/A'}</div>
                  <div><span className="text-slate-400">State:</span> {jointApplicants[0].address.state || 'N/A'}</div>
                  <div><span className="text-slate-400">Postal PIN Code:</span> {jointApplicants[0].address.pincode || 'N/A'}</div>
                  <div><span className="text-slate-400">Country:</span> {jointApplicants[0].address.country || 'India'}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 5: EMPLOYMENT DETAILS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div
          onClick={() => toggleSection('employment')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-600" /> Section 5: Employment Details
          </h3>
          {openSections.employment ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {openSections.employment && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">Applicant</th>
                  <th className="p-3">Occupation / Profession</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allApplicants.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{item.dto.fullName} ({item.typeLabel})</td>
                    <td className="p-3 font-medium">{item.dto.occupation || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 6: LOAN DETAILS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div
          onClick={() => toggleSection('loan')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Landmark className="w-4 h-4 text-brand-600" /> Section 6: Home Loan Assistance Details
          </h3>
          {openSections.loan ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {openSections.loan && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs space-y-1 font-semibold border border-slate-200 dark:border-slate-700">
            <div><span className="text-slate-400">Considering Home Loan:</span> <span className="font-bold text-slate-900 dark:text-white">{kycData.consideringHomeLoan || 'No'}</span></div>
          </div>
        )}
      </div>

      {/* SECTION 7: DECLARATIONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div
          onClick={() => toggleSection('declarations')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-brand-600" /> Section 7: Legal Declaration & Submission Status
          </h3>
          {openSections.declarations ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {openSections.declarations && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs space-y-2 font-semibold border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" /> Legal Declaration Accepted by Primary Applicant
            </div>
            <div className="text-[11px] text-slate-500">
              Submitted Date: {kycData.submittedAt ? new Date(kycData.submittedAt).toLocaleString('en-IN') : 'N/A'}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 8: TIMELINE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div
          onClick={() => toggleSection('timeline')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" /> Section 8: KYC Audit Timeline
          </h3>
          {openSections.timeline ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {openSections.timeline && (
          <div className="relative border-l-2 border-brand-200 dark:border-brand-800 pl-4 space-y-4 ml-2 py-2 text-xs font-semibold">
            {kycData.applicationDate && (
              <div className="relative pl-4">
                <div className="absolute left-[-21px] top-1 h-3 w-3 rounded-full bg-brand-500" />
                <span className="font-bold text-slate-900 dark:text-white">Draft Application Initialized</span>
                <span className="text-[10px] text-slate-400 block font-mono">{kycData.applicationDate}</span>
              </div>
            )}
            {kycData.submittedAt && (
              <div className="relative pl-4">
                <div className="absolute left-[-21px] top-1 h-3 w-3 rounded-full bg-indigo-600" />
                <span className="font-bold text-slate-900 dark:text-white">Application Submitted by Buyer</span>
                <span className="text-[10px] text-slate-400 block font-mono">{new Date(kycData.submittedAt).toLocaleString('en-IN')}</span>
              </div>
            )}
            {kycData.verifiedAt && (
              <div className="relative pl-4">
                <div className="absolute left-[-21px] top-1 h-3 w-3 rounded-full bg-emerald-600" />
                <span className="font-bold text-emerald-700 dark:text-emerald-400">KYC Verified & Approved</span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {new Date(kycData.verifiedAt).toLocaleString('en-IN')} by {kycData.verifiedBy || 'Admin'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 9: PRIVATE ADMIN NOTES */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div
          onClick={() => toggleSection('notes')}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-3"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-500" /> Section 9: Private Admin Notes
            </h3>
            <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">Staff Only</span>
          </div>
          {openSections.notes ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {openSections.notes && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs space-y-2 border border-slate-200 dark:border-slate-700">
              <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 font-medium">
                {kycData.internalNotes || 'No internal notes recorded yet.'}
              </p>
            </div>

            <button
              onClick={() => setActiveModal('NOTE')}
              className="px-4 py-2 bg-amber-100 text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-200 transition-colors"
            >
              + Add Private Note
            </button>
          </div>
        )}
      </div>

      {/* MODALS */}

      {/* Grant Edit Modal */}
      {activeModal === 'GRANT_EDIT' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-left">
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-left">
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-left">
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
    </div>
  );
};

export default AdminKycReviewConsole;
