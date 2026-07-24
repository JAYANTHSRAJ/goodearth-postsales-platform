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
  Activity,
  CheckCircle2,
  Download,
  Edit3,
  XCircle,
  Phone,
  Mail,
  Building,
  Home,
} from 'lucide-react';
import kycService from '../../kyc/services/kyc.service';
import { KycApplicationResponseDto } from '../../kyc/types/kyc';
import { KycWorkflowTimeline } from '../../kyc/components/KycWorkflowTimeline';

type DashboardTab =
  | 'overview'
  | 'kyc'
  | 'construction'
  | 'documents'
  | 'payments'
  | 'design'
  | 'support'
  | 'timeline'
  | 'activity';

export const BuyerDashboardPage: React.FC = () => {
  const { id, bookingId: routeBookingId } = useParams<{ id?: string; bookingId?: string }>();
  const navigate = useNavigate();

  const bookingId = routeBookingId || id || 'BKG-2026-101';
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // KYC Backend Data
  const [kycData, setKycData] = useState<KycApplicationResponseDto | null>(null);

  // Modal states for KYC Admin Actions
  const [activeModal, setActiveModal] = useState<'GRANT_EDIT' | 'REJECT' | 'NOTE' | null>(null);
  const [modalReason, setModalReason] = useState<string>('');
  const [modalNote, setModalNote] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Admin Logs State
  const [adminLogs, setAdminLogs] = useState<
    Array<{ id: string; action: string; actor: string; timestamp: string; type: 'ADMIN' | 'BUYER' | 'SYSTEM' }>
  >([
    { id: '1', action: 'Buyer Account Initialized from Zoho CRM Sync', actor: 'SYSTEM', timestamp: '2026-07-20 10:15 AM', type: 'SYSTEM' },
    { id: '2', action: 'Initial KYC Draft Autosaved by Buyer', actor: 'BUYER (John Doe)', timestamp: '2026-07-21 02:30 PM', type: 'BUYER' },
    { id: '3', action: 'KYC Application Submitted for Review', actor: 'BUYER (John Doe)', timestamp: '2026-07-22 11:00 AM', type: 'BUYER' },
    { id: '4', action: 'KYC Document Verification Started by Admin', actor: 'ADMIN (GoodEarth Admin)', timestamp: '2026-07-23 09:45 AM', type: 'ADMIN' },
  ]);

  const fetchKycData = async () => {
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
      setAdminLogs((prev) => [
        {
          id: Date.now().toString(),
          action: `Granted Edit Access to Buyer. Reason: "${modalReason.trim()}"`,
          actor: 'ADMIN (GoodEarth Admin)',
          timestamp: new Date().toLocaleString(),
          type: 'ADMIN',
        },
        ...prev,
      ]);
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
      setAdminLogs((prev) => [
        {
          id: Date.now().toString(),
          action: 'KYC Application Formally Approved & Verified',
          actor: 'ADMIN (GoodEarth Admin)',
          timestamp: new Date().toLocaleString(),
          type: 'ADMIN',
        },
        ...prev,
      ]);
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
      setAdminLogs((prev) => [
        {
          id: Date.now().toString(),
          action: `KYC Application Rejected. Reason: "${modalReason.trim()}"`,
          actor: 'ADMIN (GoodEarth Admin)',
          timestamp: new Date().toLocaleString(),
          type: 'ADMIN',
        },
        ...prev,
      ]);
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

  // Buyer Header Info
  const primaryName = kycData?.primaryApplicant?.fullName || 'John Doe';
  const buyerEmail = kycData?.primaryApplicant?.email || 'john.doe@example.com';
  const buyerPhone = kycData?.primaryApplicant?.phone || '+91 98450 12345';
  const projectName = 'GoodEarth Malhar';
  const unitName = 'Villa 14';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/buyers')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Buyers List
      </button>

      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white font-serif font-bold text-2xl flex items-center justify-center shadow-md">
            {primaryName.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{primaryName}</h1>
              <span className="px-3 py-1 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 rounded-full text-xs font-bold font-mono">
                #{bookingId}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-brand-500" /> {buyerEmail}</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-brand-500" /> {buyerPhone}</span>
              <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-brand-500" /> {projectName}</span>
              <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5 text-brand-500" /> {unitName}</span>
            </div>
          </div>
        </div>

        {/* Header Quick Status Badges */}
        <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800 w-full md:w-auto">
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">KYC Status</div>
            <div className="font-bold text-slate-900 dark:text-white mt-0.5">{kycData?.status || 'SUBMITTED'}</div>
          </div>
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Construction</div>
            <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Structure Completed</div>
          </div>
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Finance</div>
            <div className="font-bold text-brand-600 dark:text-brand-400 mt-0.5">₹ 1.25 Cr Paid</div>
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

      {/* Tabs Navigation */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-4 h-4" /> Overview
        </button>
        <button
          onClick={() => setActiveTab('kyc')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'kyc'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> KYC
        </button>
        <button
          onClick={() => setActiveTab('construction')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'construction'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Hammer className="w-4 h-4" /> Construction
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" /> Documents
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Payments
        </button>
        <button
          onClick={() => setActiveTab('design')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'design'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Design Studio
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'support'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Support
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'timeline'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" /> Timeline
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'activity'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" /> Activity
        </button>
      </div>

      {/* TAB CONTENTS */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Buyer Info */}
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
                <span className="text-slate-400">Co-Applicant:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{kycData?.jointApplicants?.[0]?.fullName || 'Jane Doe'}</span>
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

          {/* Card 2: Booking Details */}
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
                <span className="text-slate-400">Project Name:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{projectName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-400">Unit / Property:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{unitName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Home Loan:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{kycData?.consideringHomeLoan || 'Yes (HDFC Bank)'}</span>
              </div>
            </div>
          </div>

          {/* Card 3: KYC Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" /> KYC Status Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-400">Verification Status:</span>
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-bold">
                  {kycData?.status || 'SUBMITTED'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-400">Completion:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Verified</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">WorkDrive Sync:</span>
                <span className="font-semibold text-slate-900 dark:text-white">Active</span>
              </div>
            </div>
          </div>

          {/* Card 4: Construction Progress */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Hammer className="w-4 h-4 text-brand-600" /> Construction Progress
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-400">Current Stage:</span>
                <span className="font-bold text-slate-900 dark:text-white">Structure Construction</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-400">Progress Percentage:</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">65% Complete</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-brand-600 h-full w-[65%]" />
              </div>
            </div>
          </div>

          {/* Card 5: Payment Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" /> Payment Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-400">Total Value:</span>
                <span className="font-bold text-slate-900 dark:text-white">₹ 1,85,00,000</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">₹ 1,25,00,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pending Balance:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">₹ 60,00,000</span>
              </div>
            </div>
          </div>

          {/* Card 6: Support Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-600" /> Support Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-400">Open Tickets:</span>
                <span className="font-bold text-slate-900 dark:text-white">1 Ticket</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-slate-400">Subject:</span>
                <span className="font-semibold text-slate-900 dark:text-white">Electrical Socket Customization</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold text-[10px]">In Progress</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KYC */}
      {activeTab === 'kyc' && (
        <div className="space-y-6">
          {/* Admin KYC Action Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Admin KYC Control Desk
              </h3>
              <p className="text-xs text-slate-500">
                Review submitted applicant details, audit identity documents, and manage approval state. Admin cannot edit buyer data directly.
              </p>
            </div>
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
          </div>

          {/* Workflow Timeline */}
          <KycWorkflowTimeline
            status={kycData?.status || 'SUBMITTED'}
            submittedAt={kycData?.submittedAt}
            verifiedAt={kycData?.verifiedAt}
            verifiedBy={kycData?.verifiedBy}
          />

          {/* KYC Details Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Submitted KYC Particulars (Read-Only)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-brand-600">
                  Primary Applicant
                </div>
                <div className="space-y-1 text-slate-700 dark:text-slate-300">
                  <div><span className="text-slate-400">Full Name:</span> {kycData?.primaryApplicant?.fullName || primaryName}</div>
                  <div><span className="text-slate-400">PAN Number:</span> <span className="font-mono font-bold">{kycData?.primaryApplicant?.panNumber || 'ABCDE1234F'}</span></div>
                  <div><span className="text-slate-400">Aadhaar Number:</span> <span className="font-mono font-bold">{kycData?.primaryApplicant?.aadhaarNumber || '1234-5678-9012'}</span></div>
                  <div><span className="text-slate-400">Email:</span> {kycData?.primaryApplicant?.email || buyerEmail}</div>
                  <div><span className="text-slate-400">Phone:</span> {kycData?.primaryApplicant?.phone || buyerPhone}</div>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-brand-600">
                  Co-Applicant
                </div>
                <div className="space-y-1 text-slate-700 dark:text-slate-300">
                  <div><span className="text-slate-400">Full Name:</span> {kycData?.jointApplicants?.[0]?.fullName || 'Jane Doe'}</div>
                  <div><span className="text-slate-400">PAN Number:</span> <span className="font-mono font-bold">{kycData?.jointApplicants?.[0]?.panNumber || 'FGHIJ5678K'}</span></div>
                  <div><span className="text-slate-400">Aadhaar Number:</span> <span className="font-mono font-bold">{kycData?.jointApplicants?.[0]?.aadhaarNumber || '9876-5432-1098'}</span></div>
                  <div><span className="text-slate-400">Relation:</span> Spouse</div>
                </div>
              </div>
            </div>

            {/* Private Admin Notes */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-500" /> Private Admin Notes (Staff Only - Hidden from Buyer)
                </h4>
                <button
                  onClick={() => setActiveModal('NOTE')}
                  className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-200"
                >
                  + Add Admin Note
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {kycData?.internalNotes || 'No internal notes added yet.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONSTRUCTION */}
      {activeTab === 'construction' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Hammer className="w-5 h-5 text-brand-600" /> Construction Stage Updates - Villa 14
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Overall Progress: 65%</span>
              <span className="text-brand-600">Current Stage: Structure & Roofing</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div className="bg-brand-600 h-full w-[65%]" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-4">
            <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl font-semibold">
              ✓ Foundation Completed
            </div>
            <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl font-semibold">
              ✓ Brickwork & Slab Casted
            </div>
            <div className="p-4 bg-brand-50 text-brand-800 border border-brand-200 rounded-2xl font-semibold">
              ⚡ Electrical Conduit in Progress
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" /> Buyer Documents Repository
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {['PAN_CARD_PRIMARY.pdf', 'AADHAAR_PRIMARY.pdf', 'BUYER_AGREEMENT_SIGNED.pdf', 'PAYMENT_RECEIPT_01.pdf'].map((docName, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-brand-500" />
                  <span className="font-semibold text-slate-900 dark:text-white">{docName}</span>
                </div>
                <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-semibold flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-600" /> Payment Schedule & Receipts
          </h3>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Milestone</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-3 px-4 font-semibold">Booking Advance</td>
                <td className="py-3 px-4">15 Jun 2026</td>
                <td className="py-3 px-4">₹ 25,00,000</td>
                <td className="py-3 px-4"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold">Paid</span></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Agreement Execution</td>
                <td className="py-3 px-4">10 Jul 2026</td>
                <td className="py-3 px-4">₹ 1,00,00,000</td>
                <td className="py-3 px-4"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold">Paid</span></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Structure Completion</td>
                <td className="py-3 px-4">15 Aug 2026</td>
                <td className="py-3 px-4">₹ 60,00,000</td>
                <td className="py-3 px-4"><span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold">Pending</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: DESIGN STUDIO */}
      {activeTab === 'design' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" /> Design Studio Customizations
          </h3>
          <p className="text-xs text-slate-500">
            Buyer requested electrical plan modification for master bedroom layout. Status: Approved by Lead Architect.
          </p>
        </div>
      )}

      {/* TAB 7: SUPPORT */}
      {activeTab === 'support' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-600" /> Buyer Support Tickets
          </h3>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs space-y-2">
            <div className="flex justify-between font-bold">
              <span>Ticket #TKT-884: Electrical Socket Customization</span>
              <span className="text-amber-600">Open</span>
            </div>
            <p className="text-slate-500">Buyer requested extra 16A socket installation in utility area.</p>
          </div>
        </div>
      )}

      {/* TAB 8: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-600" /> Buyer Journey Timeline
          </h3>
          <KycWorkflowTimeline
            status={kycData?.status || 'SUBMITTED'}
            submittedAt={kycData?.submittedAt}
            verifiedAt={kycData?.verifiedAt}
            verifiedBy={kycData?.verifiedBy}
          />
        </div>
      )}

      {/* TAB 9: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-600" /> System & Audit Log Activity
          </h3>
          <div className="space-y-3">
            {adminLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                  <div className="text-[11px] text-slate-400 mt-0.5">By: {log.actor}</div>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">{log.timestamp}</span>
              </div>
            ))}
          </div>
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

      {/* Reject Modal */}
      {activeModal === 'REJECT' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5" /> Reject KYC Application
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rejection Reason (Mandatory) *
              </label>
              <textarea
                rows={3}
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="State the reason for rejection..."
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
              <MessageSquare className="w-5 h-5 text-brand-500" /> Add Private Admin Note
            </h3>
            <div>
              <textarea
                rows={3}
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="Write staff-only note..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500"
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
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboardPage;
