import React from 'react';
import { Payment } from '../types/payments.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';

interface PaymentRowProps {
  payment: Payment;
}

export const PaymentRow: React.FC<PaymentRowProps> = ({ payment }) => {
  const getBadgeType = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'neutral';
      case 'failed':
        return 'warning';
      case 'refunded':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  return (
    <tr className="border-b border-brand-100 hover:bg-brand-50/30 dark:border-brand-800/40 dark:hover:bg-brand-950/10 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <div className="text-sm font-semibold text-brand-900 dark:text-white">{payment.buyerName || '—'}</div>
        <div className="text-xs text-brand-400 dark:text-brand-500">{payment.unitName || '—'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-800 dark:text-brand-300 text-left font-mono font-semibold">
        {payment.amount || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-500 dark:text-brand-400 text-left font-mono">
        {payment.transactionId || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <StatusBadge label={payment.status?.toUpperCase() || '—'} type={getBadgeType(payment.status)} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-500 dark:text-brand-400 text-left">
        {payment.paymentDate || '—'}
      </td>
    </tr>
  );
};
export default PaymentRow;
