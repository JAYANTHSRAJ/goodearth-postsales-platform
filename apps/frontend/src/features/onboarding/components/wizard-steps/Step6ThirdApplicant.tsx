import React, { useEffect } from 'react';
import { Card } from '../../../../components/ui/Card';

interface Step6ThirdApplicantProps {
  form: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export const Step6ThirdApplicant: React.FC<Step6ThirdApplicantProps> = ({
  form,
  onChange,
}) => {
  const hasThirdApp = form.hasThirdApplicant || 'No';
  const thirdApp = form.thirdApplicant || {};
  const primaryAddress = form.primaryApplicant?.address || {};
  const coAppAddress = form.coApplicant?.address || {};
  const thirdAppAddress = thirdApp.address || {};

  // Address Inheritance Effect
  useEffect(() => {
    if (hasThirdApp === 'Yes') {
      if (thirdApp.sameAddressAsPrimary === 'Yes') {
        onChange('thirdApplicant', {
          ...thirdApp,
          address: { ...primaryAddress },
        });
      } else if (thirdApp.sameAddressAsSecond === 'Yes') {
        onChange('thirdApplicant', {
          ...thirdApp,
          address: { ...coAppAddress },
        });
      }
    }
  }, [thirdApp.sameAddressAsPrimary, thirdApp.sameAddressAsSecond, primaryAddress, coAppAddress]);

  const handleThirdAppChange = (field: string, value: any) => {
    onChange('thirdApplicant', {
      ...thirdApp,
      [field]: value,
    });
  };

  const handleThirdAppAddressChange = (field: string, value: any) => {
    onChange('thirdApplicant', {
      ...thirdApp,
      address: {
        ...thirdAppAddress,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 6: Third Applicant Registration"
        subtitle="Specify third joint owner details if applicable"
      >
        <div className="space-y-6 pt-2">
          <div>
            <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
              Do you have a Third Applicant for this property unit? <span className="text-red-500">*</span>
            </label>
            <select
              value={hasThirdApp}
              onChange={(e) => {
                const val = e.target.value;
                onChange('hasThirdApplicant', val);
                if (val === 'No') {
                  onChange('thirdApplicant', null);
                }
              }}
              className="w-full sm:w-64 rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
            >
              <option value="No">No (Two Applicants Maximum)</option>
              <option value="Yes">Yes (Three Joint Owners)</option>
            </select>
          </div>

          {hasThirdApp === 'Yes' && (
            <div className="space-y-6 pt-4 border-t border-brand-100 dark:border-brand-850">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                    Title / Salutation <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={thirdApp.salutation || 'Mr.'}
                    onChange={(e) => handleThirdAppChange('salutation', e.target.value)}
                    className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Dr.">Dr.</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                    Third Applicant First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={thirdApp.firstName || ''}
                    onChange={(e) => handleThirdAppChange('firstName', e.target.value)}
                    placeholder="Rohan"
                    className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                    Third Applicant Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={thirdApp.lastName || ''}
                    onChange={(e) => handleThirdAppChange('lastName', e.target.value)}
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
                    value={thirdApp.email || ''}
                    onChange={(e) => handleThirdAppChange('email', e.target.value)}
                    placeholder="rohan@example.com"
                    className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={thirdApp.phoneNumber || ''}
                    onChange={(e) => handleThirdAppChange('phoneNumber', e.target.value)}
                    placeholder="9876543212"
                    className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                  />
                </div>
              </div>

              {/* Address Inheritance Selection */}
              <div className="p-4 rounded-xl bg-brand-50/50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-850 space-y-4">
                <span className="text-xs font-bold text-brand-900 dark:text-white block">Third Applicant Address Inheritance</span>
                
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-brand-700 dark:text-brand-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="thirdAddressInheritance"
                      checked={thirdApp.sameAddressAsPrimary === 'Yes'}
                      onChange={() => {
                        handleThirdAppChange('sameAddressAsPrimary', 'Yes');
                        handleThirdAppChange('sameAddressAsSecond', 'No');
                      }}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    Same as Primary Applicant Address
                  </label>

                  {form.hasCoApplicant === 'Yes' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="thirdAddressInheritance"
                        checked={thirdApp.sameAddressAsSecond === 'Yes'}
                        onChange={() => {
                          handleThirdAppChange('sameAddressAsPrimary', 'No');
                          handleThirdAppChange('sameAddressAsSecond', 'Yes');
                        }}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      Same as Second (Co-Applicant) Address
                    </label>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="thirdAddressInheritance"
                      checked={thirdApp.sameAddressAsPrimary !== 'Yes' && thirdApp.sameAddressAsSecond !== 'Yes'}
                      onChange={() => {
                        handleThirdAppChange('sameAddressAsPrimary', 'No');
                        handleThirdAppChange('sameAddressAsSecond', 'No');
                      }}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    Custom Address
                  </label>
                </div>

                {thirdApp.sameAddressAsPrimary !== 'Yes' && thirdApp.sameAddressAsSecond !== 'Yes' && (
                  <div className="space-y-4 pt-2">
                    <input
                      type="text"
                      value={thirdAppAddress.addressLine1 || ''}
                      onChange={(e) => handleThirdAppAddressChange('addressLine1', e.target.value)}
                      placeholder="Third Applicant Street Address Line 1"
                      className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <input
                        type="text"
                        value={thirdAppAddress.city || ''}
                        onChange={(e) => handleThirdAppAddressChange('city', e.target.value)}
                        placeholder="City"
                        className="rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                      />
                      <input
                        type="text"
                        value={thirdAppAddress.state || ''}
                        onChange={(e) => handleThirdAppAddressChange('state', e.target.value)}
                        placeholder="State"
                        className="rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                      />
                      <input
                        type="text"
                        value={thirdAppAddress.country || 'India'}
                        onChange={(e) => handleThirdAppAddressChange('country', e.target.value)}
                        placeholder="Country"
                        className="rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                      />
                      <input
                        type="text"
                        value={thirdAppAddress.postalCode || ''}
                        onChange={(e) => handleThirdAppAddressChange('postalCode', e.target.value)}
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
