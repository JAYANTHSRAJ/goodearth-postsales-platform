import React from 'react';
import { Card } from '../../../../components/ui/Card';

interface Step3PrimaryAddressProps {
  form: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const Step3PrimaryAddress: React.FC<Step3PrimaryAddressProps> = ({
  form,
  onChange,
  errors,
}) => {
  const primary = form.primaryApplicant || {};
  const address = primary.address || {};

  const handleAddressChange = (field: string, value: any) => {
    onChange('primaryApplicant', {
      ...primary,
      address: {
        ...address,
        [field]: value,
      },
    });
  };

  const getError = (key: string) => errors[key] || errors[key.split('.').pop() || ''];

  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 3: Permanent Residential Address"
        subtitle="Address coordinates for official notices, tax receipts, and registry"
      >
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Residence Ownership Type <span className="text-red-500">*</span>
              </label>
              <select
                id="primaryApplicant.address.residenceType"
                value={address.residenceType || 'Own Apartment'}
                onChange={(e) => handleAddressChange('residenceType', e.target.value)}
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              >
                <option value="Own Independent House / Villa">Own Independent House / Villa</option>
                <option value="Own Apartment">Own Apartment</option>
                <option value="Rented / Leased">Rented / Leased</option>
                <option value="Ancestral Property">Ancestral Property</option>
                <option value="Company Provided">Company Provided</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Street Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                id="primaryApplicant.address.addressLine1"
                name="primaryApplicant.address.addressLine1"
                type="text"
                value={address.addressLine1 || ''}
                onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                placeholder="House/Flat No., Building Name, Street"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${
                  getError('primaryApplicant.address.addressLine1')
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                }`}
              />
              {getError('primaryApplicant.address.addressLine1') && (
                <span className="text-[11px] text-red-500 mt-1 block font-medium">{getError('primaryApplicant.address.addressLine1')}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Street Address Line 2
              </label>
              <input
                id="primaryApplicant.address.addressLine2"
                type="text"
                value={address.addressLine2 || ''}
                onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                placeholder="Landmark, Sector, Locality"
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="primaryApplicant.address.city"
                  name="primaryApplicant.address.city"
                  type="text"
                  value={address.city || ''}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  placeholder="Bengaluru"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${
                    getError('primaryApplicant.address.city')
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                  }`}
                />
                {getError('primaryApplicant.address.city') && (
                  <span className="text-[11px] text-red-500 mt-1 block font-medium">{getError('primaryApplicant.address.city')}</span>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  State / Province <span className="text-red-500">*</span>
                </label>
                <input
                  id="primaryApplicant.address.state"
                  name="primaryApplicant.address.state"
                  type="text"
                  value={address.state || ''}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  placeholder="Karnataka"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${
                    getError('primaryApplicant.address.state')
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                  }`}
                />
                {getError('primaryApplicant.address.state') && (
                  <span className="text-[11px] text-red-500 mt-1 block font-medium">{getError('primaryApplicant.address.state')}</span>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  id="primaryApplicant.address.country"
                  name="primaryApplicant.address.country"
                  type="text"
                  value={address.country || 'India'}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  placeholder="India"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${
                    getError('primaryApplicant.address.country')
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                  }`}
                />
                {getError('primaryApplicant.address.country') && (
                  <span className="text-[11px] text-red-500 mt-1 block font-medium">{getError('primaryApplicant.address.country')}</span>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  Postal / ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="primaryApplicant.address.postalCode"
                  name="primaryApplicant.address.postalCode"
                  type="text"
                  value={address.postalCode || ''}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  placeholder="560060"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm font-mono outline-none transition-all ${
                    getError('primaryApplicant.address.postalCode')
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                  }`}
                />
                {getError('primaryApplicant.address.postalCode') && (
                  <span className="text-[11px] text-red-500 mt-1 block font-medium">{getError('primaryApplicant.address.postalCode')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
