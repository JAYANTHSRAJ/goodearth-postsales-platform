import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

/**
 * Normalizes common date input formats to dd-MM-yyyy.
 * Supported inputs:
 * 20-11-2001, 20/11/2001, 20.11.2001
 * 2001-11-20, 2001/11/20
 * 20 Nov 2001, 20 November 2001, 20-Nov-2001
 * Returns normalized string "20-11-2001" or original string if parsing fails.
 */
export function normalizeDateToDdMmYyyy(input: string): string {
  if (!input || !input.trim()) return '';
  const str = input.trim();

  const monthMap: Record<string, string> = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  };

  // 1. DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
      return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
    }
  }

  // 2. YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
  const ymdMatch = str.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
      return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
    }
  }

  // 3. DD Month YYYY (e.g. 20 Nov 2001, 20 November 2001, 20-Nov-2001)
  const textMonthMatch = str.match(/^(\d{1,2})[\s\-./]+([a-zA-Z]+)[\s\-./]+(\d{4})$/);
  if (textMonthMatch) {
    const day = parseInt(textMonthMatch[1], 10);
    const monthStr = textMonthMatch[2].toLowerCase();
    const year = parseInt(textMonthMatch[3], 10);
    const month = monthMap[monthStr];
    if (day >= 1 && day <= 31 && month && year >= 1900 && year <= 2100) {
      return `${String(day).padStart(2, '0')}-${month}-${year}`;
    }
  }

  // 4. Fallback JS Date parse
  const parsedTs = Date.parse(str);
  if (!isNaN(parsedTs)) {
    const d = new Date(parsedTs);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    if (year >= 1900 && year <= 2100) {
      return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
    }
  }

  return str;
}

export function convertDdMmYyyyToIso(ddMmYyyy: string): string {
  if (!ddMmYyyy) return '';
  const normalized = normalizeDateToDdMmYyyy(ddMmYyyy);
  const match = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return '';
}

interface KycDatePickerProps {
  label?: string;
  name?: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  isRequired?: boolean;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
}

export const KycDatePicker: React.FC<KycDatePickerProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  isRequired = false,
  placeholder = 'dd-MM-yyyy',
  helperText,
  disabled = false,
}) => {
  const [displayText, setDisplayText] = useState<string>(value || '');
  const nativeDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayText(value || '');
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setDisplayText(newVal);
    onChange(newVal);
  };

  const handleBlur = () => {
    if (!displayText.trim()) return;
    const normalized = normalizeDateToDdMmYyyy(displayText);
    setDisplayText(normalized);
    onChange(normalized);
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value; // YYYY-MM-DD
    if (isoVal) {
      const normalized = normalizeDateToDdMmYyyy(isoVal);
      setDisplayText(normalized);
      onChange(normalized);
    }
  };

  const openCalendar = () => {
    if (disabled) return;
    const el = nativeDateRef.current as HTMLInputElement | null;
    if (!el) return;
    const pickerEl = el as any;
    if (typeof pickerEl.showPicker === 'function') {
      try {
        pickerEl.showPicker();
        return;
      } catch {
        // Fallback
      }
    }
    el.focus();
    el.click();
  };

  const isoValue = convertDdMmYyyyToIso(displayText);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label} {isRequired && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          type="text"
          name={name}
          value={displayText}
          disabled={disabled}
          placeholder={placeholder}
          onChange={handleTextChange}
          onBlur={handleBlur}
          className={`w-full h-10 px-3.5 pr-10 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${
            error
              ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500 text-rose-900 dark:text-rose-100'
              : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500 text-slate-900 dark:text-white'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />

        <button
          type="button"
          onClick={openCalendar}
          disabled={disabled}
          title="Pick date from calendar"
          className="absolute right-2.5 p-1 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors focus:outline-none"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>

        {/* Hidden native date input for browser calendar picker */}
        <input
          ref={nativeDateRef}
          type="date"
          value={isoValue}
          onChange={handleNativeDateChange}
          className="sr-only pointer-events-none absolute opacity-0 w-0 h-0"
          tabIndex={-1}
        />
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-rose-500 dark:text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="text-[10px] text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};

export default KycDatePicker;
