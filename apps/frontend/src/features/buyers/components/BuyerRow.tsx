import React from 'react';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { Buyer } from '../types/buyers.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';

interface BuyerRowProps {
  buyer: Buyer;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const BuyerRow: React.FC<BuyerRowProps> = ({ buyer, onView, onEdit, onDelete }) => {
  const getBadgeType = (status: Buyer['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'active':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <tr className="border-b border-brand-100 hover:bg-brand-50/30 dark:border-brand-800/40 dark:hover:bg-brand-950/10 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <div className="text-sm font-semibold text-brand-900 dark:text-white">{buyer.name || '—'}</div>
        <div className="text-xs text-brand-400 dark:text-brand-500">{buyer.email || '—'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <div className="text-sm text-brand-800 dark:text-brand-200">{buyer.projectName || '—'}</div>
        <div className="text-xs text-brand-400 dark:text-brand-500">{buyer.unitName || '—'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <StatusBadge label={buyer.status?.toUpperCase() || '—'} type={getBadgeType(buyer.status)} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <div className="text-sm text-brand-800 dark:text-brand-200">{buyer.totalPaid || '—'}</div>
        <div className="text-xs text-brand-400 dark:text-brand-500">Outstanding: {buyer.outstanding || '—'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-500 dark:text-brand-400 text-left">
        {buyer.bookingDate || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end gap-2">
          <button
            onClick={onView}
            className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-100 hover:text-brand-900 dark:text-brand-400 dark:hover:bg-brand-800 dark:hover:text-white transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={onEdit}
            className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-100 hover:text-brand-900 dark:text-brand-400 dark:hover:bg-brand-800 dark:hover:text-white transition-colors"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-750 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};
export default BuyerRow;
