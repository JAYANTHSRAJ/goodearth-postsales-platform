import React, { useEffect } from 'react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  fileName,
  fileUrl,
  mimeType = 'application/pdf',
}) => {
  // Keyboard Escape Handler for Accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isImage = mimeType.startsWith('image/');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden focus:outline-none" tabIndex={-1}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 id="preview-modal-title" className="text-base font-bold text-slate-900 dark:text-white truncate max-w-md">
              {fileName}
            </h3>
            <p className="text-xs text-slate-400">Secure WorkDrive Binary Stream</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 focus:ring-2 focus:ring-brand-500"
            >
              Open in New Tab
            </a>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 focus:ring-2 focus:ring-brand-500 rounded-lg"
              aria-label="Close document preview"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 bg-slate-100 dark:bg-slate-950 overflow-auto flex items-center justify-center">
          {isImage ? (
            <img src={fileUrl} alt={fileName} className="max-h-[70vh] object-contain rounded-lg shadow" />
          ) : (
            <iframe src={fileUrl} title={fileName} className="w-full h-[70vh] rounded-lg border border-slate-200 dark:border-slate-800" />
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
