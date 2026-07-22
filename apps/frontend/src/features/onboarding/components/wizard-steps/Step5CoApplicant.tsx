import React, { useEffect } from 'react';
import { Card } from '../../../../components/ui/Card';

interface Step5CoApplicantProps {
  form: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export const Step5CoApplicant: React.FC<Step5CoApplicantProps> = ({
  form,
  onChange,
}) => {
  const hasCoApp = form.hasCoApplicant || 'No';
  const coApp = form.coApplicant || {};
  const primaryAddress = form.primaryApplicant?.address || {};
  const coAppAddress = coApp.address || {};

  // Address Inheritance Effect
  useEffect(() => {
    if (hasCoApp === 'Yes' && coApp.sameAddressAsPrimary === 'Yes') {
      onChange('coApplicant', {
        ...coApp,
        address: { ...primaryAddress },
      });
    }
  }, [coApp.sameAddressAsPrimary, primaryAddress]);

  const handleCoAppChange = (field: string, value: any) => {
    onChange('coApplicant', {
      ...coApp,
      [field]: value,
    });
  };

  const handleCoAppAddressChange = (field: string, value: any) => {
    onChange('coApplicant', {
      ...coApp,
      address: {
        ...coAppAddress,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 5: Co-Applicant Registration"
        subtitle="Specify secondary applicant / joint owner details if applicable"
      >
        <div className="space-y-6 pt-2">
          <div>
            <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
              Do you have a Co-Applicant for this property unit? <span className="text-red-500">*</span>
            </label>
            <select
              value={hasCoApp}
              onChange={(e) => {
                const val = e.target.value;
                onChange('hasCoApplicant', val);
                if (val === 'No') {
                  onChange('coApplicant', null);
                }
              }}
              className="w-full sm:w-64 rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
            >
              <option value="No">No (Single Applicant)</option>
              <option value="Yes">Yes (Joint Ownership)</option>
            </select>
          </div>

          {hasCoApp === 'Yes' && (
            <div className="space-y-6 pt-4 border-t border-brand-100 dark:border-brand-850">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                    Title / Salutation <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={coApp.salutation || 'Mrs.'}
                    onChange={(e) => handleCoAppChange('salutation', e.target.value)}
                    className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                  >
                    <option value="Mrs.">Mrs.</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Dr.">Dr.</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                    Co-Applicant First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={coApp.firstName || ''}
                    onChange={(e) => handleCoAppChange('firstName', e.target.value)}
                    placeholder="Priyal"
                    className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                    Co-Applicant Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={coApp.lastName || ''}
                    onChange={(e) => handleCoAppChange('lastName', e.target.value)}
                    placeholder="Sharma"
                    className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={coApp.email || ''}
                    onChange={(e) => handleCoAppChange('email', e.target.value)}
                    placeholder="priyal@example.com"
                    className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={coApp.phoneNumber || ''}
                    onChange={(e) => handleCoAppChange('phoneNumber', e.target.value)}
                    placeholder="9876543211"
                    className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                    Aadhaar Number (12 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={coApp.aadhaarNo || ''}
                    onChange={(e) => handleCoAppChange('aadhaarNo', e.target.value.replace(/\D/g, ''))}
                    placeholder="987654321098"
                    className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                    PAN Number (10 Characters)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={coApp.panNo || ''}
                    onChange={(e) => handleCoAppChange('panNo', e.target.value.toUpperCase())}
                    placeholder="XYZPQ9876R"
                    className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                  />
                </div>
              </div>

              {/* Address Inheritance Selection */}
              <div className="p-4 rounded-xl bg-brand-50/50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-850 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-900 dark:text-white">Co-Applicant Address</span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-brand-700 dark:text-brand-300">
                    <input
                      type="checkbox"
                      checked={coApp.sameAddressAsPrimary === 'Yes'}
                      onChange={(e) => handleCoAppChange('sameAddressAsPrimary', e.target.checked ? 'Yes' : 'No')}
                      className="rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                    />
                    Same as Primary Applicant Address
                  </label>
                </div>

                {coApp.sameAddressAsPrimary === 'Yes' ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Address synchronized with Primary Applicant address ({primaryAddress.addressLine1 || 'Line 1'}, {primaryAddress.city || 'City'})
                  </p>
                ) : (
                  <div className="space-y-4 pt-2">
                    <input
                      type="text"
                      value={coAppAddress.addressLine1 || ''}
                      onChange={(e) => handleCoAppAddressChange('addressLine1', e.target.value)}
                      placeholder="Co-Applicant Street Address Line 1"
                      className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <input
                        type="text"
                        value={coAppAddress.city || ''}
                        onChange={(e) => handleCoAppAddressChange('city', e.target.value)}
                        placeholder="City"
                        className="rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                      />
                      <input
                        type="text"
                        value={coAppAddress.state || ''}
                        onChange={(e) => handleCoAppAddressChange('state', e.target.value)}
                        placeholder="State"
                        className="rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                      />
                      <input
                        type="text"
                        value={coAppAddress.country || 'India'}
                        onChange={(e) => handleCoAppAddressChange('country', e.target.value)}
                        placeholder="Country"
                        className="rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                      />
                      <input
                        type="text"
                        value={coAppAddress.postalCode || ''}
                        onChange={(e) => handleCoAppAddressChange('postalCode', e.target.value)}
                        placeholder="Postal Code"
                        className="rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
