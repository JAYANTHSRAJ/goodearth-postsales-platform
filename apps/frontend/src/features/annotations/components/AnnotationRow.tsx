import React from 'react';
import { Annotation } from '../types/annotations.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';

interface AnnotationRowProps {
  annotation: Annotation;
}

export const AnnotationRow: React.FC<AnnotationRowProps> = ({ annotation }) => {
  const getBadgeType = (status: Annotation['status']) => {
    switch (status) {
      case 'resolved':
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
      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-semibold text-brand-900 dark:text-white">
        {annotation.documentName || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-800 dark:text-brand-200 text-left capitalize">
        {annotation.type || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-800 dark:text-brand-200 text-left">
        {annotation.author || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <StatusBadge label={annotation.status?.toUpperCase() || '—'} type={getBadgeType(annotation.status)} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-500 dark:text-brand-400 text-left">
        {annotation.createdAt || '—'}
      </td>
    </tr>
  );
};
export default AnnotationRow;
