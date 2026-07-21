import React from 'react';
import { User, Users, FileText, CheckCircle2 } from 'lucide-react';

interface KycWizardHeaderProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export const KycWizardHeader: React.FC<KycWizardHeaderProps> = ({ currentStep, onStepClick }) => {
  const steps = [
    { id: 1, label: 'Personal Details', description: 'Primary Applicant', icon: User },
    { id: 2, label: 'Co-Applicants', description: 'Co-Buyers & Family', icon: Users },
    { id: 3, label: 'Document Vault', description: 'Identity & Address Proofs', icon: FileText },
    { id: 4, label: 'Review & Submit', description: 'Verification & Signature', icon: CheckCircle2 },
  ];

  return (
    <div className="w-full bg-white dark:bg-brand-900 border border-brand-200/80 dark:border-brand-850 rounded-2xl p-4 sm:p-6 shadow-sm mb-6">
      {/* Progress Bar Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-700 dark:text-brand-400">
            Step {currentStep} of 4
          </span>
          <h2 className="font-serif text-lg font-bold text-brand-900 dark:text-white">
            {steps[currentStep - 1]?.label}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-semibold text-brand-600 dark:text-brand-400">
            {Math.round((currentStep / 4) * 100)}% Completed
          </span>
        </div>
      </div>

      {/* Track bar */}
      <div className="h-1.5 w-full bg-brand-100 dark:bg-brand-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-brand-600 to-brand-800 transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>

      {/* Stepper Buttons Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick(step.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                isActive
                  ? 'border-brand-600 bg-brand-50/70 dark:border-brand-500 dark:bg-brand-900/40 shadow-sm ring-1 ring-brand-500/20'
                  : isCompleted
                  ? 'border-green-200/80 bg-green-50/30 dark:border-green-900/30 dark:bg-green-950/10 hover:border-green-300'
                  : 'border-brand-100 bg-brand-50/20 dark:border-brand-850 dark:bg-brand-950/20 opacity-70 hover:opacity-100'
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isActive
                    ? 'bg-brand-700 text-white shadow-sm'
                    : isCompleted
                    ? 'bg-green-600 text-white'
                    : 'bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-300'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <span className="block truncate text-xs font-bold text-brand-900 dark:text-white">
                  {step.label}
                </span>
                <span className="block truncate text-[10px] text-brand-500 dark:text-brand-400">
                  {step.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
