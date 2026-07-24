import React from 'react';
import { User, Mail, ShieldCheck, MapPin } from 'lucide-react';
import KycInputField from './KycInputField';
import KycAddressForm from './KycAddressForm';
import KycDatePicker from '../common/KycDatePicker';
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

export const OCCUPATIONS = [
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
  'Defense Sector',
  'Other',
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

  const applicantPrefix =
    applicantType === 'PRIMARY'
      ? 'Primary Applicant'
      : applicantType === 'JOINT_1'
      ? 'Co-Applicant'
      : 'Third Applicant';

  // Determine current relationship (Default: S/O)
  const currentRelation = applicant.guardianRelation || 'S/O';
  const isSpouseRelation = currentRelation === 'W/O' || currentRelation === 'W/o';

  // Determine occupation dropdown state vs custom "Other" occupation text
  const currentOccupation = applicant.occupation || '';
  const isPredefinedOcc = OCCUPATIONS.filter((o) => o !== 'Other').includes(currentOccupation);
  const selectedOccDropdown = isPredefinedOcc ? currentOccupation : (currentOccupation ? 'Other' : '');

  const handleOccupationDropdownChange = (selectedVal: string) => {
    if (selectedVal === 'Other') {
      // If user chooses Other and previous occupation was a predefined option, reset to empty for custom typing
      handleChange('occupation', isPredefinedOcc ? 'Other' : currentOccupation || 'Other');
    } else {
      handleChange('occupation', selectedVal);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personal information, contact particulars & identity documents
            </p>
          </div>
        </div>

        {isRemovable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
          >
            Remove {applicantPrefix}
          </button>
        )}
      </div>

      {/* Group 1: Personal Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <User className="w-4 h-4 text-brand-500" /> 1. Personal Information
        </div>

        {/* Applicant Name with Salutation */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <select
              value={applicant.salutation || '-Select-'}
              onChange={(e) => handleChange('salutation', e.target.value)}
              className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            >
              <option value="-Select-">-Select-</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
              <option value="Dr.">Dr.</option>
            </select>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              First Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="First Name"
              value={applicant.firstName || ''}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Last Name"
              value={applicant.lastName || ''}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Date of Birth & Occupation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KycDatePicker
            label="Date of Birth"
            isRequired
            value={applicant.dateOfBirth || ''}
            onChange={(val) => handleChange('dateOfBirth', val)}
            error={errors[`${applicantType}.dateOfBirth`]}
            helperText="Format: dd-MM-yyyy"
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Occupation <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedOccDropdown || '-Select-'}
              onChange={(e) => handleOccupationDropdownChange(e.target.value)}
              className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            >
              <option value="-Select-">-Select-</option>
              {OCCUPATIONS.map((occ) => (
                <option key={occ} value={occ}>
                  {occ}
                </option>
              ))}
            </select>

            {/* Custom Occupation Text Input when 'Other' is selected */}
            {selectedOccDropdown === 'Other' && (
              <div className="pt-2">
                <KycInputField
                  label="Occupation"
                  name={`applicant_${applicantType}_custom_occupation`}
                  value={applicant.occupation === 'Other' ? '' : applicant.occupation || ''}
                  onChange={(e) => handleChange('occupation', e.target.value || 'Other')}
                  placeholder="Specify Occupation"
                  isRequired
                  error={errors[`${applicantType}.occupation`]}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Group 2: Contact Particulars & Family Particulars */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <Mail className="w-4 h-4 text-brand-500" /> 2. Contact & Family Particulars
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KycInputField
            label={`${applicantPrefix} Email`}
            name={`applicant_${applicantType}_email`}
            type="email"
            value={applicant.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="email@example.com"
            error={errors[`${applicantType}.email`]}
            isRequired
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              {applicantPrefix} Phone <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="+91"
                value={applicant.phoneCode || '+91'}
                onChange={(e) => handleChange('phoneCode', e.target.value)}
                className="col-span-1 h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
              <input
                type="tel"
                placeholder="10-digit phone"
                maxLength={10}
                value={applicant.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="col-span-2 h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* Family Particulars (Relationship, Father/Spouse First & Last Name) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Relationship <span className="text-rose-500">*</span>
            </label>
            <select
              value={currentRelation}
              onChange={(e) => handleChange('guardianRelation', e.target.value)}
              className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              <option value="S/O">S/O</option>
              <option value="D/O">D/O</option>
              <option value="W/O">W/O</option>
            </select>
          </div>

          <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Title
              </label>
              <select
                value={applicant.guardianSalutation || '-Select-'}
                onChange={(e) => handleChange('guardianSalutation', e.target.value)}
                className="w-full h-10 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="-Select-">-Select-</option>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
                <option value="Dr.">Dr.</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isSpouseRelation ? `${applicantPrefix} Spouse First Name` : `${applicantPrefix} Father's First Name`}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="First Name"
                value={applicant.guardianFirstName || ''}
                onChange={(e) => handleChange('guardianFirstName', e.target.value)}
                className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isSpouseRelation ? `${applicantPrefix} Spouse Last Name` : `${applicantPrefix} Father's Last Name`}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Last Name"
                value={applicant.guardianLastName || ''}
                onChange={(e) => handleChange('guardianLastName', e.target.value)}
                className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Address Segmented Toggles for Co-Applicant and Third Applicant */}
      {applicantType === 'JOINT_1' && (
        <div className="p-4 bg-brand-50/40 dark:bg-slate-800/50 border border-brand-200/60 dark:border-slate-700 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-900 dark:text-white">
              Address Same as Primary Applicant?
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddressSameAsPrimary(true)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  applicant.addressSameAsPrimary
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleAddressSameAsPrimary(false)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !applicant.addressSameAsPrimary
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {applicantType === 'JOINT_2' && (
        <div className="p-4 bg-brand-50/40 dark:bg-slate-800/50 border border-brand-200/60 dark:border-slate-700 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-900 dark:text-white">
              Same Address as Primary Applicant?
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddressSameAsPrimary(true)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  applicant.addressSameAsPrimary
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleAddressSameAsPrimary(false)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !applicant.addressSameAsPrimary
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                No
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-3">
            <label className="block text-xs font-bold text-slate-900 dark:text-white">
              Same Address as Second Applicant?
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddressSameAsSecondary(true)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  applicant.addressSameAsSecondary
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleAddressSameAsSecondary(false)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !applicant.addressSameAsSecondary
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group 3: Address Particulars */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <MapPin className="w-4 h-4 text-brand-500" /> 3. Address Particulars
        </div>

        <KycAddressForm
          address={applicant.address || {}}
          onChange={(newAddress) => handleChange('address', newAddress)}
          errors={errors}
          prefix={`${applicantType}.address`}
        />
      </div>

      {/* Group 4: Tax & Government Identity Verification */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-brand-500" /> 4. Government Identity & Tax Verification
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <KycInputField
            label={`${applicantPrefix} Aadhaar Number`}
            name={`applicant_${applicantType}_aadhaar`}
            value={applicant.aadhaarNumber || ''}
            onChange={(e) => handleChange('aadhaarNumber', e.target.value)}
            placeholder="123400009876"
            maxLength={12}
            helperText="12-digit Aadhaar number without spaces"
            error={errors[`${applicantType}.aadhaarNumber`]}
            isRequired
          />

          <KycInputField
            label={`${applicantPrefix} PAN Card`}
            name={`applicant_${applicantType}_pan`}
            value={applicant.panNumber || ''}
            onChange={(e) => handleChange('panNumber', e.target.value)}
            placeholder="ABCDE1234F"
            maxLength={10}
            helperText="10-character uppercase PAN"
            error={errors[`${applicantType}.panNumber`]}
            isRequired
          />
        </div>
      </div>
    </div>
  );
};

export default KycApplicantFormSection;
