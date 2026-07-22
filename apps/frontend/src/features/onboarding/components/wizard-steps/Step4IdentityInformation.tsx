import React from 'react';
import { Card } from '../../../../components/ui/Card';

interface Step4IdentityInformationProps {
  form: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const Step4IdentityInformation: React.FC<Step4IdentityInformationProps> = ({
  form,
  onChange,
  errors,
}) => {
  const primary = form.primaryApplicant || {};

  const handlePrimaryChange = (field: string, value: any) => {
    onChange('primaryApplicant', {
      ...primary,
      [field]: value,
    });
  };

  const getError = (key: string) => errors[key] || errors[key.split('.').pop() || ''];

  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 4: Statutory Identity Information"
        subtitle="Government identification numbers required for property title deed registration"
      >
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Aadhaar Number (12 Digits - India) <span className="text-red-500">*</span>
              </label>
              <input
                id="primaryApplicant.aadhaarNo"
                name="primaryApplicant.aadhaarNo"
                type="text"
                maxLength={12}
                value={primary.aadhaarNo || ''}
                onChange={(e) => handlePrimaryChange('aadhaarNo', e.target.value.replace(/\D/g, ''))}
                placeholder="123456789012"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm font-mono tracking-wider outline-none transition-all ${
                  getError('primaryApplicant.aadhaarNo')
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                }`}
              />
              <p className="text-[11px] text-brand-400 mt-1">Format: 12 numeric digits without spaces.</p>
              {getError('primaryApplicant.aadhaarNo') && (
                <span className="text-[11px] text-red-500 mt-1 block font-medium">{getError('primaryApplicant.aadhaarNo')}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                PAN Number (10 Characters - India) <span className="text-red-500">*</span>
              </label>
              <input
                id="primaryApplicant.panNo"
                name="primaryApplicant.panNo"
                type="text"
                maxLength={10}
                value={primary.panNo || ''}
                onChange={(e) => handlePrimaryChange('panNo', e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm font-mono uppercase tracking-wider outline-none transition-all ${
                  getError('primaryApplicant.panNo')
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                }`}
              />
              <p className="text-[11px] text-brand-400 mt-1">Format: 5 letters, 4 numbers, 1 letter.</p>
              {getError('primaryApplicant.panNo') && (
                <span className="text-[11px] text-red-500 mt-1 block font-medium">{getError('primaryApplicant.panNo')}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Passport Number (International / NRI)
              </label>
              <input
                type="text"
                maxLength={12}
                value={primary.passportNo || ''}
                onChange={(e) => handlePrimaryChange('passportNo', e.target.value.toUpperCase())}
                placeholder="Z1234567"
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm font-mono uppercase tracking-wider outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Voter ID / Driving License Number
              </label>
              <input
                type="text"
                maxLength={20}
                value={primary.voterId || ''}
                onChange={(e) => handlePrimaryChange('voterId', e.target.value.toUpperCase())}
                placeholder="XYZ1234567"
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm font-mono uppercase tracking-wider outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
