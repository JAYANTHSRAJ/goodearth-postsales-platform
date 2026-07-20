import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Workflow } from '../types/workflows.types';
import { WorkflowRow } from './WorkflowRow';

interface WorkflowsTableProps {
  workflows: Workflow[];
  onView: (workflow: Workflow) => void;
  onEdit: (workflow: Workflow) => void;
  sortField: keyof Workflow;
  sortOrder: 'asc' | 'desc';
  onSort: (field: keyof Workflow) => void;
}

export const WorkflowsTable: React.FC<WorkflowsTableProps> = ({
  workflows,
  onView,
  onEdit,
  sortField,
  sortOrder,
  onSort,
}) => {
  const renderSortIcon = (field: keyof Workflow) => {
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
              Buyer & Unit Context {renderSortIcon('buyerName')}
            </th>
            <th
              scope="col"
              onClick={() => onSort('currentStage')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Current Stage {renderSortIcon('currentStage')}
            </th>
            <th
              scope="col"
              onClick={() => onSort('progressPercent')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Progress {renderSortIcon('progressPercent')}
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
              onClick={() => onSort('lastUpdated')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Last Updated {renderSortIcon('lastUpdated')}
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-brand-900 divide-y divide-brand-100 dark:divide-brand-800/40">
          {workflows.map((workflow) => (
            <WorkflowRow
              key={workflow.id}
              workflow={workflow}
              onView={() => onView(workflow)}
              onEdit={() => onEdit(workflow)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default WorkflowsTable;
