import React from 'react';
import { Card } from '../../../../components/ui/Card';

interface Step2IdentityDetailsProps {
  form: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const Step2IdentityDetails: React.FC<Step2IdentityDetailsProps> = ({
  form,
  onChange,
  errors,
}) => {
  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 2: Government Identity Information"
        subtitle="Provide official identification references for legal title registration"
      >
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Aadhaar Number (12 Digits) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={12}
                value={form.aadhaarNo || ''}
                onChange={(e) => onChange('aadhaarNo', e.target.value.replace(/\D/g, ''))}
                placeholder="1234 5678 9012"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm font-mono tracking-widest outline-none transition-all ${
                  errors.aadhaarNo
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                }`}
              />
              {errors.aadhaarNo && (
                <p className="text-[11px] text-red-500 font-medium mt-1">{errors.aadhaarNo}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                PAN Number (10 Characters) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={10}
                value={form.panNo || ''}
                onChange={(e) => onChange('panNo', e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm font-mono uppercase tracking-widest outline-none transition-all ${
                  errors.panNo
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                }`}
              />
              {errors.panNo && (
                <p className="text-[11px] text-red-500 font-medium mt-1">{errors.panNo}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Passport / Voter ID Number (Optional)
              </label>
              <input
                type="text"
                value={form.passportNo || ''}
                onChange={(e) => onChange('passportNo', e.target.value.toUpperCase())}
                placeholder="Z1234567"
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
