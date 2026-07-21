import React from 'react';
import { Card } from '../../../../components/ui/Card';

interface Step2Props {
  form: Record<string, any>;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export const Step2CoApplicants: React.FC<Step2Props> = ({ form, errors, onChange }) => {
  const hasCoApp = form.hasCoApplicant === 'Yes';

  return (
    <div className="space-y-6 text-left">
      {/* Co-Applicant Question Card */}
      <Card title="Co-Applicant Registration" subtitle="Is there a secondary joint buyer or spouse registered on this property?">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-2">
              Do you have a Co-Applicant for this property allotment? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <button
                type="button"
                onClick={() => onChange('hasCoApplicant', 'Yes')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                  hasCoApp
                    ? 'border-brand-600 bg-brand-700 text-white shadow-sm'
                    : 'border-brand-200 dark:border-brand-800 bg-white dark:bg-brand-900 text-brand-800 dark:text-brand-200 hover:border-brand-400'
                }`}
              >
                Yes, Add Co-Applicant
              </button>
              <button
                type="button"
                onClick={() => onChange('hasCoApplicant', 'No')}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                  !hasCoApp
                    ? 'border-brand-600 bg-brand-700 text-white shadow-sm'
                    : 'border-brand-200 dark:border-brand-800 bg-white dark:bg-brand-900 text-brand-800 dark:text-brand-200 hover:border-brand-400'
                }`}
              >
                No Co-Applicant
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Co-Applicant Form Block */}
      {hasCoApp && (
        <Card title="Co-Applicant Personal Details" subtitle="Primary co-buyer identity details for joint ownership">
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">Title</label>
                <select
                  value={form.coSalutation || 'Mr.'}
                  onChange={(e) => onChange('coSalutation', e.target.value)}
                  className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.coFirstName || ''}
                  onChange={(e) => onChange('coFirstName', e.target.value)}
                  placeholder="Co-applicant first name"
                  className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                />
                {errors.coFirstName && <p className="text-red-500 text-[11px] mt-1">{errors.coFirstName}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.coLastName || ''}
                  onChange={(e) => onChange('coLastName', e.target.value)}
                  placeholder="Co-applicant last name"
                  className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                />
                {errors.coLastName && <p className="text-red-500 text-[11px] mt-1">{errors.coLastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.coEmail || ''}
                  onChange={(e) => onChange('coEmail', e.target.value)}
                  placeholder="coapplicant@domain.com"
                  className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                />
                {errors.coEmail && <p className="text-red-500 text-[11px] mt-1">{errors.coEmail}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.coPhoneNumber || ''}
                  onChange={(e) => onChange('coPhoneNumber', e.target.value)}
                  placeholder="Phone number"
                  className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                />
                {errors.coPhoneNumber && <p className="text-red-500 text-[11px] mt-1">{errors.coPhoneNumber}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.coDob || ''}
                  onChange={(e) => onChange('coDob', e.target.value)}
                  className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                />
                {errors.coDob && <p className="text-red-500 text-[11px] mt-1">{errors.coDob}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                  Aadhaar Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.coAadhaarNo || ''}
                  onChange={(e) => onChange('coAadhaarNo', e.target.value)}
                  maxLength={12}
                  className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white font-mono"
                />
                {errors.coAadhaarNo && <p className="text-red-500 text-[11px] mt-1">{errors.coAadhaarNo}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
                  PAN Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.coPanNo || ''}
                  onChange={(e) => onChange('coPanNo', e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full uppercase rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none dark:border-brand-850 dark:bg-brand-950/20 dark:text-white font-mono"
                />
                {errors.coPanNo && <p className="text-red-500 text-[11px] mt-1">{errors.coPanNo}</p>}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
