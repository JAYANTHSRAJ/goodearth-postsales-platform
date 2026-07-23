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
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Address Details</h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KycInputField
          label="Street Address"
          name={`${prefix}.street`}
          value={address.street || ''}
          onChange={(e) => handleChange('street', e.target.value)}
          placeholder="Street Address"
          error={errors[`${prefix}.street`]}
          isRequired
        />

        <KycInputField
          label="Address Line 2"
          name={`${prefix}.addressLine2`}
          value={address.addressLine2 || ''}
          onChange={(e) => handleChange('addressLine2', e.target.value)}
          placeholder="Apartment, suite, unit, etc."
          error={errors[`${prefix}.addressLine2`]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KycInputField
          label="City"
          name={`${prefix}.city`}
          value={address.city || ''}
          onChange={(e) => handleChange('city', e.target.value)}
          placeholder="City"
          error={errors[`${prefix}.city`]}
          isRequired
        />

        <KycInputField
          label="Postal / Zip Code"
          name={`${prefix}.pincode`}
          value={address.pincode || ''}
          onChange={(e) => handleChange('pincode', e.target.value)}
          placeholder="Postal / Zip Code"
          maxLength={10}
          error={errors[`${prefix}.pincode`]}
          isRequired
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KycInputField
          label="State/Region/Province"
          name={`${prefix}.state`}
          value={address.state || ''}
          onChange={(e) => handleChange('state', e.target.value)}
          placeholder="State/Region/Province"
          error={errors[`${prefix}.state`]}
          isRequired
        />

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Country <span className="text-rose-500">*</span>
          </label>
          <select
            name={`${prefix}.country`}
            value={address.country || 'India'}
            onChange={(e) => handleChange('country', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          >
            <option value="-Select-">-Select-</option>
            <option value="India">India</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="United Arab Emirates">United Arab Emirates</option>
            <option value="Singapore">Singapore</option>
            <option value="Australia">Australia</option>
            <option value="Canada">Canada</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <p className="text-xs text-slate-500 italic">Please match Address with Address proof document you are attaching.</p>
    </div>
  );
};

export default KycAddressForm;
