import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Project } from '../types/projects.types';
import { ProjectRow } from './ProjectRow';

interface ProjectsTableProps {
  projects: Project[];
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  sortField: keyof Project;
  sortOrder: 'asc' | 'desc';
  onSort: (field: keyof Project) => void;
}

export const ProjectsTable: React.FC<ProjectsTableProps> = ({
  projects,
  onView,
  onEdit,
  onDelete,
  sortField,
  sortOrder,
  onSort,
}) => {
  const renderSortIcon = (field: keyof Project) => {
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
              Project Details {renderSortIcon('name')}
            </th>
            <th
              scope="col"
              onClick={() => onSort('location')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Location {renderSortIcon('location')}
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
              onClick={() => onSort('totalUnits')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Units Context {renderSortIcon('totalUnits')}
            </th>
            <th
              scope="col"
              onClick={() => onSort('commencementDate')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Commencement Date {renderSortIcon('commencementDate')}
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-brand-900 divide-y divide-brand-100 dark:divide-brand-800/40">
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              onView={() => onView(project)}
              onEdit={() => onEdit(project)}
              onDelete={() => onDelete(project.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default ProjectsTable;
