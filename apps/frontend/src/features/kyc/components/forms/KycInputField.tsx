import React from 'react';

interface KycInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
}

export const KycInputField: React.FC<KycInputFieldProps> = ({
  label,
  name,
  error,
  helperText,
  isRequired = false,
  className = '',
  id,
  value,
  onChange,
  ...props
}) => {
  const inputId = id || `kyc-field-${name}`;

  return (
    <div className="w-full space-y-1.5">
      <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
        {label} {isRequired && <span className="text-rose-500">*</span>}
      </label>
      <input
        id={inputId}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
          error
            ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 focus:ring-rose-500/20'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-brand-500/20'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs font-semibold text-rose-500 mt-1">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-xs text-slate-400 mt-1">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default KycInputField;
