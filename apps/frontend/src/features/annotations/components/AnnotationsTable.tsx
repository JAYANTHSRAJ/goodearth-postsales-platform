import React from 'react';
import { Annotation } from '../types/annotations.types';
import { AnnotationRow } from './AnnotationRow';

interface AnnotationsTableProps {
  annotations: Annotation[];
}

export const AnnotationsTable: React.FC<AnnotationsTableProps> = ({ annotations }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-brand-200 dark:divide-brand-800">
        <thead className="bg-brand-50/50 dark:bg-brand-950/30">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Document Blueprint Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Annotation Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Author
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Created At
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-brand-900 divide-y divide-brand-100 dark:divide-brand-800/40">
          {annotations.map((annotation) => (
            <AnnotationRow key={annotation.id} annotation={annotation} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default AnnotationsTable;
