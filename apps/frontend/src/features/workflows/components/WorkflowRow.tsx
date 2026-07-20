import React from 'react';
import { Eye, Edit2 } from 'lucide-react';
import { Workflow } from '../types/workflows.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';

interface WorkflowRowProps {
  workflow: Workflow;
  onView: () => void;
  onEdit: () => void;
}

export const WorkflowRow: React.FC<WorkflowRowProps> = ({ workflow, onView, onEdit }) => {
  const getBadgeType = (status: Workflow['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'active':
        return 'info';
      case 'on_hold':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <tr className="border-b border-brand-100 hover:bg-brand-50/30 dark:border-brand-800/40 dark:hover:bg-brand-950/10 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <div className="text-sm font-semibold text-brand-900 dark:text-white">{workflow.buyerName || '—'}</div>
        <div className="text-xs text-brand-400 dark:text-brand-500">{workflow.projectName || '—'} • {workflow.unitName || '—'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-800 dark:text-brand-200 text-left">
        {workflow.currentStage || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <div className="w-full bg-brand-100 rounded-full h-1.5 dark:bg-brand-800 max-w-[100px] mb-1">
          <div
            className="bg-brand-600 h-1.5 rounded-full dark:bg-brand-500"
            style={{ width: `${workflow.progressPercent || 0}%` }}
          />
        </div>
        <span className="text-xs text-brand-500 dark:text-brand-400">{workflow.progressPercent || 0}%</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <StatusBadge label={workflow.status?.toUpperCase() || '—'} type={getBadgeType(workflow.status)} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-500 dark:text-brand-400 text-left">
        {workflow.lastUpdated || '—'}
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
            title="Update Status"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};
export default WorkflowRow;
