import React from 'react';
import { Card } from '../../../../components/ui/Card';

interface Step7LoanAndTaxProps {
  form: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export const Step7LoanAndTax: React.FC<Step7LoanAndTaxProps> = ({
  form,
  onChange,
  errors = {},
}) => {
  const getError = (key: string) => errors[key] || errors[key.split('.').pop() || ''];

  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 7: Home Loan, Banking & Tax Details"
        subtitle="Specify loan requirements, refund bank details, and tax residency status"
      >
        <div className="space-y-6 pt-2">
          {/* Home Loan Query */}
          <div>
            <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
              Are you considering a home loan for this booking? <span className="text-red-500">*</span>
            </label>
            <select
              id="homeLoanRequired"
              value={form.homeLoanRequired || 'No'}
              onChange={(e) => onChange('homeLoanRequired', e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
            >
              <option value="No">No (Self Funded)</option>
              <option value="Yes">Yes (Bank Loan Support Required)</option>
            </select>
          </div>

          <div className="border-t border-brand-100 dark:border-brand-850 pt-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-white">
              Primary Bank Account (For Verification & Refunds)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  Account Holder Name
                </label>
                <input
                  id="bankAccountName"
                  type="text"
                  value={form.bankAccountName || ''}
                  onChange={(e) => onChange('bankAccountName', e.target.value)}
                  placeholder="Name as per Passbook/Statement"
                  className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  Bank Name
                </label>
                <input
                  id="bankName"
                  type="text"
                  value={form.bankName || ''}
                  onChange={(e) => onChange('bankName', e.target.value)}
                  placeholder="HDFC Bank / ICICI Bank / SBI..."
                  className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  Account Number
                </label>
                <input
                  id="bankAccountNumber"
                  type="text"
                  value={form.bankAccountNumber || ''}
                  onChange={(e) => onChange('bankAccountNumber', e.target.value)}
                  placeholder="50100012345678"
                  className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  IFSC Code
                </label>
                <input
                  id="bankIfsc"
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

          <div className="border-t border-brand-100 dark:border-brand-850 pt-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-white">
              Tax & Statutory Residency
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  Tax Residency Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="taxResidency"
                  value={form.taxResidency || 'Resident Indian'}
                  onChange={(e) => onChange('taxResidency', e.target.value)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${
                    getError('taxResidency')
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 focus:ring-2 focus:ring-brand-500/20 dark:text-white'
                  }`}
                >
                  <option value="Resident Indian">Resident Indian</option>
                  <option value="Non-Resident Indian (NRI)">Non-Resident Indian (NRI)</option>
                  <option value="Person of Indian Origin (PIO)">Person of Indian Origin (PIO)</option>
                  <option value="Overseas Citizen of India (OCI)">Overseas Citizen of India (OCI)</option>
                  <option value="Foreign National">Foreign National</option>
                </select>
                {getError('taxResidency') && (
                  <span className="text-[11px] text-red-500 mt-1 block font-medium">{getError('taxResidency')}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  GSTIN Number (Optional - For Business Entities)
                </label>
                <input
                  id="gstinNo"
                  type="text"
                  maxLength={15}
                  value={form.gstinNo || ''}
                  onChange={(e) => onChange('gstinNo', e.target.value.toUpperCase())}
                  placeholder="29ABCDE1234F1Z5"
                  className="w-full rounded-xl border border-brand-200 dark:border-brand-850 bg-brand-50/30 dark:bg-brand-950/20 px-4 py-2.5 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
