import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit3,
  FileText,
  Download,
  Eye,
  MessageSquare,
  Search,
} from 'lucide-react';
import kycService from '../services/kyc.service';
import { KycApplicationResponseDto, KycApplicationStatus } from '../types/kyc';
import { KycWorkflowTimeline } from '../components/KycWorkflowTimeline';

type TabType = 'PENDING' | 'EDIT_REQUESTS' | 'APPROVED' | 'REJECTED';

export const AdminKycManagementPage: React.FC = () => {
  const [applications, setApplications] = useState<KycApplicationResponseDto[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<KycApplicationResponseDto | null>(null);

  // Modal Action States
  const [activeModal, setActiveModal] = useState<'REJECT' | 'GRANT_EDIT' | 'NOTE' | null>(null);
  const [inputReason, setInputReason] = useState<string>('');
  const [inputNote, setInputNote] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      // Demo dataset fetch & fallback
      const res = await kycService.getKycByBooking('BKG-2026-101').catch(() => null);
      if (res) {
        setApplications([res]);
      } else {
        setApplications([]);
      }
    } catch {
      // Handled gracefully
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleSelectApp = (app: KycApplicationResponseDto) => {
    setSelectedApp(app);
  };

  const handleGrantEditAccess = async () => {
    if (!selectedApp || !inputReason.trim()) return;
    setActionError(null);
    try {
      await kycService.grantEditAccess({
        kycApplicationId: selectedApp.kycApplicationId,
        reason: inputReason.trim(),
      });
      setActionSuccess('Edit access granted to buyer successfully. Status updated to EDIT_ENABLED.');
      setActiveModal(null);
      setInputReason('');
      fetchQueue();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to grant edit access.');
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setActionError(null);
    try {
      await apiApprove(selectedApp.kycApplicationId);
      setActionSuccess('KYC Application Approved successfully. Form is permanently locked.');
      setActiveModal(null);
      fetchQueue();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to approve application.');
    }
  };

  const apiApprove = async (appId: string) => {
    const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${baseUrl}/kyc/review/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ kycApplicationId: appId, approvalScope: 'FULL_APPLICATION' }),
    });
    if (!res.ok) throw new Error('Failed to approve KYC application');
  };

  const handleReject = async () => {
    if (!selectedApp || !inputReason.trim()) return;
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
          kycApplicationId: selectedApp.kycApplicationId,
          rejectionReasonCode: 'INCOMPLETE_OR_INCORRECT',
          rejectionComments: inputReason.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to reject KYC application');

      setActionSuccess('KYC Application rejected.');
      setActiveModal(null);
      setInputReason('');
      fetchQueue();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to reject application.');
    }
  };

  const handleAddNote = async () => {
    if (!selectedApp || !inputNote.trim()) return;
    setActionError(null);
    try {
      await kycService.addInternalNote({
        kycApplicationId: selectedApp.kycApplicationId,
        note: inputNote.trim(),
      });
      setActionSuccess('Private admin note saved.');
      setActiveModal(null);
      setInputNote('');
      fetchQueue();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to save note.');
    }
  };

  const filteredApplications = applications.filter((app) => {
    const status = app.status;
    const matchesTab =
      activeTab === 'PENDING'
        ? status === 'SUBMITTED' || status === 'RESUBMITTED' || status === 'UNDER_REVIEW' || !status
        : activeTab === 'EDIT_REQUESTS'
        ? status === 'EDIT_ENABLED' || status === 'ACTION_REQUIRED'
        : activeTab === 'APPROVED'
        ? status === 'APPROVED'
        : status === 'REJECTED';

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      app.bookingId.toLowerCase().includes(query) ||
      (app.primaryApplicant?.fullName && app.primaryApplicant.fullName.toLowerCase().includes(query));

    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status?: KycApplicationStatus) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold">Approved</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-full text-xs font-semibold">Rejected</span>;
      case 'EDIT_ENABLED':
      case 'ACTION_REQUIRED':
        return <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-xs font-semibold">Edit Requested</span>;
      case 'RESUBMITTED':
        return <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-full text-xs font-semibold">Resubmitted</span>;
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      default:
        return <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 rounded-full text-xs font-semibold">Pending Review</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> GoodEarth Admin Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            KYC Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review submitted buyer KYC applications, audit legal identity documents, manage edit requests, and issue formal approvals.
          </p>
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

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'PENDING'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setActiveTab('EDIT_REQUESTS')}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'EDIT_REQUESTS'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Edit Requests
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'APPROVED'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'REJECTED'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Rejected
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search buyer or booking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-4 px-6">Buyer Name</th>
                <th className="py-4 px-6">Booking Number</th>
                <th className="py-4 px-6">Project</th>
                <th className="py-4 px-6">Submission Date</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Priority</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No KYC applications found for this filter.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => {
                  const primaryName = app.primaryApplicant?.fullName || 'John Doe';
                  return (
                    <tr key={app.kycApplicationId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
                          {primaryName.charAt(0)}
                        </div>
                        {primaryName}
                      </td>
                      <td className="py-4 px-6 font-mono font-medium text-slate-700 dark:text-slate-300">{app.bookingId}</td>
                      <td className="py-4 px-6">GoodEarth Malhar</td>
                      <td className="py-4 px-6">{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Today'}</td>
                      <td className="py-4 px-6">{getStatusBadge(app.status)}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {app.priority || 'NORMAL'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleSelectApp(app)}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Review Detailed Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400">
                  <span>GoodEarth Admin Review Page</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  KYC Review - Booking #{selectedApp.bookingId}
                </h2>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Applicant Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl text-xs">
              <div>
                <div className="text-slate-400 font-medium">Primary Applicant</div>
                <div className="text-slate-900 dark:text-white font-bold text-sm mt-0.5">
                  {selectedApp.primaryApplicant?.fullName || 'John Doe'}
                </div>
                <div className="text-slate-500 mt-1">
                  Email: {selectedApp.primaryApplicant?.email || 'N/A'} | Phone: {selectedApp.primaryApplicant?.phone || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-slate-400 font-medium">Identity Documents</div>
                <div className="text-slate-900 dark:text-white font-mono mt-0.5">
                  PAN: {selectedApp.primaryApplicant?.panNumber || 'N/A'}
                </div>
                <div className="text-slate-900 dark:text-white font-mono mt-0.5">
                  Aadhaar: {selectedApp.primaryApplicant?.aadhaarNumber || 'N/A'}
                </div>
              </div>
            </div>

            {/* Workflow Timeline */}
            <KycWorkflowTimeline
              status={selectedApp.status}
              submittedAt={selectedApp.submittedAt}
              verifiedAt={selectedApp.verifiedAt}
              verifiedBy={selectedApp.verifiedBy}
            />

            {/* Document Slots & Preview */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" /> Uploaded Document Slots
              </h3>
              <div className="space-y-2">
                {selectedApp.documentSlots && selectedApp.documentSlots.length > 0 ? (
                  selectedApp.documentSlots.map((slot) => (
                    <div
                      key={slot.documentId}
                      className="p-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">{slot.documentType}</span>
                        <span className="ml-2 text-slate-400">({slot.applicantType})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={kycService.getFileUrl(slot.documentId)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" /> Download / Preview
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/30 text-slate-400 text-center text-xs rounded-xl">
                    Documents uploaded directly to Zoho WorkDrive.
                  </div>
                )}
              </div>
            </div>

            {/* Private Admin Notes */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-500" /> Private Admin Notes (Staff Only - Hidden from Buyer)
                </h3>
                <button
                  onClick={() => setActiveModal('NOTE')}
                  className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-200"
                >
                  + Add Admin Note
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {selectedApp.internalNotes || 'No private notes added yet.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleApprove}
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
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs hover:bg-slate-200"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

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
                value={inputReason}
                onChange={(e) => setInputReason(e.target.value)}
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
                disabled={!inputReason.trim()}
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
            <p className="text-xs text-slate-500">
              Dispatches rejection notice to buyer via email and portal notification.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rejection Reason (Mandatory) *
              </label>
              <textarea
                rows={3}
                value={inputReason}
                onChange={(e) => setInputReason(e.target.value)}
                placeholder="State the formal reason for rejection..."
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
                disabled={!inputReason.trim()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Note Modal */}
      {activeModal === 'NOTE' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-500" /> Add Private Admin Note
            </h3>
            <div>
              <textarea
                rows={3}
                value={inputNote}
                onChange={(e) => setInputNote(e.target.value)}
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
                disabled={!inputNote.trim()}
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

export default AdminKycManagementPage;
