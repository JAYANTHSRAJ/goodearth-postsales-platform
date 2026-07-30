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
  Edit3,
  XCircle,
  Phone,
  Mail,
  Building,
  Eye,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import kycService from '../../kyc/services/kyc.service';
import { KycApplicationResponseDto, DocumentSlotDto } from '../../kyc/types/kyc';
import { KycWorkflowTimeline } from '../../kyc/components/KycWorkflowTimeline';
import DocumentPreviewModal from '../../kyc/components/documents/DocumentPreviewModal';
import { AdminKycReviewConsole } from '../../kyc/components/review/AdminKycReviewConsole';
import { useAuthStore } from '../../../store/authStore';

type DashboardTab =
  | 'overview'
  | 'kyc'
  | 'offer_letter'
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

  const { user } = useAuthStore();
  const canManageOfferLetter = !!user && user.role !== 'buyer';

  // Offer Letter States
  const [offerLetterModalOpen, setOfferLetterModalOpen] = useState<boolean>(false);
  const [offerLetterUrl, setOfferLetterUrl] = useState<string>('');
  const [offerLetterLoading, setOfferLetterLoading] = useState<boolean>(false);
  const [offerLetterWarning, setOfferLetterWarning] = useState<string | null>(null);
  const [isOfferLetterSent, setIsOfferLetterSent] = useState<boolean>(false);
  const [sendOfferLetterLoading, setSendOfferLetterLoading] = useState<boolean>(false);

  // Modal states for KYC Admin Actions
  const [activeModal, setActiveModal] = useState<'GRANT_EDIT' | 'REJECT' | 'NOTE' | null>(null);
  const [modalReason, setModalReason] = useState<string>('');
  const [modalNote, setModalNote] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleViewOfferLetter = async () => {
    setOfferLetterWarning(null);
    setOfferLetterLoading(true);
    try {
      const targetBooking = bookingId || kycData?.bookingId || 'DEFAULT_BOOKING';
      const statusRes = await kycService.getOfferLetterStatus(targetBooking);
      setIsOfferLetterSent(Boolean(statusRes.sent));
      if (!statusRes.sent && !statusRes.generated) {
        setOfferLetterWarning(statusRes.message || 'Your Offer Letter has not been shared yet.');
      } else {
        const fileUrl = kycService.getOfferLetterFileUrl(targetBooking);
        setOfferLetterUrl(fileUrl);
        setOfferLetterModalOpen(true);
      }
    } catch {
      setOfferLetterWarning('Your Offer Letter has not been shared yet.');
    } finally {
      setOfferLetterLoading(false);
    }
  };

  const handleSendOfferLetter = async () => {
    const targetBooking = bookingId || kycData?.bookingId;
    if (!targetBooking) return;
    setSendOfferLetterLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await kycService.sendOfferLetter(targetBooking);
      setIsOfferLetterSent(true);
      setOfferLetterWarning(null);
      setActionSuccess(res.message || 'Offer Letter sent successfully to buyer email and unlocked in Buyer Portal.');
    } catch (err: any) {
      setActionError(err?.message || 'Failed to send Offer Letter to buyer.');
    } finally {
      setSendOfferLetterLoading(false);
    }
  };

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
        {(['overview', 'kyc', 'offer_letter', 'payments', 'construction', 'documents', 'selections', 'support', 'timeline'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === 'offer_letter' && kycData?.status === 'APPROVED') {
                handleViewOfferLetter();
              }
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab === 'offer_letter' ? 'View Offer Letter' : tab === 'kyc' ? 'KYC' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
          {kycData ? (
            <AdminKycReviewConsole kycData={kycData} onRefresh={fetchKycData} showOfferLetterButton={false} />
          ) : (
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-xs font-semibold text-slate-500">
              KYC Not Submitted
            </div>
          )}
        </div>
      )}

      {/* OFFER LETTER TAB */}
      {activeTab === 'offer_letter' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" /> Official Offer Letter
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                View and review your generated property allotment and milestone offer letter.
              </p>
            </div>
            {kycData?.status === 'APPROVED' && (
              <button
                onClick={handleViewOfferLetter}
                disabled={offerLetterLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 shrink-0"
              >
                <FileText className="w-4 h-4" />
                {offerLetterLoading ? 'Checking Status...' : 'View Offer Letter'}
              </button>
            )}
          </div>

          {kycData?.status !== 'APPROVED' ? (
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-2">
              <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">KYC Approval Required</h4>
              <p className="text-xs text-slate-500">
                Offer Letter generation unlocks after your KYC application is reviewed and approved by GoodEarth Admin.
              </p>
            </div>
          ) : !isOfferLetterSent ? (
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-2">
              <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Offer Letter Not Shared Yet</h4>
              <p className="text-xs text-slate-500">
                {offerLetterWarning || 'Your Offer Letter has not been shared yet.'}
              </p>
            </div>
          ) : offerLetterWarning ? (
            <div className="p-6 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>{offerLetterWarning}</span>
              </div>
              <button onClick={handleViewOfferLetter} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs">
                Retry
              </button>
            </div>
          ) : (
            <div className="p-6 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Offer Letter Ready</div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Your official allotment and milestone Offer Letter document is ready for viewing.</div>
              </div>
              <button
                onClick={handleViewOfferLetter}
                disabled={offerLetterLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all shrink-0"
              >
                <Eye className="w-4 h-4" /> Open PDF Viewer
              </button>
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

      {/* Offer Letter Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={offerLetterModalOpen}
        onClose={() => setOfferLetterModalOpen(false)}
        fileName={`Offer_Letter_${bookingId || kycData?.bookingId || 'CADENCE'}.pdf`}
        fileUrl={offerLetterUrl}
        mimeType="application/pdf"
        onSendOfferLetter={canManageOfferLetter ? handleSendOfferLetter : undefined}
        sendOfferLetterLoading={sendOfferLetterLoading}
        isOfferLetterSent={isOfferLetterSent}
      />
    </div>
  );
};

export default BuyerDashboardPage;
