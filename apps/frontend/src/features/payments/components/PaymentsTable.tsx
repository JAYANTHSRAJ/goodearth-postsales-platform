import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Payment } from '../types/payments.types';
import { PaymentRow } from './PaymentRow';

interface PaymentsTableProps {
  payments: any[];
  sortField: keyof Payment;
  sortOrder: 'asc' | 'desc';
  onSort: (field: keyof Payment) => void;
}

export const PaymentsTable: React.FC<PaymentsTableProps> = ({
  payments,
  sortField,
  sortOrder,
  onSort,
}) => {
  const renderSortIcon = (field: keyof Payment) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="inline h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="inline h-4 w-4 ml-1" />
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-brand-200 dark:divide-brand-800">
        <thead className="bg-brand-50/50 dark:bg-brand-950/30">
          <tr>
            <th
              scope="col"
              onClick={() => onSort('buyerName')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Buyer & Unit {renderSortIcon('buyerName')}
            </th>
            <th
              scope="col"
              onClick={() => onSort('amount')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Amount {renderSortIcon('amount')}
            </th>
            <th
              scope="col"
              onClick={() => onSort('transactionId')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Transaction ID {renderSortIcon('transactionId')}
            </th>
            <th
              scope="col"
              onClick={() => onSort('status')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Status {renderSortIcon('status')}
            </th>
            <th
              scope="col"
              onClick={() => onSort('paymentDate')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Payment Date {renderSortIcon('paymentDate')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-brand-900 divide-y divide-brand-100 dark:divide-brand-800/40">
          {payments.map((payment) => (
            <PaymentRow key={payment.id} payment={payment} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default PaymentsTable;
