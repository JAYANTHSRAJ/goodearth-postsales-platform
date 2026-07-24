import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  ShieldCheck,
  Hammer,
  FileText,
  CreditCard,
  Sparkles,
  MessageSquare,
  Clock,
  CheckCircle2,
  Edit3,
  XCircle,
  Phone,
  Mail,
  Building,
  Eye,
} from 'lucide-react';
import kycService from '../../kyc/services/kyc.service';
import { KycApplicationResponseDto, DocumentSlotDto } from '../../kyc/types/kyc';
import { KycWorkflowTimeline } from '../../kyc/components/KycWorkflowTimeline';
import DocumentPreviewModal from '../../kyc/components/documents/DocumentPreviewModal';

type DashboardTab =
  | 'overview'
  | 'kyc'
  | 'payments'
  | 'construction'
  | 'documents'
  | 'selections'
  | 'support'
  | 'timeline';

export const BuyerDashboardPage: React.FC = () => {
  const { id, bookingId: routeBookingId } = useParams<{ id?: string; bookingId?: string }>();
  const navigate = useNavigate();

  const bookingId = routeBookingId || id || '';
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // KYC Backend Data
  const [kycData, setKycData] = useState<KycApplicationResponseDto | null>(null);

  // Document Preview State
  const [previewSlot, setPreviewSlot] = useState<DocumentSlotDto | null>(null);

  // Modal states for KYC Admin Actions
  const [activeModal, setActiveModal] = useState<'GRANT_EDIT' | 'REJECT' | 'NOTE' | null>(null);
  const [modalReason, setModalReason] = useState<string>('');
  const [modalNote, setModalNote] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchKycData = async () => {
    if (!bookingId) {
      return;
    }
    try {
      const res = await kycService.getKycByBooking(bookingId).catch(() => null);
      if (res) {
        setKycData(res);
      }
    } catch {
      // Gracefully handled
    }
  };

  useEffect(() => {
    fetchKycData();
  }, [bookingId]);

  const handleGrantEditAccess = async () => {
    if (!kycData || !modalReason.trim()) return;
    setActionError(null);
    try {
      const updated = await kycService.grantEditAccess({
        kycApplicationId: kycData.kycApplicationId,
        reason: modalReason.trim(),
      });
      setKycData(updated);
      setActionSuccess('Edit access granted to buyer. Status updated to EDIT_ENABLED.');
      setActiveModal(null);
      setModalReason('');
    } catch (err: any) {
      setActionError(err?.message || 'Failed to grant edit access.');
    }
  };

  const handleApproveKyc = async () => {
    if (!kycData) return;
    setActionError(null);
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

      setActionSuccess('KYC Application Approved. Form is locked permanently.');
      fetchKycData();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to approve application.');
    }
  };

  const handleRejectKyc = async () => {
    if (!kycData || !modalReason.trim()) return;
    setActionError(null);
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
      fetchKycData();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to reject application.');
    }
  };

  const handleAddNote = async () => {
    if (!kycData || !modalNote.trim()) return;
    setActionError(null);
    try {
      const updated = await kycService.addInternalNote({
        kycApplicationId: kycData.kycApplicationId,
        note: modalNote.trim(),
      });
      setKycData(updated);
      setActionSuccess('Private admin note saved.');
      setActiveModal(null);
      setModalNote('');
    } catch (err: any) {
      setActionError(err?.message || 'Failed to save internal note.');
    }
  };

  // Buyer Info derived from real backend data
  const primaryName = kycData?.primaryApplicant?.fullName || 'No Buyer Assigned';
  const buyerEmail = kycData?.primaryApplicant?.email || 'N/A';
  const buyerPhone = kycData?.primaryApplicant?.phone || 'N/A';
  const documentSlots = kycData?.documentSlots || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 text-left">
      {/* Back Button */}
      <button
        onClick={() => navigate('/buyers')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Buyers List
      </button>

      {/* Buyer Workspace Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white font-serif font-bold text-2xl flex items-center justify-center shadow-md">
            {primaryName.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{primaryName}</h1>
              {bookingId && (
                <span className="px-3 py-1 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 rounded-full text-xs font-bold font-mono">
                  #{bookingId}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-brand-500" /> {buyerEmail}</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-brand-500" /> {buyerPhone}</span>
              <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-brand-500" /> {bookingId}</span>
            </div>
          </div>
        </div>

        {/* Header Status Badges */}
        <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800 w-full md:w-auto">
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">KYC Status</div>
            <div className="font-bold text-slate-900 dark:text-white mt-0.5">{kycData?.status || 'NOT SUBMITTED'}</div>
          </div>
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Completion</div>
            <div className="font-bold text-brand-600 dark:text-brand-400 mt-0.5">{kycData?.completionPercentage || 0}%</div>
          </div>
        </div>
      </div>

      {/* Success / Error Banners */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600">✕</button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-xs font-bold flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-600">✕</button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl overflow-x-auto">
        {(['overview', 'kyc', 'payments', 'construction', 'documents', 'selections', 'support', 'timeline'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap capitalize ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" /> Buyer Information
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-400">Primary Applicant:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{primaryName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-400">Email Address:</span>
                <span className="font-mono text-slate-900 dark:text-white">{buyerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone Number:</span>
                <span className="font-mono text-slate-900 dark:text-white">{buyerPhone}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-600" /> Booking Details
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-400">Booking Reference:</span>
                <span className="font-bold font-mono text-brand-600 dark:text-brand-400">{bookingId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-400">Home Loan Considered:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{kycData?.consideringHomeLoan || 'Not Specified'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" /> KYC Status Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-400">Verification Status:</span>
                <span className="px-2.5 py-0.5 bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300 rounded-full font-bold">
                  {kycData?.status || 'NOT SUBMITTED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Completion:</span>
                <span className="font-semibold text-brand-600 dark:text-brand-400">{kycData?.completionPercentage || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. KYC TAB */}
      {activeTab === 'kyc' && (
        <div className="space-y-6">
          {/* Admin KYC Action Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Admin KYC Review & Control Desk
              </h3>
              <p className="text-xs text-slate-500">
                Review submitted applicant details, inspect identity documents, and update state. Admin cannot edit buyer data directly.
              </p>
            </div>
            {kycData && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleApproveKyc}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve KYC
                </button>
                <button
                  onClick={() => setActiveModal('GRANT_EDIT')}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Edit3 className="w-4 h-4" /> Grant Edit Access
                </button>
                <button
                  onClick={() => setActiveModal('REJECT')}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <XCircle className="w-4 h-4" /> Reject KYC
                </button>
              </div>
            )}
          </div>

          {/* Workflow Timeline */}
          {kycData ? (
            <KycWorkflowTimeline
              status={kycData.status}
              submittedAt={kycData.submittedAt}
              verifiedAt={kycData.verifiedAt}
              verifiedBy={kycData.verifiedBy}
            />
          ) : (
            <div className="p-8 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-3xl text-center text-xs font-semibold text-slate-500">
              KYC Not Submitted
            </div>
          )}

          {/* KYC Applicants Particulars */}
          {kycData ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Submitted Applicants (Read-Only)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {kycData.primaryApplicant && (
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-brand-600">
                      Primary Applicant
                    </div>
                    <div className="space-y-1 text-slate-700 dark:text-slate-300">
                      <div><span className="text-slate-400">Full Name:</span> {kycData.primaryApplicant.fullName}</div>
                      <div><span className="text-slate-400">PAN:</span> <span className="font-mono font-bold">{kycData.primaryApplicant.panNumber || 'N/A'}</span></div>
                      <div><span className="text-slate-400">Aadhaar:</span> <span className="font-mono font-bold">{kycData.primaryApplicant.maskedAadhaarNumber || kycData.primaryApplicant.aadhaarNumber || 'N/A'}</span></div>
                      <div><span className="text-slate-400">Email:</span> {kycData.primaryApplicant.email || 'N/A'}</div>
                      <div><span className="text-slate-400">Phone:</span> {kycData.primaryApplicant.phone || 'N/A'}</div>
                    </div>
                  </div>
                )}

                {kycData.jointApplicants && kycData.jointApplicants.map((joint, idx) => (
                  <div key={joint.id || idx} className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-brand-600">
                      Joint Applicant {idx + 1} ({joint.applicantType})
                    </div>
                    <div className="space-y-1 text-slate-700 dark:text-slate-300">
                      <div><span className="text-slate-400">Full Name:</span> {joint.fullName}</div>
                      <div><span className="text-slate-400">PAN:</span> <span className="font-mono font-bold">{joint.panNumber || 'N/A'}</span></div>
                      <div><span className="text-slate-400">Aadhaar:</span> <span className="font-mono font-bold">{joint.maskedAadhaarNumber || joint.aadhaarNumber || 'N/A'}</span></div>
                      <div><span className="text-slate-400">Email:</span> {joint.email || 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Internal Notes */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-500" /> Private Admin Notes
                  </h4>
                  <button
                    onClick={() => setActiveModal('NOTE')}
                    className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-200"
                  >
                    + Add Admin Note
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {kycData.internalNotes || 'No internal notes recorded yet.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-xs font-semibold text-slate-500">
              KYC Not Submitted
            </div>
          )}
        </div>
      )}

      {/* 3. PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-sm">
          <CreditCard className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No payment information available.</h3>
          <p className="text-xs text-slate-500 mt-1">Payment records and milestone invoicing will display here when payment integration updates are synchronized.</p>
        </div>
      )}

      {/* 4. CONSTRUCTION TAB */}
      {activeTab === 'construction' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-sm">
          <Hammer className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No construction updates available.</h3>
          <p className="text-xs text-slate-500 mt-1">Site progress photos, curing logs and phase updates will be published by site engineers upon milestone verification.</p>
        </div>
      )}

      {/* 5. DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" /> Uploaded Documents Repository
          </h3>

          {documentSlots.length > 0 && documentSlots.some((s) => s.currentVersion) ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {documentSlots
                .filter((s) => s.currentVersion)
                .map((slot) => (
                  <div key={slot.documentId} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-brand-500" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {slot.currentVersion?.fileName || slot.documentType}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Category: {slot.documentCategory} | Slot: {slot.documentType}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewSlot(slot)}
                        className="px-3 py-1.5 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 rounded-xl font-bold flex items-center gap-1 hover:bg-brand-100"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-semibold text-slate-500">
              No documents uploaded.
            </div>
          )}
        </div>
      )}

      {/* 6. SELECTIONS TAB */}
      {activeTab === 'selections' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-sm">
          <Sparkles className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No selections submitted.</h3>
          <p className="text-xs text-slate-500 mt-1">Design studio layout choices, electrical upgrades and finish selections will appear once submitted by buyer.</p>
        </div>
      )}

      {/* 7. SUPPORT TAB */}
      {activeTab === 'support' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-sm">
          <MessageSquare className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No support tickets.</h3>
          <p className="text-xs text-slate-500 mt-1">Homeowner queries, snag tickets and resolution logs will display here when submitted.</p>
        </div>
      )}

      {/* 8. TIMELINE TAB */}
      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-600" /> Chronological Event Timeline
          </h3>
          {kycData ? (
            <KycWorkflowTimeline
              status={kycData.status}
              submittedAt={kycData.submittedAt}
              verifiedAt={kycData.verifiedAt}
              verifiedBy={kycData.verifiedBy}
            />
          ) : (
            <div className="py-8 text-center text-xs font-semibold text-slate-500">
              No timeline events recorded yet.
            </div>
          )}
        </div>
      )}

      {/* MODALS */}

      {/* Grant Edit Access Modal */}
      {activeModal === 'GRANT_EDIT' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
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
                disabled={!modalReason.trim()}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Grant Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject KYC Modal */}
      {activeModal === 'REJECT' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" /> Reject KYC Application
            </h3>
            <p className="text-xs text-slate-500">
              Provide formal rejection comments.
            </p>
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
                onClick={handleRejectKyc}
                disabled={!modalReason.trim()}
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" /> Add Private Admin Note
            </h3>
            <p className="text-xs text-slate-500">
              This note is visible only to administrative staff and will not be shared with the buyer.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Internal Note *
              </label>
              <textarea
                rows={3}
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="Enter internal compliance or verification notes..."
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
                disabled={!modalNote.trim()}
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

export default BuyerDashboardPage;
