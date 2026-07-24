import React from 'react';

interface KycPanInputProps {
  label?: string;
  name?: string;
  id?: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  isRequired?: boolean;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
}

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const KycPanInput: React.FC<KycPanInputProps> = ({
  label = 'Applicant PAN Card',
  name = 'panNumber',
  id,
  value,
  onChange,
  error,
  isRequired = false,
  placeholder = 'ABCDE1234F',
  helperText = '10-character uppercase PAN',
  disabled = false,
}) => {
  const inputId = id || `kyc-field-${name}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Automatically convert to uppercase, strip invalid characters, max 10 chars
    const upperVal = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    onChange(upperVal);
  };

  const isInvalidFormat = value && value.length === 10 && !PAN_REGEX.test(value);
  const activeError = error || (isInvalidFormat ? 'Invalid PAN format (e.g. ABCDE1234F)' : undefined);

  return (
    <div className="w-full space-y-1">
      <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label} {isRequired && <span className="text-rose-500" aria-hidden="true">*</span>}
      </label>

      <input
        id={inputId}
        name={name}
        type="text"
        value={value || ''}
        onChange={handleChange}
        maxLength={10}
        disabled={disabled}
        placeholder={placeholder}
        aria-required={isRequired}
        aria-invalid={!!activeError}
        aria-describedby={activeError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        className={`w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm transition-all uppercase tracking-wider focus:outline-none focus:ring-2 ${
          activeError
            ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:ring-rose-500'
            : 'border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-brand-500 text-slate-900 dark:text-white'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />

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

export default KycPanInput;
