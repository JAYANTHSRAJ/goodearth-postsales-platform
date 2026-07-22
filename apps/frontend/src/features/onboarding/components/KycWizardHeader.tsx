import React from 'react';
import {
  User,
  Shield,
  MapPin,
  Briefcase,
  Users,
  Building2,
  Receipt,
  UploadCloud,
  ClipboardCheck,
  Send,
  CheckCircle2,
} from 'lucide-react';

interface KycWizardHeaderProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export const stepsConfig = [
  { id: 1, label: 'Personal Details', description: 'Primary Info', icon: User },
  { id: 2, label: 'Identity Info', description: 'Govt IDs', icon: Shield },
  { id: 3, label: 'Address', description: 'Residence', icon: MapPin },
  { id: 4, label: 'Employment', description: 'Career & Income', icon: Briefcase },
  { id: 5, label: 'Nominee / Family', description: 'Co-Buyers', icon: Users },
  { id: 6, label: 'Bank Details', description: 'Account Ref', icon: Building2 },
  { id: 7, label: 'Tax Details', description: 'PAN & GST', icon: Receipt },
  { id: 8, label: 'Uploads', description: 'Document Vault', icon: UploadCloud },
  { id: 9, label: 'Review', description: 'Summary Verification', icon: ClipboardCheck },
  { id: 10, label: 'Submit', description: 'Sign & Finalize', icon: Send },
];

export const KycWizardHeader: React.FC<KycWizardHeaderProps> = ({ currentStep, onStepClick }) => {
  const currentConfig = stepsConfig[currentStep - 1] || stepsConfig[0];
  const progressPercent = Math.round((currentStep / stepsConfig.length) * 100);

  return (
    <div className="w-full bg-white dark:bg-brand-900 border border-brand-200/80 dark:border-brand-850 rounded-2xl p-4 sm:p-6 shadow-sm mb-6 text-left">
      {/* Progress Bar Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-700 dark:text-brand-400">
            Step {currentStep} of {stepsConfig.length}
          </span>
          <h2 className="font-serif text-lg md:text-xl font-bold text-brand-900 dark:text-white">
            {currentConfig.label}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-semibold text-brand-700 dark:text-brand-300">
            {progressPercent}% Completed
          </span>
        </div>
      </div>

      {/* Progress track bar */}
      <div className="h-2 w-full bg-brand-100 dark:bg-brand-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-brand-600 via-brand-700 to-emerald-600 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 10-Step Horizontal Scroll Bar for Desktop/Tablet */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {stepsConfig.map((step) => {
          const Icon = step.icon;
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick(step.id)}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-200 shrink-0 ${
                isActive
                  ? 'border-brand-700 bg-brand-50/80 dark:border-brand-500 dark:bg-brand-900/50 shadow-sm ring-2 ring-brand-500/20 font-semibold'
                  : isCompleted
                  ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20 hover:border-emerald-400'
                  : 'border-brand-100 bg-brand-50/20 dark:border-brand-850 dark:bg-brand-950/20 opacity-70 hover:opacity-100'
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isActive
                    ? 'bg-brand-700 text-white shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-300'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 pr-1">
                <span className="block truncate text-xs font-medium text-brand-900 dark:text-white">
                  {step.id}. {step.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
