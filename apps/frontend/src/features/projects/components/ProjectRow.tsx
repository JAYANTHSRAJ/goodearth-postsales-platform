import React from 'react';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { Project } from '../types/projects.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';

interface ProjectRowProps {
  project: Project;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProjectRow: React.FC<ProjectRowProps> = ({ project, onView, onEdit, onDelete }) => {
  const getBadgeType = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'active':
        return 'info';
      case 'planning':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <tr className="border-b border-brand-100 hover:bg-brand-50/30 dark:border-brand-800/40 dark:hover:bg-brand-950/10 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <div className="text-sm font-semibold text-brand-900 dark:text-white">{project.name || '—'}</div>
        <div className="text-xs text-brand-400 dark:text-brand-500">Code: {project.code || '—'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-brand-800 dark:text-brand-200">
        {project.location || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <StatusBadge label={project.status?.toUpperCase() || '—'} type={getBadgeType(project.status)} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <div className="text-sm text-brand-800 dark:text-brand-200">Total: {project.totalUnits} unit(s)</div>
        <div className="text-xs text-brand-405 dark:text-brand-500">Active Workflows: {project.activeWorkflows}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-500 dark:text-brand-400 text-left">
        {project.commencementDate || '—'}
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
export default ProjectRow;
