import React from 'react';
import { Card } from '../../../../components/ui/Card';

interface Step3AddressDetailsProps {
  form: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const Step3AddressDetails: React.FC<Step3AddressDetailsProps> = ({
  form,
  onChange,
  errors,
}) => {
  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 3: Residential & Permanent Address"
        subtitle="Address coordinates for official notices, tax receipts, and registry"
      >
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Residence Ownership Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.residenceType || 'Own Apartment'}
                onChange={(e) => onChange('residenceType', e.target.value)}
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              >
                <option>Own Independent House / Villa</option>
                <option>Own Apartment</option>
                <option>Rented / Leased</option>
                <option>Ancestral Property</option>
                <option>Company Provided</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              Permanent Address Line 1
            </h4>
            <input
              type="text"
              value={form.addressLine1 || ''}
              onChange={(e) => onChange('addressLine1', e.target.value)}
              placeholder="House/Flat No., Building Name, Street"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${
                errors.addressLine1
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
              }`}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">City</label>
                <input
                  type="text"
                  value={form.city || ''}
                  onChange={(e) => onChange('city', e.target.value)}
                  placeholder="Bengaluru"
                  className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">State</label>
                <input
                  type="text"
                  value={form.state || ''}
                  onChange={(e) => onChange('state', e.target.value)}
                  placeholder="Karnataka"
                  className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">Country</label>
                <input
                  type="text"
                  value={form.country || 'India'}
                  onChange={(e) => onChange('country', e.target.value)}
                  placeholder="India"
                  className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">Postal Code</label>
                <input
                  type="text"
                  value={form.postalCode || ''}
                  onChange={(e) => onChange('postalCode', e.target.value)}
                  placeholder="560060"
                  className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
