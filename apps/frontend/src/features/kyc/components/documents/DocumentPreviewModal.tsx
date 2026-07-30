import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { useAuthStore } from '../../../../store/authStore';

export interface DocumentPreviewViewerProps {
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  onSendOfferLetter?: () => Promise<void>;
  sendOfferLetterLoading?: boolean;
  isOfferLetterSent?: boolean;
  onClose?: () => void;
  showCloseButton?: boolean;
  heightClass?: string;
}

export const DocumentPreviewViewer: React.FC<DocumentPreviewViewerProps> = ({
  fileName,
  fileUrl,
  mimeType = 'application/pdf',
  onSendOfferLetter,
  sendOfferLetterLoading = false,
  isOfferLetterSent = false,
  onClose,
  showCloseButton = false,
  heightClass = 'h-[70vh]',
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileUrl || fileUrl === '#') {
      setObjectUrl(null);
      return;
    }

    let isMounted = true;
    let createdUrl: string | null = null;

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
        const responseContentType = res.headers.get('content-type') || mimeType || 'application/pdf';
        return res.arrayBuffer().then((buf) => ({ buf, responseContentType }));
      })
      .then(({ buf, responseContentType }) => {
        if (isMounted) {
          const blobMime = (responseContentType && responseContentType.includes('/'))
            ? responseContentType.split(';')[0].trim()
            : (mimeType || 'application/pdf');
          const blob = new Blob([buf], { type: blobMime });
          createdUrl = URL.createObjectURL(blob);
          setObjectUrl(createdUrl);
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
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [fileUrl, mimeType]);

  const effectiveMimeType = mimeType || 'application/pdf';
  const isImage = effectiveMimeType.startsWith('image/');

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full flex flex-col shadow-lg overflow-hidden focus:outline-none">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-md">
            {fileName}
          </h3>
          <p className="text-xs text-slate-400">Secure WorkDrive Binary Stream (Verified Proxy)</p>
        </div>
        <div className="flex items-center gap-3">
          {onSendOfferLetter && (
            <button
              onClick={onSendOfferLetter}
              disabled={sendOfferLetterLoading}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {sendOfferLetterLoading ? 'Sending Email...' : isOfferLetterSent ? 'Resend Offer Letter' : 'Send Offer Letter'}
            </button>
          )}
          <a
            href={objectUrl || fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={fileName}
            className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold text-brand-600 border-brand-200 hover:bg-brand-50 dark:hover:bg-slate-800 focus:ring-2 focus:ring-brand-500"
          >
            Download File
          </a>
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 focus:ring-2 focus:ring-brand-500 rounded-lg"
              aria-label="Close document preview"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-4 bg-slate-100 dark:bg-slate-950 overflow-auto flex items-center justify-center min-h-[50vh]">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-slate-500 py-12">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold">Streaming binary content from Secure WorkDrive Service...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2 max-w-md my-8">
            <p className="text-sm font-bold text-rose-800">Failed to Load Preview</p>
            <p className="text-xs text-rose-600">{error}</p>
          </div>
        ) : isImage ? (
          <img src={objectUrl || fileUrl} alt={fileName} className="max-h-[70vh] object-contain rounded-lg shadow" />
        ) : (
          <iframe
            src={objectUrl || fileUrl}
            title={fileName}
            className={`w-full ${heightClass} rounded-lg border border-slate-200 dark:border-slate-800 bg-white`}
          />
        )}
      </div>
    </div>
  );
};

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  onSendOfferLetter?: () => Promise<void>;
  sendOfferLetterLoading?: boolean;
  isOfferLetterSent?: boolean;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  ...rest
}) => {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
    >
      <div className="w-full max-w-4xl max-h-[90vh]">
        <DocumentPreviewViewer
          {...rest}
          onClose={onClose}
          showCloseButton={true}
        />
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
