import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KycApplicationResponseDto, KycApplicationStatus } from '../types/kyc';
import { ShieldCheck, ArrowRight, Clock, AlertCircle, FileEdit } from 'lucide-react';

interface KycStatusCardProps {
  kycData?: KycApplicationResponseDto | null;
}

export const KycStatusCard: React.FC<KycStatusCardProps> = ({ kycData }) => {
  const navigate = useNavigate();

  const status: KycApplicationStatus = kycData?.status || 'DRAFT';

  const getCardConfig = (st: KycApplicationStatus) => {
    switch (st) {
      case 'APPROVED':
        return {
          title: 'KYC Verified & Approved',
          description: 'Your identity and property registration details have been verified.',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: ShieldCheck,
          btnText: 'View Approved KYC',
          btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        };
      case 'UNDER_REVIEW':
      case 'SUBMITTED':
        return {
          title: 'KYC Under Compliance Review',
          description: 'Our compliance team is auditing your submitted documents.',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
          btnText: 'View Submitted KYC',
          btnColor: 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700',
        };
      case 'EDIT_ENABLED':
      case 'ACTION_REQUIRED':
        return {
          title: 'Action Required: Edit Access Granted',
          description: kycData?.editReason || 'Please make the required corrections and resubmit.',
          badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: AlertCircle,
          btnText: 'Update & Resubmit KYC',
          btnColor: 'bg-orange-600 hover:bg-orange-700 text-white',
        };
      case 'RESUBMITTED':
        return {
          title: 'Resubmitted for Review',
          description: 'Your updated KYC details have been resubmitted to compliance.',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Clock,
          btnText: 'View Resubmission',
          btnColor: 'bg-purple-600 hover:bg-purple-700 text-white',
        };
      default:
        return {
          title: 'Complete Your KYC Verification',
          description: 'Fill details and upload mandatory documents to complete onboarding.',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: FileEdit,
          btnText: 'Continue KYC Form',
          btnColor: 'bg-brand-600 hover:bg-brand-700 text-white',
        };
    }
  };

  const config = getCardConfig(status);
  const Icon = config.icon;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{config.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{config.description}</p>
          </div>
        </div>

        <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${config.badgeColor} shadow-xs shrink-0 self-start sm:self-auto`}>
          ● {status}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="space-y-0.5">
          <div className="text-slate-400 font-semibold uppercase text-[10px]">Booking Ref</div>
          <div className="font-bold text-slate-900 dark:text-white">{kycData?.bookingId || 'BKG-2026-101'}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-slate-400 font-semibold uppercase text-[10px]">Submission Date</div>
          <div className="font-bold text-slate-900 dark:text-white">
            {kycData?.submittedAt ? new Date(kycData.submittedAt).toLocaleDateString() : 'Not Submitted'}
          </div>
        </div>
        <div className="space-y-0.5">
          <div className="text-slate-400 font-semibold uppercase text-[10px]">Assigned Reviewer</div>
          <div className="font-bold text-slate-900 dark:text-white">
            {kycData?.assignedTo || 'Compliance Desk'}
          </div>
        </div>
        <div className="space-y-0.5">
          <div className="text-slate-400 font-semibold uppercase text-[10px]">Last Updated</div>
          <div className="font-bold text-slate-900 dark:text-white">
            {kycData?.lastSavedAt ? new Date(kycData.lastSavedAt).toLocaleDateString() : 'Today'}
          </div>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={() => navigate(`/client/kyc?bookingId=${kycData?.bookingId || 'BKG-2026-101'}`)}
          className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md transition-all ${config.btnColor}`}
        >
          {config.btnText}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default KycStatusCard;
