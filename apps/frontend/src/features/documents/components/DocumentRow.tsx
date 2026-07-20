import React from 'react';
import { Download, Check, X } from 'lucide-react';
import { Document } from '../types/documents.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useAuthStore } from '../../../store/authStore';

interface DocumentRowProps {
  document: Document;
  onVerify: (status: 'verified' | 'rejected') => void;
}

export const DocumentRow: React.FC<DocumentRowProps> = ({ document, onVerify }) => {
  const { user } = useAuthStore();
  const isClient = user?.role === 'buyer';

  const getBadgeType = (status: Document['status']) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'pending':
        return 'neutral';
      case 'rejected':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const handleDownload = () => {
    if (document.workDriveFileId) {
      window.open(`https://workdrive.zoho.com/file/${document.workDriveFileId}`, '_blank');
    } else {
      alert('This document does not have an active WorkDrive reference.');
    }
  };

  return (
    <tr className="border-b border-brand-100 hover:bg-brand-50/30 dark:border-brand-800/40 dark:hover:bg-brand-950/10 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-semibold text-brand-900 dark:text-white">
        {document.name || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-800 dark:text-brand-200 text-left capitalize">
        {document.type || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-800 dark:text-brand-200 text-left">
        {document.fileSize || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <StatusBadge label={document.status?.toUpperCase() || '—'} type={getBadgeType(document.status)} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-500 dark:text-brand-400 text-left">
        {document.uploadedAt || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end gap-2">
          <button
            onClick={handleDownload}
            className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-100 hover:text-brand-900 dark:text-brand-400 dark:hover:bg-brand-800 dark:hover:text-white transition-colors"
            title="Download / View in Zoho WorkDrive"
          >
            <Download className="h-4 w-4" />
          </button>
          {!isClient && document.status === 'pending' && (
            <>
              <button
                onClick={() => onVerify('verified')}
                className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30 transition-colors"
                title="Verify Document"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => onVerify('rejected')}
                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-755 dark:text-red-450 dark:hover:bg-red-950/30 transition-colors"
                title="Reject Document"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};
export default DocumentRow;
