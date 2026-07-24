import React from 'react';

export interface CountryCodeOption {
  code: string;
  country: string;
  expectedLength: number;
}

export const COUNTRY_CODES: CountryCodeOption[] = [
  { code: '+91', country: 'India (+91)', expectedLength: 10 },
  { code: '+1', country: 'USA/Canada (+1)', expectedLength: 10 },
  { code: '+44', country: 'UK (+44)', expectedLength: 10 },
  { code: '+971', country: 'UAE (+971)', expectedLength: 9 },
  { code: '+65', country: 'Singapore (+65)', expectedLength: 8 },
  { code: '+61', country: 'Australia (+61)', expectedLength: 9 },
];

interface KycPhoneInputProps {
  label?: string;
  name?: string;
  id?: string;
  phoneCode: string;
  phone: string;
  onPhoneCodeChange: (code: string) => void;
  onPhoneChange: (phone: string) => void;
  error?: string;
  isRequired?: boolean;
  helperText?: string;
  disabled?: boolean;
}

export const KycPhoneInput: React.FC<KycPhoneInputProps> = ({
  label = 'Phone Number',
  name = 'phone',
  id,
  phoneCode = '+91',
  phone = '',
  onPhoneCodeChange,
  onPhoneChange,
  error,
  isRequired = false,
  helperText,
  disabled = false,
}) => {
  const inputId = id || `kyc-field-${name}`;
  const selectedCountry = COUNTRY_CODES.find((c) => c.code === phoneCode) || COUNTRY_CODES[0];
  const maxLen = selectedCountry.expectedLength;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Restrict strictly to digits
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, maxLen);
    onPhoneChange(digitsOnly);
  };

  const isInvalidLength = phone && phone.length > 0 && phone.length < maxLen;
  const activeError = error || (isInvalidLength ? `Phone number must be ${maxLen} digits` : undefined);

  return (
    <div className="w-full space-y-1">
      <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label} {isRequired && <span className="text-rose-500" aria-hidden="true">*</span>}
      </label>

      <div className="grid grid-cols-3 gap-2">
        <select
          id={`${inputId}-country`}
          name={`${name}_country`}
          aria-label="Country Code"
          value={phoneCode || '+91'}
          disabled={disabled}
          onChange={(e) => onPhoneCodeChange(e.target.value)}
          className="col-span-1 h-10 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.country}
            </option>
          ))}
        </select>

        <input
          id={inputId}
          name={name}
          type="tel"
          inputMode="numeric"
          value={phone || ''}
          onChange={handlePhoneChange}
          maxLength={maxLen}
          disabled={disabled}
          placeholder={`${maxLen}-digit phone`}
          aria-required={isRequired}
          aria-invalid={!!activeError}
          aria-describedby={activeError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`col-span-2 h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${
            activeError
              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:ring-rose-500'
              : 'border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-brand-500 text-slate-900 dark:text-white'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
      </div>

      {activeError ? (
        <p id={`${inputId}-error`} role="alert" className="text-[11px] font-medium text-rose-500 dark:text-rose-400">
          {activeError}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-[10px] text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default KycPhoneInput;
