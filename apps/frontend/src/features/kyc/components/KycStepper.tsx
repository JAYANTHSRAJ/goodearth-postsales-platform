import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface StepItem {
  id: string;
  label: string;
  path: string;
  description: string;
}

export const KYC_STEPS: StepItem[] = [
  { id: 'property', label: 'Property', path: '/client/kyc/property', description: 'Unit details & reference' },
  { id: 'applicants', label: 'Applicants', path: '/client/kyc/applicants', description: 'Primary & joint buyer info' },
  { id: 'documents', label: 'Documents', path: '/client/kyc/documents', description: 'Mandatory KYC uploads' },
  { id: 'review', label: 'Review', path: '/client/kyc/review', description: 'Verify & submit' },
];

interface KycStepperProps {
  currentStepId: string;
  completedStepIds?: string[];
  status?: string;
}

export const KycStepper: React.FC<KycStepperProps> = ({
  currentStepId,
  completedStepIds = [],
  status = 'DRAFT',
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentIndex = KYC_STEPS.findIndex((s) => s.id === currentStepId || location.pathname.endsWith(s.id));

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm mb-6">
      <nav aria-label="KYC Submission Steps">
        <ol className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
          {KYC_STEPS.map((step, index) => {
            const isCurrent = index === currentIndex;
            const isCompleted = index < currentIndex || completedStepIds.includes(step.id) || status === 'APPROVED' || status === 'SUBMITTED';
            const isLocked = !isCompleted && !isCurrent && status !== 'DRAFT' && status !== 'ACTION_REQUIRED';

            return (
              <React.Fragment key={step.id}>
                <li className="flex items-center gap-3.5 w-full md:w-auto">
                  <button
                    disabled={isLocked}
                    onClick={() => navigate(step.path)}
                    className={`flex items-center gap-3 group text-left transition-all ${
                      isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-90'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold text-sm transition-all duration-200 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                          : isCurrent
                          ? 'bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-900/30 shadow-md shadow-brand-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-bold tracking-tight ${
                          isCurrent
                            ? 'text-brand-600 dark:text-brand-400'
                            : isCompleted
                            ? 'text-slate-900 dark:text-slate-100'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                        {step.description}
                      </p>
                    </div>
                  </button>
                </li>

                {index < KYC_STEPS.length - 1 && (
                  <div
                    className={`hidden md:block h-0.5 flex-1 mx-4 transition-colors ${
                      index < currentIndex ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default KycStepper;
