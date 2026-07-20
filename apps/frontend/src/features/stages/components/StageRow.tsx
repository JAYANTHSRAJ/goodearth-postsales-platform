import React from 'react';
import { Stage } from '../types/stages.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';

interface StageRowProps {
  stage: Stage;
}

export const StageRow: React.FC<StageRowProps> = ({ stage }) => {
  const getBadgeType = (status: Stage['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'neutral';
      case 'archived':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <tr className="border-b border-brand-100 hover:bg-brand-50/30 dark:border-brand-800/40 dark:hover:bg-brand-950/10 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <div className="text-sm font-semibold text-brand-900 dark:text-white">{stage.name || '—'}</div>
        <div className="text-xs text-brand-400 dark:text-brand-500">{stage.code || '—'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-800 dark:text-brand-200 text-left">
        {stage.sequenceOrder || 0}
      </td>
      <td className="px-6 py-4 text-sm text-brand-800 dark:text-brand-200 text-left max-w-xs truncate">
        {stage.description || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <StatusBadge label={stage.status?.toUpperCase() || '—'} type={getBadgeType(stage.status)} />
      </td>
    </tr>
  );
};
export default StageRow;
