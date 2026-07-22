import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { clientService } from '../../../services/client.service';

export const AdminKycReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [reviewAction, setReviewAction] = useState<string | null>(null);
  const [comments, setComments] = useState('');

  // Fetch KYC details
  const { data: rawApp, refetch: refetchApp } = useQuery({
    queryKey: ['adminKycById', id],
    queryFn: () => (id ? clientService.getKycById(id) : null),
    enabled: !!id,
  });

  // Fetch Audit Logs
  const { data: rawAuditLogs } = useQuery({
    queryKey: ['adminAuditLogs', id],
    queryFn: () => (id ? clientService.getKycAuditLogs(id) : []),
    enabled: !!id,
  });

  // Fetch CRM Sync Logs
  const { data: rawCrmLogs, refetch: refetchCrmLogs } = useQuery({
    queryKey: ['adminCrmLogs', id],
    queryFn: () => (id ? clientService.getCrmSyncLogs(id) : []),
    enabled: !!id,
  });

  // Fetch WorkDrive Sync Logs
  const { data: rawWdLogs, refetch: refetchWdLogs } = useQuery({
    queryKey: ['adminWdLogs', id],
    queryFn: () => (id ? clientService.getWorkDriveSyncLogs(id) : []),
    enabled: !!id,
  });

  // Admin Review Mutation
  const reviewMutation = useMutation({
    mutationFn: (actionStr: string) => clientService.adminReviewKyc(id!, actionStr, comments),
    onSuccess: () => {
      setReviewAction(null);
      setComments('');
      refetchApp();
    },
  });

  // CRM Retry Mutation
  const retryCrmMutation = useMutation({
    mutationFn: (syncLogId: string) => clientService.retryCrmSync(syncLogId),
    onSuccess: () => refetchCrmLogs(),
  });

  // WorkDrive Retry Mutation
  const retryWorkDriveMutation = useMutation({
    mutationFn: (syncLogId: string) => clientService.retryWorkDriveSync(syncLogId),
    onSuccess: () => refetchWdLogs(),
  });

  const appData = (rawApp as any)?.data || rawApp || {};
  const form = appData.formData || {};
  const primary = form.primaryApplicant || {};
  const primaryAddress = primary.address || {};
  const coApp = form.coApplicant || {};
  const thirdApp = form.thirdApplicant || {};

  const auditLogs = (rawAuditLogs as any)?.data || rawAuditLogs || [];
  const crmLogs = (rawCrmLogs as any)?.data || rawCrmLogs || [];
  const wdLogs = (rawWdLogs as any)?.data || rawWdLogs || [];

  const latestCrmLog = crmLogs[0];
  const latestWdLog = wdLogs[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 text-left">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/admin/kyc')}
          className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReviewAction('MODIFICATION_REQUESTED')}
            className="px-4 py-2 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-500/20"
          >
            Request Modification
          </button>
          <button
            type="button"
            onClick={() => setReviewAction('REJECTED')}
            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-700 dark:text-red-300 font-bold text-xs hover:bg-red-500/20"
          >
            Reject Application
          </button>
          <button
            type="button"
            onClick={() => setReviewAction('APPROVED')}
            className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-md"
          >
            Approve & Verify KYC
          </button>
        </div>
      </div>

      {/* Property Unit Context Banner */}
      <div className="p-6 rounded-2xl bg-brand-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Property Unit Application</span>
          <h2 className="text-xl font-bold">{appData.unitName || 'Villa / Plot Unit'}</h2>
          <p className="text-xs text-brand-300">
            Applicant: {primary.salutation} {primary.firstName} {primary.lastName} ({primary.email})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 text-brand-200">
            KYC Status: {appData.status}
          </span>
        </div>
      </div>

      {/* Grid: Main Details (Left) + Sync & Audit (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Primary Applicant Details */}
          <Card title="Primary Applicant Information" subtitle="Personal background & contact coordinates">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-2">
              <div>
                <span className="block text-[10px] text-brand-400">Full Name</span>
                <span className="font-semibold text-brand-900 dark:text-white">
                  {primary.salutation} {primary.firstName} {primary.lastName}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-brand-400">Email</span>
                <span className="font-medium text-brand-800 dark:text-brand-200">{primary.email || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-brand-400">Phone</span>
                <span className="font-medium text-brand-800 dark:text-brand-200">+{primary.phoneCode} {primary.phoneNumber}</span>
              </div>
              <div>
                <span className="block text-[10px] text-brand-400">Relationship</span>
                <span className="font-medium text-brand-800 dark:text-brand-200">{primary.relationType} {primary.relationFirstName}</span>
              </div>
              <div>
                <span className="block text-[10px] text-brand-400">Date of Birth</span>
                <span className="font-medium text-brand-800 dark:text-brand-200">{primary.dob || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-brand-400">Occupation</span>
                <span className="font-medium text-brand-800 dark:text-brand-200">{primary.occupation || '—'}</span>
              </div>
            </div>
          </Card>

          {/* Identity & Statutory Numbers */}
          <Card title="Statutory Identity Numbers" subtitle="Official registration coordinates">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-2">
              <div>
                <span className="block text-[10px] font-sans text-brand-400">Aadhaar Number</span>
                <span className="font-bold text-brand-900 dark:text-white">{primary.aadhaarNo || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-sans text-brand-400">PAN Number</span>
                <span className="font-bold text-brand-900 dark:text-white">{primary.panNo || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-sans text-brand-400">Passport No</span>
                <span className="font-bold text-brand-900 dark:text-white">{primary.passportNo || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-sans text-brand-400">Voter ID</span>
                <span className="font-bold text-brand-900 dark:text-white">{primary.voterId || '—'}</span>
              </div>
            </div>
          </Card>

          {/* Permanent Address */}
          <Card title="Permanent Residence Address" subtitle="Official deed registration address">
            <p className="text-xs font-medium text-brand-900 dark:text-white pt-2">
              {primaryAddress.addressLine1 ? `${primaryAddress.addressLine1}, ${primaryAddress.city}, ${primaryAddress.state} - ${primaryAddress.postalCode}, ${primaryAddress.country}` : '—'}
            </p>
          </Card>

          {/* Co-Applicant (If present) */}
          {form.hasCoApplicant === 'Yes' && (
            <Card title="Co-Applicant Information" subtitle="Secondary joint property owner">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-2">
                <div>
                  <span className="block text-[10px] text-brand-400">Name</span>
                  <span className="font-semibold text-brand-900 dark:text-white">{coApp.salutation} {coApp.firstName} {coApp.lastName}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-brand-400">Email</span>
                  <span className="font-medium text-brand-800 dark:text-brand-200">{coApp.email || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-brand-400">PAN Number</span>
                  <span className="font-mono font-medium text-brand-800 dark:text-brand-200">{coApp.panNo || '—'}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Third Applicant (If present) */}
          {form.hasThirdApplicant === 'Yes' && (
            <Card title="Third Applicant Information" subtitle="Third joint property owner">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-2">
                <div>
                  <span className="block text-[10px] text-brand-400">Name</span>
                  <span className="font-semibold text-brand-900 dark:text-white">{thirdApp.salutation} {thirdApp.firstName} {thirdApp.lastName}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-brand-400">Email</span>
                  <span className="font-medium text-brand-800 dark:text-brand-200">{thirdApp.email || '—'}</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sync Status + Audit Timeline (Right Sidebar) */}
        <div className="space-y-6">
          {/* CRM Sync Status Card */}
          <Card title="Zoho CRM Deal Synchronization" subtitle="Downstream CRM sync log">
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-brand-700 dark:text-brand-300">Status:</span>
                <span className={`font-bold ${latestCrmLog?.syncStatus === 'SUCCESS' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {latestCrmLog?.syncStatus || 'PENDING'}
                </span>
              </div>
              {latestCrmLog?.lastErrorMessage && (
                <p className="text-[11px] text-red-500 bg-red-50 p-2 rounded-lg font-mono">
                  {latestCrmLog.lastErrorMessage}
                </p>
              )}
              {latestCrmLog && (
                <button
                  type="button"
                  onClick={() => retryCrmMutation.mutate(latestCrmLog.id)}
                  disabled={retryCrmMutation.isPending}
                  className="w-full py-2 rounded-xl bg-brand-900 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-brand-800"
                >
                  {retryCrmMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Manual CRM Retry
                </button>
              )}
            </div>
          </Card>

          {/* WorkDrive Sync Status Card */}
          <Card title="Zoho WorkDrive Synchronization" subtitle="Downstream WorkDrive folder sync">
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-brand-700 dark:text-brand-300">Status:</span>
                <span className={`font-bold ${latestWdLog?.syncStatus === 'SUCCESS' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {latestWdLog?.syncStatus || 'PENDING'}
                </span>
              </div>
              {latestWdLog?.lastErrorMessage && (
                <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg font-mono">
                  {latestWdLog.lastErrorMessage}
                </p>
              )}
              {latestWdLog && (
                <button
                  type="button"
                  onClick={() => retryWorkDriveMutation.mutate(latestWdLog.id)}
                  disabled={retryWorkDriveMutation.isPending}
                  className="w-full py-2 rounded-xl bg-brand-900 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-brand-800"
                >
                  {retryWorkDriveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Manual WorkDrive Retry
                </button>
              )}
            </div>
          </Card>

          {/* Audit Trail Timeline Stream */}
          <Card title="Audit Trail Stream" subtitle="Chronological modification log">
            <div className="space-y-3 pt-2 max-h-80 overflow-y-auto">
              {auditLogs.map((logItem: any) => (
                <div key={logItem.id} className="p-3 rounded-xl bg-brand-50/50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-850 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-brand-900 dark:text-white">
                    <span>{logItem.action}</span>
                    <span className="text-[10px] text-brand-400 font-normal">{new Date(logItem.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-brand-500">
                    User: {logItem.performedByUserEmail || 'System'} • Status: {logItem.previousStatus} $\rightarrow$ {logItem.newStatus}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Review Action Modal */}
      {reviewAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-900 rounded-2xl p-6 max-w-md w-full space-y-4 border border-brand-200 dark:border-brand-800 shadow-2xl">
            <h3 className="text-base font-bold text-brand-950 dark:text-white">
              Confirm Admin Action: {reviewAction}
            </h3>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300">
                Reviewer Comments / Modification Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="State the reason for approval, rejection, or required buyer corrections..."
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 p-3 text-xs outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-600 hover:bg-brand-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => reviewMutation.mutate(reviewAction)}
                disabled={reviewMutation.isPending}
                className="px-6 py-2 rounded-xl bg-brand-900 text-white font-bold text-xs hover:bg-brand-800"
              >
                {reviewMutation.isPending ? 'Executing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
