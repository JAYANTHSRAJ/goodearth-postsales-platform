import React from 'react';
import { User, ShieldCheck, MapPin, Users } from 'lucide-react';
import KycInputField from './KycInputField';
import KycAddressForm from './KycAddressForm';
import KycDatePicker from '../common/KycDatePicker';
import KycAadhaarInput from './KycAadhaarInput';
import KycPanInput, { PAN_REGEX } from './KycPanInput';
import KycPhoneInput from './KycPhoneInput';
import KycDocumentSlotCard from '../documents/KycDocumentSlotCard';
import { ApplicantDto, ApplicantType, DocumentSlotDto } from '../../types/kyc';

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
  documentSlots?: DocumentSlotDto[];
  kycApplicationId?: string;
  onRefreshDocuments?: () => void;
  canEdit?: boolean;
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

export const CO_APPLICANT_RELATIONS = [
  'Husband',
  'Wife',
  'Son',
  'Daughter',
  'Father',
  'Mother',
  'Brother',
  'Sister',
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
  documentSlots = [],
  kycApplicationId = '',
  onRefreshDocuments,
  canEdit = true,
}) => {
  const handleChange = (field: keyof ApplicantDto, value: any) => {
    let formattedValue = value;
    if (field === 'panNumber' && typeof value === 'string') {
      formattedValue = value.toUpperCase().trim();
    }
    if (field === 'aadhaarNumber' && typeof value === 'string') {
      formattedValue = value.replace(/\D/g, '').slice(0, 12);
    }
    if (field === 'phone' && typeof value === 'string') {
      formattedValue = value.replace(/\D/g, '');
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

  const fieldPrefix = applicantType.toLowerCase();

  // Determine current relationship for Family Particulars (Default: S/O)
  const currentGuardianRelation = applicant.guardianRelation || 'S/O';

  // Determine occupation dropdown state vs custom "Other" occupation text
  const currentOccupation = applicant.occupation || '';
  const isPredefinedOcc = OCCUPATIONS.filter((o) => o !== 'Other').includes(currentOccupation);
  const selectedOccDropdown = isPredefinedOcc ? currentOccupation : (currentOccupation ? 'Other' : '');

  const handleOccupationDropdownChange = (selectedVal: string) => {
    if (selectedVal === 'Other') {
      handleChange('occupation', isPredefinedOcc ? 'Other' : currentOccupation || 'Other');
    } else {
      handleChange('occupation', selectedVal);
    }
  };

  // Find document slots for PAN and Aadhaar for this applicant
  const panSlot = documentSlots.find(
    (s) => s.applicantType === applicantType && s.documentType === 'PAN_CARD'
  );
  const aadhaarSlot = documentSlots.find(
    (s) => s.applicantType === applicantType && s.documentType === 'AADHAAR_CARD'
  );

  const isPanValid = !!applicant.panNumber && PAN_REGEX.test(applicant.panNumber);
  const isAadhaarValid = !!applicant.aadhaarNumber && applicant.aadhaarNumber.length === 12;

  // Auto calculate age if DOB is present
  const calculatedAge = React.useMemo(() => {
    if (!applicant.dateOfBirth) return '';
    const parts = applicant.dateOfBirth.split('-');
    if (parts.length === 3) {
      const birthYear = parseInt(parts[2], 10);
      const currentYear = new Date().getFullYear();
      if (!isNaN(birthYear) && birthYear > 1900 && birthYear <= currentYear) {
        return (currentYear - birthYear).toString();
      }
    }
    return '';
  }, [applicant.dateOfBirth]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personal information, identity uploads, family details & contact address
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

        {/* Title, First Name, Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <div>
            <label htmlFor={`${fieldPrefix}-salutation`} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Title <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <select
              id={`${fieldPrefix}-salutation`}
              value={applicant.salutation || 'Mr.'}
              onChange={(e) => handleChange('salutation', e.target.value)}
              aria-required="true"
              className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            >
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
              <option value="Dr.">Dr.</option>
              <option value="Prof.">Prof.</option>
            </select>
          </div>

          <div className="sm:col-span-1">
            <label htmlFor={`${fieldPrefix}-firstName`} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              First Name <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <input
              id={`${fieldPrefix}-firstName`}
              type="text"
              placeholder="First Name"
              value={applicant.firstName || ''}
              onChange={(e) => handleChange('firstName', e.target.value)}
              aria-required="true"
              className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor={`${fieldPrefix}-lastName`} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Last Name <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <input
              id={`${fieldPrefix}-lastName`}
              type="text"
              placeholder="Last Name"
              value={applicant.lastName || ''}
              onChange={(e) => handleChange('lastName', e.target.value)}
              aria-required="true"
              className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Gender, DOB, Age */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor={`${fieldPrefix}-gender`} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Gender <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <select
              id={`${fieldPrefix}-gender`}
              value={applicant.relation && ['Male', 'Female', 'Other'].includes(applicant.relation) ? applicant.relation : 'Male'}
              onChange={(e) => handleChange('relation', e.target.value)}
              className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <KycDatePicker
            id={`${fieldPrefix}-dob`}
            label="DOB"
            isRequired
            value={applicant.dateOfBirth || ''}
            onChange={(val) => handleChange('dateOfBirth', val)}
            error={errors[`${applicantType}.dateOfBirth`]}
            helperText="Format: dd-MM-yyyy"
          />

          <div>
            <label htmlFor={`${fieldPrefix}-age`} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Age <span className="text-slate-400 font-normal">(Auto Calculated)</span>
            </label>
            <input
              id={`${fieldPrefix}-age`}
              type="text"
              readOnly
              placeholder="Age"
              value={calculatedAge}
              className="w-full h-10 px-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-300 font-bold"
            />
          </div>
        </div>

        {/* Phone, Email, Occupation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KycPhoneInput
            id={`${fieldPrefix}-phone`}
            label="Phone"
            name={`applicant_${applicantType}_phone`}
            phoneCode={applicant.phoneCode || '+91'}
            phone={applicant.phone || ''}
            onPhoneCodeChange={(code) => handleChange('phoneCode', code)}
            onPhoneChange={(phone) => handleChange('phone', phone)}
            error={errors[`${applicantType}.phone`]}
            isRequired
          />

          <KycInputField
            id={`${fieldPrefix}-email`}
            label="Email"
            name={`applicant_${applicantType}_email`}
            type="email"
            value={applicant.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="email@example.com"
            error={errors[`${applicantType}.email`]}
            isRequired
          />

          <div className="space-y-1">
            <label htmlFor={`${fieldPrefix}-occupation`} className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Occupation <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <select
              id={`${fieldPrefix}-occupation`}
              value={selectedOccDropdown || '-Select-'}
              onChange={(e) => handleOccupationDropdownChange(e.target.value)}
              aria-required="true"
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
                  id={`${fieldPrefix}-custom-occupation`}
                  label="Specify Occupation"
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

        {/* Relationship with Primary Applicant (only for Co-Applicant / Third Applicant) */}
        {applicantType !== 'PRIMARY' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label htmlFor={`${fieldPrefix}-relationWithPrimary`} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Relationship with Primary Applicant <span className="text-rose-500" aria-hidden="true">*</span>
              </label>
              <select
                id={`${fieldPrefix}-relationWithPrimary`}
                value={applicant.relation || 'Husband'}
                onChange={(e) => handleChange('relation', e.target.value)}
                aria-required="true"
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
              >
                {CO_APPLICANT_RELATIONS.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Group 2: Identity Verification & Document Uploads */}
      <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-brand-500" /> 2. Identity Verification & Document Uploads
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PAN Section */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <KycPanInput
              id={`${fieldPrefix}-pan`}
              label={`${applicantPrefix} PAN *`}
              name={`applicant_${applicantType}_pan`}
              value={applicant.panNumber || ''}
              onChange={(val) => handleChange('panNumber', val)}
              error={errors[`${applicantType}.panNumber`]}
              isRequired
            />

            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Upload PAN Card <span className="text-rose-500">*</span>
              </p>
              {isPanValid ? (
                panSlot ? (
                  <KycDocumentSlotCard
                    slot={panSlot}
                    kycApplicationId={kycApplicationId}
                    onRefresh={onRefreshDocuments || (() => {})}
                    canEdit={canEdit}
                  />
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    Provisioning PAN Card upload slot...
                  </div>
                )
              ) : (
                <div className="p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-center space-y-1">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Upload PAN Card Disabled</p>
                  <p className="text-[11px] text-slate-400">
                    Please enter a valid 10-character PAN number above to unlock document upload.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Aadhaar Section */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <KycAadhaarInput
              id={`${fieldPrefix}-aadhaar`}
              label={`${applicantPrefix} Aadhaar *`}
              name={`applicant_${applicantType}_aadhaar`}
              value={applicant.aadhaarNumber || ''}
              onChange={(rawDigits) => handleChange('aadhaarNumber', rawDigits)}
              error={errors[`${applicantType}.aadhaarNumber`]}
              isRequired
            />

            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Upload Aadhaar Card <span className="text-rose-500">*</span>
              </p>
              {isAadhaarValid ? (
                aadhaarSlot ? (
                  <KycDocumentSlotCard
                    slot={aadhaarSlot}
                    kycApplicationId={kycApplicationId}
                    onRefresh={onRefreshDocuments || (() => {})}
                    canEdit={canEdit}
                  />
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    Provisioning Aadhaar Card upload slot...
                  </div>
                )
              ) : (
                <div className="p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-center space-y-1">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Upload Aadhaar Card Disabled</p>
                  <p className="text-[11px] text-slate-400">
                    Please enter a valid 12-digit Aadhaar number above to unlock document upload.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Group 3: Family Particulars (Simplified uniform structure for all applicants) */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <Users className="w-4 h-4 text-brand-500" /> 3. Family Particulars
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <div>
            <label htmlFor={`${fieldPrefix}-relationship`} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Relationship <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <select
              id={`${fieldPrefix}-relationship`}
              value={currentGuardianRelation}
              onChange={(e) => handleChange('guardianRelation', e.target.value)}
              aria-required="true"
              className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            >
              <option value="S/O">S/O</option>
              <option value="D/O">D/O</option>
              <option value="W/O">W/O</option>
            </select>
          </div>

          <div>
            <label htmlFor={`${fieldPrefix}-guardianSalutation`} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Title <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <select
              id={`${fieldPrefix}-guardianSalutation`}
              value={applicant.guardianSalutation || 'Mr.'}
              onChange={(e) => handleChange('guardianSalutation', e.target.value)}
              aria-required="true"
              className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            >
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
              <option value="Dr.">Dr.</option>
              <option value="Prof.">Prof.</option>
            </select>
          </div>

          <div>
            <label htmlFor={`${fieldPrefix}-guardianFirstName`} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              First Name <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <input
              id={`${fieldPrefix}-guardianFirstName`}
              type="text"
              placeholder="First Name"
              value={applicant.guardianFirstName || ''}
              onChange={(e) => handleChange('guardianFirstName', e.target.value)}
              aria-required="true"
              className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          <div>
            <label htmlFor={`${fieldPrefix}-guardianLastName`} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Last Name <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <input
              id={`${fieldPrefix}-guardianLastName`}
              type="text"
              placeholder="Last Name"
              value={applicant.guardianLastName || ''}
              onChange={(e) => handleChange('guardianLastName', e.target.value)}
              aria-required="true"
              className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Group 4: Address Particulars & Segmented Same Address Toggles */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <MapPin className="w-4 h-4 text-brand-500" /> 4. Address Particulars
        </div>

        {/* Address Same as Primary Applicant toggle for Co-Applicant */}
        {applicantType === 'JOINT_1' && (
          <div className="p-4 bg-brand-50/40 dark:bg-slate-800/50 border border-brand-200/60 dark:border-slate-700 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Is this the same address as the Primary Applicant?
                </h4>
                <p className="text-[11px] text-slate-500">
                  Select Yes to copy Primary Applicant address details or No to specify a different address.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name={`addressSameAsPrimary-${applicantType}`}
                    value="Yes"
                    checked={applicant.addressSameAsPrimary !== false}
                    onChange={() => handleAddressSameAsPrimary(true)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                  />
                  <span>(•) Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name={`addressSameAsPrimary-${applicantType}`}
                    value="No"
                    checked={applicant.addressSameAsPrimary === false}
                    onChange={() => handleAddressSameAsPrimary(false)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                  />
                  <span>( ) No</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Address Same as Primary / Secondary toggle for Third Applicant */}
        {applicantType === 'JOINT_2' && (
          <div className="p-4 bg-brand-50/40 dark:bg-slate-800/50 border border-brand-200/60 dark:border-slate-700 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900 dark:text-white">
                Same Address as Primary Applicant?
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name={`addressSameAsPrimary-${applicantType}`}
                    value="Yes"
                    checked={applicant.addressSameAsPrimary === true}
                    onChange={() => handleAddressSameAsPrimary(true)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                  />
                  <span>(•) Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name={`addressSameAsPrimary-${applicantType}`}
                    value="No"
                    checked={applicant.addressSameAsPrimary === false}
                    onChange={() => handleAddressSameAsPrimary(false)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                  />
                  <span>( ) No</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-3">
              <label className="block text-xs font-bold text-slate-900 dark:text-white">
                Same Address as Co-Applicant?
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name={`addressSameAsSecondary-${applicantType}`}
                    value="Yes"
                    checked={applicant.addressSameAsSecondary === true}
                    onChange={() => handleAddressSameAsSecondary(true)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                  />
                  <span>(•) Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name={`addressSameAsSecondary-${applicantType}`}
                    value="No"
                    checked={applicant.addressSameAsSecondary === false}
                    onChange={() => handleAddressSameAsSecondary(false)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                  />
                  <span>( ) No</span>
                </label>
              </div>
            </div>
          </div>
        )}

        <KycAddressForm
          address={applicant.address || {}}
          onChange={(newAddress) => handleChange('address', newAddress)}
          errors={errors}
          prefix={`${applicantType}.address`}
        />
      </div>
    </div>
  );
};

export default KycApplicantFormSection;
