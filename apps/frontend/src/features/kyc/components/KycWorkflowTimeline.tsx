import React from 'react';
import { KycApplicationStatus } from '../types/kyc';
import { CheckCircle2, Clock, FileEdit, AlertCircle, Send, ShieldCheck, UserCheck } from 'lucide-react';

interface KycWorkflowTimelineProps {
  status: KycApplicationStatus;
  submittedAt?: string;
  assignedTo?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export const KycWorkflowTimeline: React.FC<KycWorkflowTimelineProps> = ({
  status,
  submittedAt,
  assignedTo,
  verifiedAt,
  verifiedBy,
}) => {
  const steps = [
    {
      id: 'DRAFT',
      label: 'Draft Created',
      description: 'Initial information entered by buyer',
      icon: FileEdit,
      isCompleted: status !== 'DRAFT',
      isCurrent: status === 'DRAFT',
    },
    {
      id: 'SUBMITTED',
      label: 'Submitted',
      description: submittedAt ? `Submitted on ${new Date(submittedAt).toLocaleDateString()}` : 'Awaiting buyer submission',
      icon: Send,
      isCompleted: status !== 'DRAFT',
      isCurrent: status === 'SUBMITTED',
    },
    {
      id: 'ASSIGNED',
      label: 'Assigned',
      description: assignedTo ? `Reviewer: ${assignedTo}` : 'Assigned to compliance officer',
      icon: UserCheck,
      isCompleted: ['UNDER_REVIEW', 'EDIT_ENABLED', 'RESUBMITTED', 'APPROVED', 'REJECTED'].includes(status),
      isCurrent: false,
    },
    {
      id: 'UNDER_REVIEW',
      label: 'Under Review',
      description: 'Post-sales compliance audit in progress',
      icon: Clock,
      isCompleted: ['APPROVED'].includes(status),
      isCurrent: status === 'UNDER_REVIEW' || status === 'SUBMITTED',
    },
    ...(status === 'EDIT_ENABLED' || status === 'ACTION_REQUIRED' || status === 'RESUBMITTED'
      ? [
          {
            id: 'EDIT_REQUIRED',
            label: 'Action Required',
            description: status === 'RESUBMITTED' ? 'Changes resubmitted by buyer' : 'Edit access granted by compliance',
            icon: AlertCircle,
            isCompleted: status === 'RESUBMITTED',
            isCurrent: status === 'EDIT_ENABLED' || status === 'ACTION_REQUIRED',
          },
        ]
      : []),
    {
      id: 'APPROVED',
      label: 'Approved',
      description: verifiedAt
        ? `Approved on ${new Date(verifiedAt).toLocaleDateString()}${verifiedBy ? ` by ${verifiedBy}` : ''}`
        : 'Final verification & CRM approval',
      icon: ShieldCheck,
      isCompleted: status === 'APPROVED',
      isCurrent: status === 'APPROVED',
    },
  ];

  return (
    <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-500" /> Compliance Progress & Timeline
        </h4>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          Status: {status}
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="relative flex items-start gap-4">
              <div
                className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step.isCompleted
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950'
                    : step.isCurrent
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-950 animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}
              >
                {step.isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <div className="pl-2">
                <div
                  className={`text-xs font-bold ${
                    step.isCompleted || step.isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{step.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
