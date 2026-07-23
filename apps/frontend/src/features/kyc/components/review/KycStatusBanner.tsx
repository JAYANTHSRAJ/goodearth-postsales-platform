import React from 'react';
import { KycApplicationStatus } from '../../types/kyc';

interface KycStatusBannerProps {
  status?: KycApplicationStatus;
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export const KycStatusBanner: React.FC<KycStatusBannerProps> = ({
  status,
  submittedAt,
  verifiedAt,
  verifiedBy,
}) => {
  if (!status || status === 'DRAFT') return null;

  switch (status) {
    case 'APPROVED':
      return (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-lg">
            ✓
          </div>
          <div>
            <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">KYC Verified & Approved</h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
              Your KYC application was successfully verified by {verifiedBy || 'CRM Executive'} on{' '}
              {verifiedAt ? new Date(verifiedAt).toLocaleDateString() : 'N/A'}. Your booking allocation is fully confirmed.
            </p>
          </div>
        </div>
      );

    case 'SUBMITTED':
      return (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
            ℹ
          </div>
          <div>
            <h4 className="text-base font-bold text-blue-900 dark:text-blue-200">Application Submitted</h4>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
              Submitted on {submittedAt ? new Date(submittedAt).toLocaleString() : 'N/A'}. Your application is queued for verification by our post-sales team.
            </p>
          </div>
        </div>
      );

    case 'UNDER_REVIEW':
      return (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-lg">
            ⏳
          </div>
          <div>
            <h4 className="text-base font-bold text-amber-900 dark:text-amber-200">Verification Under Review</h4>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Assigned to executive {verifiedBy || 'CRM Team'}. Verification is currently in progress.
            </p>
          </div>
        </div>
      );

    case 'ACTION_REQUIRED':
      return (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-bold text-lg">
            !
          </div>
          <div>
            <h4 className="text-base font-bold text-rose-900 dark:text-rose-200">Action Required — Corrections Requested</h4>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
              Our review executive requested corrections on one or more submitted documents. Please check the rejected document slots and re-upload.
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default KycStatusBanner;
