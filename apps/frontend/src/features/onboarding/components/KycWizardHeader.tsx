import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { StepStatus } from '../utils/kycValidation';

interface KycWizardHeaderProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  stepStatuses?: Record<number, StepStatus>;
}

const WIZARD_STEPS = [
  { id: 1, title: 'Application Details', short: 'App' },
  { id: 2, title: 'Primary Applicant', short: 'Primary' },
  { id: 3, title: 'Primary Address', short: 'Address' },
  { id: 4, title: 'Identity Info', short: 'Identity' },
  { id: 5, title: 'Co-Applicant', short: 'Co-App' },
  { id: 6, title: 'Third Applicant', short: '3rd-App' },
  { id: 7, title: 'Loan, Bank & Tax', short: 'Bank/Tax' },
  { id: 8, title: 'Document Vault', short: 'Vault' },
  { id: 9, title: 'Verification Review', short: 'Review' },
  { id: 10, title: 'Confirmation', short: 'Submit' },
];

export const KycWizardHeader: React.FC<KycWizardHeaderProps> = ({
  currentStep,
  onStepClick,
  stepStatuses = {},
}) => {
  const completedCount = Object.values(stepStatuses).filter((s) => s === 'Completed').length;
  const progressPercent = Math.round((completedCount / 8) * 100) || Math.round((currentStep / WIZARD_STEPS.length) * 100);

  return (
    <div className="space-y-4 text-left">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-850 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-brand-600 dark:text-brand-300">
              Native GoodEarth KYC Module
            </span>
            <h1 className="text-xl font-bold text-brand-950 dark:text-white">
              Step {currentStep} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep - 1]?.title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
              {progressPercent}% Completed
            </span>
            <div className="w-32 h-2.5 rounded-full bg-brand-100 dark:bg-brand-850 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Desktop Step Numbers & Badges */}
        <div className="hidden lg:flex items-center justify-between pt-2">
          {WIZARD_STEPS.map((step) => {
            const status = stepStatuses[step.id] || (step.id < currentStep ? 'Completed' : step.id === currentStep ? 'In Progress' : 'Not Started');
            const isCurrent = step.id === currentStep;

            let badgeStyles = 'bg-brand-100 dark:bg-brand-850 text-brand-500 dark:text-brand-400 group-hover:bg-brand-200';
            if (status === 'Completed') {
              badgeStyles = 'bg-emerald-500 text-white shadow-sm';
            } else if (status === 'Error') {
              badgeStyles = 'bg-red-500 text-white shadow-sm ring-2 ring-red-500/30';
            } else if (isCurrent) {
              badgeStyles = 'bg-brand-900 text-white dark:bg-brand-100 dark:text-brand-950 ring-4 ring-brand-500/20';
            }

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick && onStepClick(step.id)}
                className={`flex flex-col items-center gap-1.5 cursor-pointer group outline-none`}
              >
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${badgeStyles}`}
                >
                  {status === 'Completed' ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : status === 'Error' ? (
                    <AlertCircle className="h-3.5 w-3.5" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold tracking-tight ${
                    isCurrent
                      ? 'text-brand-900 dark:text-white font-bold'
                      : status === 'Completed'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : status === 'Error'
                      ? 'text-red-500 font-bold'
                      : 'text-brand-400 dark:text-brand-500'
                  }`}
                >
                  {step.short}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
