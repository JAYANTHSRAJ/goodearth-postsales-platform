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
}

export const KycApplicantFormSection: React.FC<KycApplicantFormSectionProps> = ({
  title,
  applicantType,
  applicant,
  onChange,
  errors = {},
  isRemovable = false,
  onRemove,
}) => {
  const handleChange = (field: keyof ApplicantDto, value: any) => {
    let formattedValue = value;
    if (field === 'panNumber' && typeof value === 'string') {
      formattedValue = value.toUpperCase().trim();
    }
    if (field === 'aadhaarNumber' && typeof value === 'string') {
      formattedValue = value.replace(/\D/g, '').slice(0, 12);
    }

    onChange({
      ...applicant,
      applicantType,
      [field]: formattedValue,
    });
  };

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
            Remove Co-Applicant
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KycInputField
          label="Full Legal Name"
          name={`applicant_${applicantType}_fullName`}
          value={applicant.fullName || ''}
          onChange={(e) => handleChange('fullName', e.target.value)}
          placeholder="e.g. Rajesh Kumar"
          error={errors[`${applicantType}.fullName`]}
          isRequired
        />

        <KycInputField
          label="Email Address"
          name={`applicant_${applicantType}_email`}
          type="email"
          value={applicant.email || ''}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="e.g. rajesh@example.com"
          error={errors[`${applicantType}.email`]}
          isRequired
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KycInputField
          label="Phone Number"
          name={`applicant_${applicantType}_phone`}
          type="tel"
          value={applicant.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="e.g. +91 9876543210"
          error={errors[`${applicantType}.phone`]}
          isRequired
        />

        {applicantType !== 'PRIMARY' && (
          <KycInputField
            label="Relation to Primary Applicant"
            name={`applicant_${applicantType}_relation`}
            value={applicant.relation || ''}
            onChange={(e) => handleChange('relation', e.target.value)}
            placeholder="e.g. Spouse / Brother / Business Partner"
            error={errors[`${applicantType}.relation`]}
            isRequired
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KycInputField
          label="PAN Number (10 Characters)"
          name={`applicant_${applicantType}_pan`}
          value={applicant.panNumber || ''}
          onChange={(e) => handleChange('panNumber', e.target.value)}
          placeholder="e.g. ABCDE1234F"
          maxLength={10}
          helperText="Must be 10 uppercase characters"
          error={errors[`${applicantType}.panNumber`]}
          isRequired
        />

        <KycInputField
          label="Aadhaar Number (12 Digits)"
          name={`applicant_${applicantType}_aadhaar`}
          value={applicant.aadhaarNumber || ''}
          onChange={(e) => handleChange('aadhaarNumber', e.target.value)}
          placeholder="e.g. 123456789012"
          maxLength={12}
          helperText="Must be 12 digits"
          error={errors[`${applicantType}.aadhaarNumber`]}
          isRequired
        />
      </div>

      <KycAddressForm
        address={applicant.address || {}}
        onChange={(newAddress) => handleChange('address', newAddress)}
        errors={errors}
        prefix={`${applicantType}.address`}
      />
    </div>
  );
};

export default KycApplicantFormSection;
