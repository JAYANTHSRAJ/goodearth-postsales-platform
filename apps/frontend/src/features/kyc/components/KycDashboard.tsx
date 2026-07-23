import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KycApplicationResponseDto, KycApplicationStatus } from '../types/kyc';

interface KycDashboardProps {
  kycData: KycApplicationResponseDto | null;
  loading?: boolean;
}

const getStatusBadge = (status?: KycApplicationStatus) => {
  switch (status) {
    case 'APPROVED':
      return { label: 'Approved & Verified', bg: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300' };
    case 'UNDER_REVIEW':
      return { label: 'Under Review', bg: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300' };
    case 'ACTION_REQUIRED':
      return { label: 'Action Required', bg: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300' };
    case 'SUBMITTED':
      return { label: 'Submitted', bg: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300' };
    case 'REJECTED':
      return { label: 'Rejected', bg: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300' };
    default:
      return { label: 'In Draft', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300' };
  }
};

export const KycDashboard: React.FC<KycDashboardProps> = ({ kycData, loading }) => {
  const navigate = useNavigate();
  const badge = getStatusBadge(kycData?.status);
  const percentage = kycData?.completionPercentage || 0;

  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-6 transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">KYC Verification Overview</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Booking ID: <span className="font-semibold text-slate-800 dark:text-slate-200">{kycData?.bookingId || 'N/A'}</span>
          </p>
        </div>

        <button
          onClick={() => navigate(kycData?.status === 'APPROVED' ? '/client/kyc/review' : '/client/kyc/property')}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.98] transition-all shadow-md shadow-brand-500/20"
        >
          {kycData?.status === 'APPROVED' ? 'View Approved Application' : 'Continue KYC Form'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completion Progress</span>
          <div className="mt-2 flex items-center gap-3">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-brand-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white shrink-0">{percentage}%</span>
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Saved</span>
          <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
            {kycData?.lastSavedAt ? new Date(kycData.lastSavedAt).toLocaleString() : 'Not saved yet'}
          </p>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Reviewer</span>
          <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
            {kycData?.verifiedBy || 'Unassigned (Automated Queue)'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default KycDashboard;
