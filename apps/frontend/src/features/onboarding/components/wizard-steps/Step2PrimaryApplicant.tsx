import React from 'react';
import { Card } from '../../../../components/ui/Card';

interface Step2PrimaryApplicantProps {
  form: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const Step2PrimaryApplicant: React.FC<Step2PrimaryApplicantProps> = ({
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
        title="Step 2: Primary Applicant Profile"
        subtitle="Personal background, occupation, relationship, and financial details"
      >
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Relationship Type <span className="text-red-500">*</span>
              </label>
              <select
                id="primaryApplicant.relationType"
                value={primary.relationType || 'S/o'}
                onChange={(e) => handlePrimaryChange('relationType', e.target.value)}
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              >
                <option value="S/o">Son of (S/o)</option>
                <option value="D/o">Daughter of (D/o)</option>
                <option value="W/o">Wife of (W/o)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Relative Title <span className="text-red-500">*</span>
              </label>
              <select
                id="primaryApplicant.relationSalutation"
                value={primary.relationSalutation || 'Mr.'}
                onChange={(e) => handlePrimaryChange('relationSalutation', e.target.value)}
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              >
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Dr.">Dr.</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Relative First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="primaryApplicant.relationFirstName"
                name="primaryApplicant.relationFirstName"
                type="text"
                value={primary.relationFirstName || ''}
                onChange={(e) => handlePrimaryChange('relationFirstName', e.target.value)}
                placeholder="Ramesh"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${
                  getError('primaryApplicant.relationFirstName')
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                }`}
              />
              {getError('primaryApplicant.relationFirstName') && (
                <span className="text-[11px] text-red-500 mt-1 block font-medium">{getError('primaryApplicant.relationFirstName')}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                id="primaryApplicant.dob"
                name="primaryApplicant.dob"
                type="date"
                value={primary.dob || ''}
                onChange={(e) => handlePrimaryChange('dob', e.target.value)}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${
                  getError('primaryApplicant.dob')
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                }`}
              />
              {getError('primaryApplicant.dob') && (
                <span className="text-[11px] text-red-500 mt-1 block font-medium">{getError('primaryApplicant.dob')}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Occupation <span className="text-red-500">*</span>
              </label>
              <select
                id="primaryApplicant.occupation"
                value={primary.occupation || 'Corporate Employee'}
                onChange={(e) => handlePrimaryChange('occupation', e.target.value)}
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              >
                <option value="Corporate Employee">Corporate Employee</option>
                <option value="Business Owner / Entrepreneur">Business Owner / Entrepreneur</option>
                <option value="Self-Employed Professional">Self-Employed Professional</option>
                <option value="Doctor / Medical Practitioner">Doctor / Medical Practitioner</option>
                <option value="Advocate / Legal Professional">Advocate / Legal Professional</option>
                <option value="Government / PSU Employee">Government / PSU Employee</option>
                <option value="Retired Professional">Retired Professional</option>
                <option value="Homemaker">Homemaker</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Industry Sector <span className="text-red-500">*</span>
              </label>
              <input
                id="primaryApplicant.industry"
                name="primaryApplicant.industry"
                type="text"
                value={primary.industry || ''}
                onChange={(e) => handlePrimaryChange('industry', e.target.value)}
                placeholder="Information Technology, Healthcare..."
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${
                  getError('primaryApplicant.industry')
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                }`}
              />
              {getError('primaryApplicant.industry') && (
                <span className="text-[11px] text-red-500 mt-1 block font-medium">{getError('primaryApplicant.industry')}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Annual Income Bracket <span className="text-red-500">*</span>
              </label>
              <select
                id="primaryApplicant.annualIncome"
                value={primary.annualIncome || 'INR 15L - 25L'}
                onChange={(e) => handlePrimaryChange('annualIncome', e.target.value)}
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              >
                <option value="Below INR 10 Lakhs">Below INR 10 Lakhs</option>
                <option value="INR 10L - 15L">INR 10L - 15L</option>
                <option value="INR 15L - 25L">INR 15L - 25L</option>
                <option value="INR 25L - 50L">INR 25L - 50L</option>
                <option value="INR 50L - 1 Crore">INR 50L - 1 Crore</option>
                <option value="Above INR 1 Crore">Above INR 1 Crore</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
