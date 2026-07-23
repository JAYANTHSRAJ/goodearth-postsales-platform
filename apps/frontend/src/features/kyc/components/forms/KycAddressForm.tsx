import React from 'react';
import KycInputField from './KycInputField';
import { AddressDto } from '../../types/kyc';

interface KycAddressFormProps {
  address: AddressDto;
  onChange: (address: AddressDto) => void;
  errors?: Record<string, string>;
  prefix?: string;
}

export const KycAddressForm: React.FC<KycAddressFormProps> = ({
  address,
  onChange,
  errors = {},
  prefix = 'address',
}) => {
  const handleChange = (field: keyof AddressDto, value: string) => {
    onChange({
      ...address,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4 pt-2">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Address Information</h4>
      
      <KycInputField
        label="Street / Door / Area"
        name={`${prefix}.street`}
        value={address.street || ''}
        onChange={(e) => handleChange('street', e.target.value)}
        placeholder="e.g. Flat 301, Emerald Towers, MG Road"
        error={errors[`${prefix}.street`]}
        isRequired
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KycInputField
          label="City"
          name={`${prefix}.city`}
          value={address.city || ''}
          onChange={(e) => handleChange('city', e.target.value)}
          placeholder="e.g. Bengaluru"
          error={errors[`${prefix}.city`]}
          isRequired
        />

        <KycInputField
          label="State"
          name={`${prefix}.state`}
          value={address.state || ''}
          onChange={(e) => handleChange('state', e.target.value)}
          placeholder="e.g. Karnataka"
          error={errors[`${prefix}.state`]}
          isRequired
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KycInputField
          label="Pincode"
          name={`${prefix}.pincode`}
          value={address.pincode || ''}
          onChange={(e) => handleChange('pincode', e.target.value)}
          placeholder="e.g. 560001"
          maxLength={6}
          error={errors[`${prefix}.pincode`]}
          isRequired
        />

        <KycInputField
          label="Country"
          name={`${prefix}.country`}
          value={address.country || 'India'}
          onChange={(e) => handleChange('country', e.target.value)}
          placeholder="e.g. India"
          error={errors[`${prefix}.country`]}
        />
      </div>
    </div>
  );
};

export default KycAddressForm;
