import React from 'react';

interface KycAadhaarInputProps {
  label?: string;
  name?: string;
  id?: string;
  value: string;
  onChange: (rawDigits: string) => void;
  error?: string;
  isRequired?: boolean;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
}

export function formatAadhaarDisplay(val: string): string {
  const digits = (val || '').replace(/\D/g, '').slice(0, 12);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export const KycAadhaarInput: React.FC<KycAadhaarInputProps> = ({
  label = 'Applicant Aadhaar',
  name = 'aadhaarNumber',
  id,
  value,
  onChange,
  error,
  isRequired = false,
  placeholder = '1234 5678 9012',
  helperText = '12-digit Aadhaar number',
  disabled = false,
}) => {
  const inputId = id || `kyc-field-${name}`;
  const displayValue = formatAadhaarDisplay(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Restrict strictly to digits and max 12 digits
    const rawDigits = e.target.value.replace(/\D/g, '').slice(0, 12);
    onChange(rawDigits);
  };

  return (
    <div className="w-full space-y-1">
      <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label} {isRequired && <span className="text-rose-500" aria-hidden="true">*</span>}
      </label>

      <input
        id={inputId}
        name={name}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        maxLength={14} // 12 digits + 2 spaces
        disabled={disabled}
        placeholder={placeholder}
        aria-required={isRequired}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        className={`w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 tracking-wider ${
          error
            ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:ring-rose-500'
            : 'border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-brand-500 text-slate-900 dark:text-white'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />

      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-[11px] font-medium text-rose-500 dark:text-rose-400">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-[10px] text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default KycAadhaarInput;
