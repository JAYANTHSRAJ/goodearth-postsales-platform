import React from 'react';
import KycInputField from './KycInputField';
import KycAddressForm from './KycAddressForm';
import { ApplicantDto, ApplicantType } from '../../types/kyc';

interface KycApplicantFormSectionProps {
  title: string;
  applicantType: ApplicantType;
  applicant: ApplicantDto;
  onChange: (applicant: ApplicantDto) => void;
  errors?: Record<string, string>;
  isRemovable?: boolean;
  onRemove?: () => void;
  primaryApplicantAddress?: any;
  secondaryApplicantAddress?: any;
}

const OCCUPATIONS = [
  'Retired',
  'Student',
  'Homemaker',
  'Unemployed',
  'Investor',
  'Agriculturist',
  'Engineer',
  'Doctor',
  'Teacher',
  'Government Employee',
  'Private Sector Employee',
  'Architect',
  'Lawyer',
  'Business',
  'Artist',
  'Defense sector',
];

export const KycApplicantFormSection: React.FC<KycApplicantFormSectionProps> = ({
  title,
  applicantType,
  applicant,
  onChange,
  errors = {},
  isRemovable = false,
  onRemove,
  primaryApplicantAddress,
  secondaryApplicantAddress,
}) => {
  const handleChange = (field: keyof ApplicantDto, value: any) => {
    let formattedValue = value;
    if (field === 'panNumber' && typeof value === 'string') {
      formattedValue = value.toUpperCase().trim();
    }
    if (field === 'aadhaarNumber' && typeof value === 'string') {
      formattedValue = value.replace(/\D/g, '').slice(0, 12);
    }

    const updated = {
      ...applicant,
      applicantType,
      [field]: formattedValue,
    };

    // Auto update fullName when salutation, firstName, or lastName changes
    if (field === 'salutation' || field === 'firstName' || field === 'lastName') {
      const sal = field === 'salutation' ? value : (applicant.salutation || '');
      const fn = field === 'firstName' ? value : (applicant.firstName || '');
      const ln = field === 'lastName' ? value : (applicant.lastName || '');
      updated.fullName = `${sal} ${fn} ${ln}`.trim();
    }

    // Auto update guardianName
    if (field === 'guardianSalutation' || field === 'guardianFirstName' || field === 'guardianLastName') {
      const gsal = field === 'guardianSalutation' ? value : (applicant.guardianSalutation || '');
      const gfn = field === 'guardianFirstName' ? value : (applicant.guardianFirstName || '');
      const gln = field === 'guardianLastName' ? value : (applicant.guardianLastName || '');
      updated.guardianName = `${gsal} ${gfn} ${gln}`.trim();
    }

    onChange(updated);
  };

  const handleAddressSameAsPrimary = (isSame: boolean) => {
    const updated = {
      ...applicant,
      addressSameAsPrimary: isSame,
    };
    if (isSame && primaryApplicantAddress) {
      updated.address = { ...primaryApplicantAddress };
    }
    onChange(updated);
  };

  const handleAddressSameAsSecondary = (isSame: boolean) => {
    const updated = {
      ...applicant,
      addressSameAsSecondary: isSame,
    };
    if (isSame && secondaryApplicantAddress) {
      updated.address = { ...secondaryApplicantAddress };
    }
    onChange(updated);
  };

  const applicantPrefix = applicantType === 'PRIMARY' ? 'Applicant' : applicantType === 'JOINT_1' ? 'Co-Applicant' : 'Third Applicant';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        {isRemovable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline"
          >
            Remove {applicantPrefix}
          </button>
        )}
      </div>

      {/* Applicant Name with Salutation */}
      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {applicantPrefix} Name <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <select
              value={applicant.salutation || '-Select-'}
              onChange={(e) => handleChange('salutation', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            >
              <option value="-Select-">-Select-</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
              <option value="Dr.">Dr.</option>
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">Title</span>
          </div>
          <div className="sm:col-span-1">
            <input
              type="text"
              placeholder="First Name"
              value={applicant.firstName || ''}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">First</span>
          </div>
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Last Name"
              value={applicant.lastName || ''}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Last</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 italic">Please fill name as per your ID proof</p>
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KycInputField
          label={`${applicantPrefix} Email`}
          name={`applicant_${applicantType}_email`}
          type="email"
          value={applicant.email || ''}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="Email Address"
          error={errors[`${applicantType}.email`]}
          isRequired
        />

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {applicantPrefix} Phone <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="+91"
              value={applicant.phoneCode || '+91'}
              onChange={(e) => handleChange('phoneCode', e.target.value)}
              className="col-span-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            />
            <input
              type="tel"
              placeholder="10-digit number"
              maxLength={10}
              value={applicant.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="col-span-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* S/o D/o W/o & Guardian Name */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            S/o D/o W/o <span className="text-rose-500">*</span>
          </label>
          <select
            value={applicant.guardianRelation || '-Select-'}
            onChange={(e) => handleChange('guardianRelation', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
          >
            <option value="-Select-">-Select-</option>
            <option value="S/o">S/o</option>
            <option value="W/o">W/o</option>
            <option value="D/o">D/o</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Guardian Name <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            <select
              value={applicant.guardianSalutation || '-Select-'}
              onChange={(e) => handleChange('guardianSalutation', e.target.value)}
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            >
              <option value="-Select-">-Select-</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
              <option value="Dr.">Dr.</option>
            </select>
            <input
              type="text"
              placeholder="First Name"
              value={applicant.guardianFirstName || ''}
              onChange={(e) => handleChange('guardianFirstName', e.target.value)}
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={applicant.guardianLastName || ''}
              onChange={(e) => handleChange('guardianLastName', e.target.value)}
              className="col-span-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Date of Birth & Occupation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {applicantPrefix} Date of Birth <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="dd-MM-yyyy"
            value={applicant.dateOfBirth || ''}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">Format: dd-MM-yyyy</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {applicantPrefix} Occupation <span className="text-rose-500">*</span>
          </label>
          <select
            value={applicant.occupation || '-Select-'}
            onChange={(e) => handleChange('occupation', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
          >
            <option value="-Select-">-Select-</option>
            {OCCUPATIONS.map((occ) => (
              <option key={occ} value={occ}>
                {occ}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Address Copy Logic for Co-Applicant and Third Applicant */}
      {applicantType === 'JOINT_1' && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Co-applicant address same as applicant? <span className="text-rose-500">*</span>
          </label>
          <select
            value={applicant.addressSameAsPrimary ? 'Yes' : 'No'}
            onChange={(e) => handleAddressSameAsPrimary(e.target.value === 'Yes')}
            className="w-full max-w-xs px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
          <p className="text-xs text-slate-400 italic">Make sure the address is the same as on the address proof.</p>
        </div>
      )}

      {applicantType === 'JOINT_2' && (
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Third Applicant Address Same as Primary Applicant? <span className="text-rose-500">*</span>
            </label>
            <select
              value={applicant.addressSameAsPrimary ? 'Yes' : 'No'}
              onChange={(e) => handleAddressSameAsPrimary(e.target.value === 'Yes')}
              className="w-full max-w-xs px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Third Applicant Address Same as Second Applicant? <span className="text-rose-500">*</span>
            </label>
            <select
              value={applicant.addressSameAsSecondary ? 'Yes' : 'No'}
              onChange={(e) => handleAddressSameAsSecondary(e.target.value === 'Yes')}
              className="w-full max-w-xs px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <p className="text-xs text-slate-400 italic">Make sure the address is the same as on the address proof.</p>
        </div>
      )}

      {/* Address Form Section */}
      <KycAddressForm
        address={applicant.address || {}}
        onChange={(newAddress) => handleChange('address', newAddress)}
        errors={errors}
        prefix={`${applicantType}.address`}
      />

      {/* PAN & Aadhaar Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <KycInputField
          label={`${applicantPrefix} Aadhaar No`}
          name={`applicant_${applicantType}_aadhaar`}
          value={applicant.aadhaarNumber || ''}
          onChange={(e) => handleChange('aadhaarNumber', e.target.value)}
          placeholder="e.g. 123400009876"
          maxLength={12}
          helperText="Please enter Aadhar number without space in this format: 123400009876"
          error={errors[`${applicantType}.aadhaarNumber`]}
          isRequired
        />

        <KycInputField
          label={`${applicantPrefix} PAN`}
          name={`applicant_${applicantType}_pan`}
          value={applicant.panNumber || ''}
          onChange={(e) => handleChange('panNumber', e.target.value)}
          placeholder="e.g. ABCDE1234F"
          maxLength={10}
          error={errors[`${applicantType}.panNumber`]}
          isRequired
        />
      </div>
    </div>
  );
};

export default KycApplicantFormSection;
