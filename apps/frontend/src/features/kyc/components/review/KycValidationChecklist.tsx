import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KycApplicationResponseDto, KycValidationSummaryResponseDto } from '../../types/kyc';

interface KycValidationChecklistProps {
  kycData: KycApplicationResponseDto | null;
  validationSummary: KycValidationSummaryResponseDto | null;
  bookingId: string;
}

export const KycValidationChecklist: React.FC<KycValidationChecklistProps> = ({
  kycData,
  validationSummary,
  bookingId,
}) => {
  const navigate = useNavigate();

  const overallValid = validationSummary?.overallValid ?? false;
  const primaryComplete = validationSummary?.primaryApplicantComplete ?? false;
  const coComplete = validationSummary?.coApplicantComplete ?? true;
  const thirdComplete = validationSummary?.thirdApplicantComplete ?? true;
  const docsComplete = validationSummary?.documentsComplete ?? false;
  const missingItems = validationSummary?.missingItems || [];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Submission Readiness & Validation Summary</h3>
          <p className="text-xs text-slate-500 mt-0.5">Automated validation of all active applicants and mandatory uploads</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            overallValid
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
          }`}
        >
          {overallValid ? 'All Requirements Verified' : 'Action Required'}
        </span>
      </div>

      {/* Section Readiness Checklist */}
      <ul className="space-y-3 text-sm">
        {/* Primary Applicant */}
        <li
          onClick={() => !primaryComplete && navigate(`/client/kyc/applicants?bookingId=${bookingId}`)}
          className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${
            primaryComplete ? 'bg-slate-50 dark:bg-slate-800/40' : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${primaryComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              {primaryComplete ? '✓' : '!'}
            </span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Primary Applicant Information & Address</p>
              {!primaryComplete && <p className="text-xs text-amber-700">Missing required PII or address fields</p>}
            </div>
          </div>
          <span className={`text-xs font-semibold ${primaryComplete ? 'text-emerald-600' : 'text-amber-700 underline'}`}>
            {primaryComplete ? 'Completed' : 'Fix Missing Info →'}
          </span>
        </li>

        {/* Co-Applicant */}
        {kycData?.hasCoApplicant === 'Yes' && (
          <li
            onClick={() => !coComplete && navigate(`/client/kyc/applicants?bookingId=${bookingId}`)}
            className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${
              coComplete ? 'bg-slate-50 dark:bg-slate-800/40' : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${coComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {coComplete ? '✓' : '!'}
              </span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Co-Applicant Information & Address</p>
                {!coComplete && <p className="text-xs text-amber-700">Missing required co-applicant details</p>}
              </div>
            </div>
            <span className={`text-xs font-semibold ${coComplete ? 'text-emerald-600' : 'text-amber-700 underline'}`}>
              {coComplete ? 'Completed' : 'Fix Missing Info →'}
            </span>
          </li>
        )}

        {/* Third Applicant */}
        {kycData?.hasCoApplicant === 'Yes' && kycData?.hasThirdApplicant === 'Yes' && (
          <li
            onClick={() => !thirdComplete && navigate(`/client/kyc/applicants?bookingId=${bookingId}`)}
            className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${
              thirdComplete ? 'bg-slate-50 dark:bg-slate-800/40' : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${thirdComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {thirdComplete ? '✓' : '!'}
              </span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Third Applicant Information & Address</p>
                {!thirdComplete && <p className="text-xs text-amber-700">Missing required third applicant details</p>}
              </div>
            </div>
            <span className={`text-xs font-semibold ${thirdComplete ? 'text-emerald-600' : 'text-amber-700 underline'}`}>
              {thirdComplete ? 'Completed' : 'Fix Missing Info →'}
            </span>
          </li>
        )}

        {/* Mandatory Documents */}
        <li
          onClick={() => !docsComplete && navigate(`/client/kyc/documents?bookingId=${bookingId}`)}
          className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${
            docsComplete ? 'bg-slate-50 dark:bg-slate-800/40' : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${docsComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              {docsComplete ? '✓' : '!'}
            </span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Mandatory KYC Document Uploads</p>
              {!docsComplete && <p className="text-xs text-amber-700">One or more mandatory document slots pending upload</p>}
            </div>
          </div>
          <span className={`text-xs font-semibold ${docsComplete ? 'text-emerald-600' : 'text-amber-700 underline'}`}>
            {docsComplete ? 'All Uploaded' : 'Upload Documents →'}
          </span>
        </li>
      </ul>

      {/* Detailed Missing Items List with Navigation Links */}
      {missingItems.length > 0 && (
        <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
            Detailed Missing Requirements ({missingItems.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {missingItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (item.section === 'DOCUMENTS') {
                    navigate(`/client/kyc/documents?bookingId=${bookingId}`);
                  } else {
                    navigate(`/client/kyc/applicants?bookingId=${bookingId}`);
                  }
                }}
                className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs cursor-pointer hover:border-amber-400"
              >
                <span className="text-slate-800 dark:text-slate-200 font-medium">{item.requirement}</span>
                <span className="text-brand-600 font-semibold underline shrink-0 ml-2">Jump to Section →</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KycValidationChecklist;
