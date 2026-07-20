import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Document } from '../types/documents.types';
import { DocumentRow } from './DocumentRow';

interface DocumentsTableProps {
  documents: Document[];
  onVerify: (id: string, status: 'verified' | 'rejected') => void;
  sortField: keyof Document;
  sortOrder: 'asc' | 'desc';
  onSort: (field: keyof Document) => void;
}

export const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  onVerify,
  sortField,
  sortOrder,
  onSort,
}) => {
  const renderSortIcon = (field: keyof Document) => {
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
              Document Name {renderSortIcon('name')}
            </th>
            <th
              scope="col"
              onClick={() => onSort('type')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Document Type {renderSortIcon('type')}
            </th>
            <th
              scope="col"
              onClick={() => onSort('fileSize')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Size {renderSortIcon('fileSize')}
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
              onClick={() => onSort('uploadedAt')}
              className="cursor-pointer hover:bg-brand-100/50 px-6 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wider select-none transition-colors"
            >
              Uploaded At {renderSortIcon('uploadedAt')}
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-brand-900 divide-y divide-brand-100 dark:divide-brand-800/40">
          {documents.map((doc) => (
            <DocumentRow
              key={doc.id}
              document={doc}
              onVerify={(status) => onVerify(doc.id, status)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default DocumentsTable;
