import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../../store/authStore';

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
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !fileUrl || fileUrl === '#') {
      setObjectUrl(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const { accessToken } = useAuthStore.getState();
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    fetch(fileUrl, { headers })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Failed to fetch file binary stream`);
        }
        return res.blob();
      })
      .then((blob) => {
        if (isMounted) {
          const url = URL.createObjectURL(blob);
          setObjectUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load file preview stream.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isOpen, fileUrl]);

  if (!isOpen) return null;

  const effectiveMimeType = mimeType || 'application/pdf';
  const isImage = effectiveMimeType.startsWith('image/');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden focus:outline-none"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 id="preview-modal-title" className="text-base font-bold text-slate-900 dark:text-white truncate max-w-md">
              {fileName}
            </h3>
            <p className="text-xs text-slate-400">Secure WorkDrive Binary Stream (Verified Proxy)</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={objectUrl || fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={fileName}
              className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold text-brand-600 border-brand-200 hover:bg-brand-50 dark:hover:bg-slate-800 focus:ring-2 focus:ring-brand-500"
            >
              Download File
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

        {/* Content Body */}
        <div className="flex-1 p-4 bg-slate-100 dark:bg-slate-950 overflow-auto flex items-center justify-center min-h-[50vh]">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold">Streaming binary content from Secure WorkDrive Service...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2 max-w-md">
              <p className="text-sm font-bold text-rose-800">Failed to Load Preview</p>
              <p className="text-xs text-rose-600">{error}</p>
            </div>
          ) : isImage ? (
            <img src={objectUrl || fileUrl} alt={fileName} className="max-h-[70vh] object-contain rounded-lg shadow" />
          ) : (
            <iframe
              src={objectUrl || fileUrl}
              title={fileName}
              className="w-full h-[70vh] rounded-lg border border-slate-200 dark:border-slate-800 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
