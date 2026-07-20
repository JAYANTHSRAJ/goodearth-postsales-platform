import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Buyer } from '../types/buyers.types';
import { BuyerRow } from './BuyerRow';

interface BuyersTableProps {
  buyers: Buyer[];
  onView: (buyer: Buyer) => void;
  onEdit: (buyer: Buyer) => void;
  onDelete: (id: string) => void;
  sortField: keyof Buyer;
  sortOrder: 'asc' | 'desc';
  onSort: (field: keyof Buyer) => void;
}

export const BuyersTable: React.FC<BuyersTableProps> = ({
  buyers,
  onView,
  onEdit,
  onDelete,
  sortField,
  sortOrder,
  onSort,
}) => {
  const renderSortIcon = (field: keyof Buyer) => {
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
              onClick={() => onSort('name')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Buyer Details {renderSortIcon('name')}
            </th>
            <th
              scope="col"
              onClick={() => onSort('projectName')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Project & Unit {renderSortIcon('projectName')}
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
              onClick={() => onSort('totalPaid')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Financial Context {renderSortIcon('totalPaid')}
            </th>
            <th
              scope="col"
              onClick={() => onSort('bookingDate')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Booking Date {renderSortIcon('bookingDate')}
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-brand-900 divide-y divide-brand-100 dark:divide-brand-800/40">
          {buyers.map((buyer) => (
            <BuyerRow
              key={buyer.id}
              buyer={buyer}
              onView={() => onView(buyer)}
              onEdit={() => onEdit(buyer)}
              onDelete={() => onDelete(buyer.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default BuyersTable;
