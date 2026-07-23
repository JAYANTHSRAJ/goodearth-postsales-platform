import React from 'react';
import { KycApplicationResponseDto } from '../../types/kyc';

interface KycValidationChecklistProps {
  kycData: KycApplicationResponseDto | null;
}

export const KycValidationChecklist: React.FC<KycValidationChecklistProps> = ({ kycData }) => {
  const hasPrimaryApplicant = !!kycData?.primaryApplicant?.fullName && !!kycData?.primaryApplicant?.panNumber;
  const documentSlots = kycData?.documentSlots || [];
  const requiredSlots = documentSlots.filter((s) => s.isRequired);
  const uploadedRequiredSlots = requiredSlots.filter((s) => !!s.currentVersion);
  const missingSlots = requiredSlots.filter((s) => !s.currentVersion);
  const rejectedSlots = documentSlots.filter((s) => s.currentVersion?.status === 'REJECTED');

  const isFormComplete = hasPrimaryApplicant && missingSlots.length === 0 && rejectedSlots.length === 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Submission Readiness Checklist</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            isFormComplete
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
          }`}
        >
          {isFormComplete ? 'Ready for Submission' : 'Incomplete Requirements'}
        </span>
      </div>

      <ul className="space-y-3 text-sm">
        {/* Step 1: Property Details */}
        <li className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">✓</span>
            <span className="font-semibold text-slate-900 dark:text-white">Allocated Unit & Booking Reference</span>
          </div>
          <span className="text-xs font-semibold text-emerald-600">Verified</span>
        </li>

        {/* Step 2: Primary Applicant */}
        <li className={`flex items-center justify-between p-3 rounded-xl ${hasPrimaryApplicant ? 'bg-slate-50 dark:bg-slate-800/40' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
          <div className="flex items-center gap-3">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${hasPrimaryApplicant ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              {hasPrimaryApplicant ? '✓' : '!'}
            </span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Primary Applicant Profile & PII</p>
              {!hasPrimaryApplicant && <p className="text-xs text-amber-600">Primary applicant details incomplete</p>}
            </div>
          </div>
          <span className={`text-xs font-semibold ${hasPrimaryApplicant ? 'text-emerald-600' : 'text-amber-600'}`}>
            {hasPrimaryApplicant ? 'Completed' : 'Missing Info'}
          </span>
        </li>

        {/* Step 3: Mandatory Document Uploads */}
        <li className={`flex items-center justify-between p-3 rounded-xl ${missingSlots.length === 0 ? 'bg-slate-50 dark:bg-slate-800/40' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
          <div className="flex items-center gap-3">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${missingSlots.length === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              {missingSlots.length === 0 ? '✓' : '!'}
            </span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Mandatory KYC Document Uploads</p>
              <p className="text-xs text-slate-500">
                {uploadedRequiredSlots.length} of {requiredSlots.length} required slots uploaded
              </p>
            </div>
          </div>
          <span className={`text-xs font-semibold ${missingSlots.length === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {missingSlots.length === 0 ? 'All Uploaded' : `${missingSlots.length} Pending`}
          </span>
        </li>

        {/* Rejected Documents Warning */}
        {rejectedSlots.length > 0 && (
          <li className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-xs font-bold">✕</span>
              <div>
                <p className="font-semibold text-rose-900 dark:text-rose-200">Rejected Documents Pending Correction</p>
                <p className="text-xs text-rose-600">{rejectedSlots.length} document(s) require re-upload before resubmitting</p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-600">Action Required</span>
          </li>
        )}
      </ul>
    </div>
  );
};

export default KycValidationChecklist;
