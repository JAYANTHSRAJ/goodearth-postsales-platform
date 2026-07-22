import React from 'react';
import { Card } from '../../../../components/ui/Card';

interface Step7TaxDetailsProps {
  form: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const Step7TaxDetails: React.FC<Step7TaxDetailsProps> = ({
  form,
  onChange,
}) => {
  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 7: Tax & Statutory Compliance Details"
        subtitle="GSTIN registration, tax residency status, and statutory declarations"
      >
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Tax Residency Status <span className="text-red-500">*</span>
              </label>
              <select
                value={form.taxResidency || 'Resident Indian'}
                onChange={(e) => onChange('taxResidency', e.target.value)}
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              >
                <option>Resident Indian</option>
                <option>Non-Resident Indian (NRI)</option>
                <option>Person of Indian Origin (PIO)</option>
                <option>Overseas Citizen of India (OCI)</option>
                <option>Foreign National</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                GSTIN Number (Optional - for Business Entity)
              </label>
              <input
                type="text"
                maxLength={15}
                value={form.gstinNo || ''}
                onChange={(e) => onChange('gstinNo', e.target.value.toUpperCase())}
                placeholder="29ABCDE1234F1Z5"
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
