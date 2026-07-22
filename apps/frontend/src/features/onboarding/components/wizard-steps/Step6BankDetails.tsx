import React from 'react';
import { Card } from '../../../../components/ui/Card';

interface Step6BankDetailsProps {
  form: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const Step6BankDetails: React.FC<Step6BankDetailsProps> = ({
  form,
  onChange,
}) => {
  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 6: Banking & Refund Details"
        subtitle="Primary bank account for payment verification and refund processing"
      >
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.bankAccountName || ''}
                onChange={(e) => onChange('bankAccountName', e.target.value)}
                placeholder="Name as per Bank Passbook/Statement"
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.bankName || ''}
                onChange={(e) => onChange('bankName', e.target.value)}
                placeholder="HDFC Bank / ICICI Bank / SBI..."
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.bankAccountNumber || ''}
                onChange={(e) => onChange('bankAccountNumber', e.target.value)}
                placeholder="50100012345678"
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                IFSC Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={11}
                value={form.bankIfsc || ''}
                onChange={(e) => onChange('bankIfsc', e.target.value.toUpperCase())}
                placeholder="HDFC0001234"
                className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
