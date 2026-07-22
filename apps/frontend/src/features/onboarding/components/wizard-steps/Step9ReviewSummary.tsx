import React from 'react';
import { Edit2, User, Shield, MapPin, CreditCard, Building } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';

interface Step9ReviewSummaryProps {
  form: Record<string, any>;
  onJumpToStep: (step: number) => void;
}

export const Step9ReviewSummary: React.FC<Step9ReviewSummaryProps> = ({
  form,
  onJumpToStep,
}) => {
  const primary = form.primaryApplicant || {};
  const primaryAddress = primary.address || {};
  const coApp = form.coApplicant || {};

  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 9: Complete KYC Verification Review"
        subtitle="Review all entered parameters before submitting for official verification"
      >
        <div className="space-y-6 pt-2">
          {/* Section 1: Primary Applicant */}
          <div className="p-4 rounded-2xl bg-brand-50/40 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-850 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-white flex items-center gap-2">
                <User className="h-4 w-4 text-brand-600" /> Primary Applicant Details
              </h4>
              <button
                type="button"
                onClick={() => onJumpToStep(1)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="block text-[10px] text-brand-400">Full Name</span>
                <span className="font-semibold text-brand-900 dark:text-white">
                  {primary.salutation} {primary.firstName} {primary.lastName}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-brand-400">Contact Email</span>
                <span className="font-medium text-brand-800 dark:text-brand-200">{primary.email || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-brand-400">Phone Number</span>
                <span className="font-medium text-brand-800 dark:text-brand-200">+{primary.phoneCode} {primary.phoneNumber}</span>
              </div>
              <div>
                <span className="block text-[10px] text-brand-400">Date of Birth</span>
                <span className="font-medium text-brand-800 dark:text-brand-200">{primary.dob || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-brand-400">Occupation</span>
                <span className="font-medium text-brand-800 dark:text-brand-200">{primary.occupation || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Identity Information */}
          <div className="p-4 rounded-2xl bg-brand-50/40 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-850 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-brand-600" /> Identity Information
              </h4>
              <button
                type="button"
                onClick={() => onJumpToStep(4)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="block text-[10px] font-sans text-brand-400">Aadhaar Number</span>
                <span className="font-semibold text-brand-900 dark:text-white">
                  {primary.aadhaarNo ? `XXXX-XXXX-${primary.aadhaarNo.slice(-4)}` : '—'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-sans text-brand-400">PAN Number</span>
                <span className="font-semibold text-brand-900 dark:text-white">{primary.panNo || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Address */}
          <div className="p-4 rounded-2xl bg-brand-50/40 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-850 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-600" /> Permanent Address
              </h4>
              <button
                type="button"
                onClick={() => onJumpToStep(3)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
            </div>
            <p className="text-xs font-medium text-brand-800 dark:text-brand-200">
              {primaryAddress.addressLine1 ? `${primaryAddress.addressLine1}, ${primaryAddress.city}, ${primaryAddress.state} - ${primaryAddress.postalCode}, ${primaryAddress.country}` : '—'}
            </p>
          </div>

          {/* Section 4: Banking & Tax */}
          <div className="p-4 rounded-2xl bg-brand-50/40 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-850 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-brand-600" /> Banking & Tax Residency
              </h4>
              <button
                type="button"
                onClick={() => onJumpToStep(7)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="block text-[10px] text-brand-400">Bank Name</span>
                <span className="font-semibold text-brand-900 dark:text-white">{form.bankName || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-brand-400">Account Number</span>
                <span className="font-mono font-medium text-brand-800 dark:text-brand-200">{form.bankAccountNumber || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-brand-400">IFSC Code</span>
                <span className="font-mono font-medium text-brand-800 dark:text-brand-200">{form.bankIfsc || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 5: Co-Applicant Summary (if enabled) */}
          {form.hasCoApplicant === 'Yes' && (
            <div className="p-4 rounded-2xl bg-brand-50/40 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-850 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-white flex items-center gap-2">
                  <Building className="h-4 w-4 text-brand-600" /> Co-Applicant Details
                </h4>
                <button
                  type="button"
                  onClick={() => onJumpToStep(5)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] text-brand-400">Co-Applicant Name</span>
                  <span className="font-semibold text-brand-900 dark:text-white">{coApp.salutation} {coApp.firstName} {coApp.lastName}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-brand-400">Email</span>
                  <span className="font-medium text-brand-800 dark:text-brand-200">{coApp.email || '—'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
