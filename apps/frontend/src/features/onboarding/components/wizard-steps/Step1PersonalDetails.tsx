import React from 'react';
import { Card } from '../../../../components/ui/Card';

interface Step1Props {
  form: Record<string, any>;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export const Step1PersonalDetails: React.FC<Step1Props> = ({ form, errors, onChange }) => {
  return (
    <div className="space-y-6 text-left">
      <Card title="Primary Applicant Information" subtitle="Enter details exactly as printed on official identity records">
        <div className="space-y-5">
          {/* Title and Names */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <select
                value={form.salutation || 'Mr.'}
                onChange={(e) => onChange('salutation', e.target.value)}
                className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
              >
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
                <option value="Dr.">Dr.</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.firstName || ''}
                onChange={(e) => onChange('firstName', e.target.value)}
                placeholder="First name"
                className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
              />
              {errors.firstName && <p className="text-red-500 text-[11px] mt-1">{errors.firstName}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.lastName || ''}
                onChange={(e) => onChange('lastName', e.target.value)}
                placeholder="Last name"
                className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
              />
              {errors.lastName && <p className="text-red-500 text-[11px] mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => onChange('email', e.target.value)}
                placeholder="email@domain.com"
                className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
              />
              {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                Mobile Phone <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.phoneCode || '91'}
                  onChange={(e) => onChange('phoneCode', e.target.value)}
                  className="w-16 text-center rounded-xl border border-brand-200/80 bg-brand-50/30 px-2 py-2.5 text-xs outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white font-mono"
                  placeholder="+91"
                />
                <input
                  type="text"
                  value={form.phoneNumber || ''}
                  onChange={(e) => onChange('phoneNumber', e.target.value)}
                  placeholder="9876543210"
                  className="flex-1 rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                />
              </div>
              {errors.phoneNumber && <p className="text-red-500 text-[11px] mt-1">{errors.phoneNumber}</p>}
            </div>
          </div>

          {/* Relation Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-brand-100 dark:border-brand-850">
            <div>
              <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                Relationship Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.relationType || 'S/o'}
                onChange={(e) => onChange('relationType', e.target.value)}
                className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
              >
                <option value="S/o">Son of (S/o)</option>
                <option value="W/o">Wife of (W/o)</option>
                <option value="D/o">Daughter of (D/o)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                Relative First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.relationFirstName || ''}
                onChange={(e) => onChange('relationFirstName', e.target.value)}
                placeholder="Relative first name"
                className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
              />
              {errors.relationFirstName && <p className="text-red-500 text-[11px] mt-1">{errors.relationFirstName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                Relative Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.relationLastName || ''}
                onChange={(e) => onChange('relationLastName', e.target.value)}
                placeholder="Relative last name"
                className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
              />
              {errors.relationLastName && <p className="text-red-500 text-[11px] mt-1">{errors.relationLastName}</p>}
            </div>
          </div>

          {/* DOB & Government Identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.dob || ''}
                onChange={(e) => onChange('dob', e.target.value)}
                className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
              />
              {errors.dob && <p className="text-red-500 text-[11px] mt-1">{errors.dob}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                Aadhaar Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.aadhaarNo || ''}
                onChange={(e) => onChange('aadhaarNo', e.target.value)}
                placeholder="12-digit number without spaces"
                maxLength={12}
                className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white font-mono"
              />
              {errors.aadhaarNo && <p className="text-red-500 text-[11px] mt-1">{errors.aadhaarNo}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                PAN Card Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.panNo || ''}
                onChange={(e) => onChange('panNo', e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                maxLength={10}
                className="w-full uppercase rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white font-mono"
              />
              {errors.panNo && <p className="text-red-500 text-[11px] mt-1">{errors.panNo}</p>}
            </div>
          </div>
        </div>
      </Card>

      {/* Permanent Address Details */}
      <Card title="Permanent Residence Address" subtitle="Address matching your submitted residence proof">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
              Street Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.addressLine1 || ''}
              onChange={(e) => onChange('addressLine1', e.target.value)}
              placeholder="Flat/House No., Building Name, Street Name"
              className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
            />
            {errors.addressLine1 && <p className="text-red-500 text-[11px] mt-1">{errors.addressLine1}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.city || ''}
                onChange={(e) => onChange('city', e.target.value)}
                placeholder="City"
                className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
              />
              {errors.city && <p className="text-red-500 text-[11px] mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                State / Region <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.state || ''}
                onChange={(e) => onChange('state', e.target.value)}
                placeholder="State"
                className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
              />
              {errors.state && <p className="text-red-500 text-[11px] mt-1">{errors.state}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.country || 'India'}
                onChange={(e) => onChange('country', e.target.value)}
                className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                Postal / Zip Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.postalCode || ''}
                onChange={(e) => onChange('postalCode', e.target.value)}
                placeholder="Postal code"
                className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white font-mono"
              />
              {errors.postalCode && <p className="text-red-500 text-[11px] mt-1">{errors.postalCode}</p>}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
