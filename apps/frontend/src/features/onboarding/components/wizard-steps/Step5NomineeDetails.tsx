import React from 'react';
import { Card } from '../../../../components/ui/Card';

interface Step5NomineeDetailsProps {
  form: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const Step5NomineeDetails: React.FC<Step5NomineeDetailsProps> = ({
  form,
  onChange,
}) => {
  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 5: Nominee & Family Co-Applicants"
        subtitle="Nominee registration and co-ownership records"
      >
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Nominee Full Name
              </label>
              <input
                type="text"
                value={form.nomineeName || ''}
                onChange={(e) => onChange('nomineeName', e.target.value)}
                placeholder="Full Legal Name of Nominee"
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Relationship with Primary Applicant
              </label>
              <select
                value={form.nomineeRelation || 'Spouse'}
                onChange={(e) => onChange('nomineeRelation', e.target.value)}
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              >
                <option>Spouse</option>
                <option>Son</option>
                <option>Daughter</option>
                <option>Father</option>
                <option>Mother</option>
                <option>Brother</option>
                <option>Sister</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Nominee Date of Birth
              </label>
              <input
                type="date"
                value={form.nomineeDob || ''}
                onChange={(e) => onChange('nomineeDob', e.target.value)}
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Nominee Contact Phone
              </label>
              <input
                type="tel"
                value={form.nomineePhone || ''}
                onChange={(e) => onChange('nomineePhone', e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
