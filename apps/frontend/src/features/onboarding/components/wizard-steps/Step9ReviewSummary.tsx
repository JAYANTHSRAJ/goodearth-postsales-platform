import React from 'react';
import { Edit2, User, Shield, MapPin } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';

interface Step9ReviewSummaryProps {
  form: Record<string, any>;
  onJumpToStep: (step: number) => void;
}

export const Step9ReviewSummary: React.FC<Step9ReviewSummaryProps> = ({
  form,
  onJumpToStep,
}) => {
  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 9: Complete KYC Verification Review"
        subtitle="Review all entered parameters before submitting for official verification"
      >
        <div className="space-y-6 pt-2">
          {/* Section 1: Personal */}
          <div className="p-4 rounded-2xl bg-brand-50/40 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-850 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-white flex items-center gap-2">
                <User className="h-4 w-4 text-brand-600" /> Personal Details
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
                <span className="font-semibold text-brand-900 dark:text-white">{form.salutation} {form.firstName} {form.lastName}</span>
              </div>
              <div>
                <span className="block text-[10px] text-brand-400">Date of Birth</span>
                <span className="font-medium text-brand-800 dark:text-brand-200">{form.dob || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-brand-400">Contact Email</span>
                <span className="font-medium text-brand-800 dark:text-brand-200">{form.email || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Identity */}
          <div className="p-4 rounded-2xl bg-brand-50/40 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-850 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-brand-600" /> Identity Information
              </h4>
              <button
                type="button"
                onClick={() => onJumpToStep(2)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="block text-[10px] font-sans text-brand-400">Aadhaar Number</span>
                <span className="font-semibold text-brand-900 dark:text-white">{form.aadhaarNo ? `XXXX-XXXX-${form.aadhaarNo.slice(-4)}` : '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-sans text-brand-400">PAN Number</span>
                <span className="font-semibold text-brand-900 dark:text-white">{form.panNo || '—'}</span>
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
              {form.addressLine1 ? `${form.addressLine1}, ${form.city}, ${form.state} - ${form.postalCode}, ${form.country}` : '—'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
