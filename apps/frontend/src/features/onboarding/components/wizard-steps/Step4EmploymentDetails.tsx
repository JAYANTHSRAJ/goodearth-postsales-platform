import React from 'react';
import { Card } from '../../../../components/ui/Card';

interface Step4EmploymentDetailsProps {
  form: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const Step4EmploymentDetails: React.FC<Step4EmploymentDetailsProps> = ({
  form,
  onChange,
}) => {
  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 4: Professional & Financial Profile"
        subtitle="Occupation and industry details for banking and statutory compliance"
      >
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Primary Occupation <span className="text-red-500">*</span>
              </label>
              <select
                value={form.occupation || 'Corporate Employee'}
                onChange={(e) => onChange('occupation', e.target.value)}
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              >
                <option>Corporate Employee</option>
                <option>Business Owner / Entrepreneur</option>
                <option>Self-Employed Professional</option>
                <option>Doctor / Medical Practitioner</option>
                <option>Advocate / Legal Professional</option>
                <option>Government / PSU Employee</option>
                <option>Retired Professional</option>
                <option>Homemaker</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Industry Sector
              </label>
              <input
                type="text"
                value={form.industry || ''}
                onChange={(e) => onChange('industry', e.target.value)}
                placeholder="Information Technology, Healthcare, Finance..."
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Company / Organization Name
              </label>
              <input
                type="text"
                value={form.company || ''}
                onChange={(e) => onChange('company', e.target.value)}
                placeholder="GoodEarth Tech Solutions Pvt Ltd"
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Annual Income Bracket
              </label>
              <select
                value={form.annualIncome || 'INR 15L - 25L'}
                onChange={(e) => onChange('annualIncome', e.target.value)}
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              >
                <option>Below INR 10 Lakhs</option>
                <option>INR 10L - 15L</option>
                <option>INR 15L - 25L</option>
                <option>INR 25L - 50L</option>
                <option>INR 50L - 1 Crore</option>
                <option>Above INR 1 Crore</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
