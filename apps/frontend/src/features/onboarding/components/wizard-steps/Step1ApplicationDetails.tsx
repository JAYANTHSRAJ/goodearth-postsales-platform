import React from 'react';
import { Card } from '../../../../components/ui/Card';

interface Step1ApplicationDetailsProps {
  form: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const Step1ApplicationDetails: React.FC<Step1ApplicationDetailsProps> = ({
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
        title="Step 1: Application & Contact Details"
        subtitle="Basic application metadata and primary contact coordinates"
      >
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Application Date <span className="text-red-500">*</span>
              </label>
              <input
                id="applicationDate"
                name="applicationDate"
                type="date"
                value={form.applicationDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => onChange('applicationDate', e.target.value)}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${
                  getError('applicationDate')
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                }`}
              />
              {getError('applicationDate') && (
                <span className="text-[11px] text-red-500 mt-1 block font-medium">{getError('applicationDate')}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Title / Salutation <span className="text-red-500">*</span>
              </label>
              <select
                id="primaryApplicant.salutation"
                value={primary.salutation || 'Mr.'}
                onChange={(e) => handlePrimaryChange('salutation', e.target.value)}
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              >
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
                <option value="Dr.">Dr.</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="primaryApplicant.firstName"
                name="primaryApplicant.firstName"
                type="text"
                value={primary.firstName || ''}
                onChange={(e) => handlePrimaryChange('firstName', e.target.value)}
                placeholder="Arjun"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${
                  getError('primaryApplicant.firstName')
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                }`}
              />
              {getError('primaryApplicant.firstName') && (
                <span className="text-[11px] text-red-500 mt-1 block font-medium">{getError('primaryApplicant.firstName')}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="primaryApplicant.lastName"
                name="primaryApplicant.lastName"
                type="text"
                value={primary.lastName || ''}
                onChange={(e) => handlePrimaryChange('lastName', e.target.value)}
                placeholder="Sharma"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${
                  getError('primaryApplicant.lastName')
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                }`}
              />
              {getError('primaryApplicant.lastName') && (
                <span className="text-[11px] text-red-500 mt-1 block font-medium">{getError('primaryApplicant.lastName')}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Applicant Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="primaryApplicant.email"
                name="primaryApplicant.email"
                type="email"
                value={primary.email || ''}
                onChange={(e) => handlePrimaryChange('email', e.target.value)}
                placeholder="arjun@example.com"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${
                  getError('primaryApplicant.email')
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                }`}
              />
              {getError('primaryApplicant.email') && (
                <span className="text-[11px] text-red-500 mt-1 block font-medium">{getError('primaryApplicant.email')}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={primary.phoneCode || '91'}
                  onChange={(e) => handlePrimaryChange('phoneCode', e.target.value)}
                  placeholder="91"
                  className="w-20 rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-3 py-2.5 text-sm text-center font-mono outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                />
                <input
                  id="primaryApplicant.phoneNumber"
                  name="primaryApplicant.phoneNumber"
                  type="tel"
                  value={primary.phoneNumber || ''}
                  onChange={(e) => handlePrimaryChange('phoneNumber', e.target.value)}
                  placeholder="9876543210"
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-mono outline-none transition-all ${
                    getError('primaryApplicant.phoneNumber')
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                  }`}
                />
              </div>
              {getError('primaryApplicant.phoneNumber') && (
                <span className="text-[11px] text-red-500 mt-1 block font-medium">{getError('primaryApplicant.phoneNumber')}</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
