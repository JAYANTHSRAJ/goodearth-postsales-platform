import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle, RefreshCw, Trash2, Loader2, AlertCircle } from 'lucide-react';

interface KycDropzoneWidgetProps {
  label: string;
  fieldKey: string;
  value?: string;
  required?: boolean;
  instruction?: string;
  maxSizeMB?: number;
  acceptedFormats?: string;
  isUploading?: boolean;
  error?: string;
  onFileUpload: (fieldKey: string, file: File) => void;
  onFileRemove: (fieldKey: string) => void;
}

export const KycDropzoneWidget: React.FC<KycDropzoneWidgetProps> = ({
  label,
  fieldKey,
  value,
  required = false,
  instruction = 'PDF, JPG or PNG up to 5MB',
  acceptedFormats = '.pdf,.jpg,.jpeg,.png',
  isUploading = false,
  error,
  onFileUpload,
  onFileRemove,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(fieldKey, e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(fieldKey, e.target.files[0]);
    }
  };

  // Get filename from URL
  const getFileName = (url: string) => {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div className="space-y-1.5 text-left">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-semibold text-brand-800 dark:text-brand-200">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {value && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-900/30">
            <CheckCircle className="h-3 w-3" /> Uploaded & Verified
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        onChange={handleFileSelect}
        className="hidden"
      />

      {!value ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-brand-600 bg-brand-50/80 dark:bg-brand-900/50 scale-[1.01]'
              : error
              ? 'border-red-300 bg-red-50/30 dark:border-red-900/30 dark:bg-red-950/10'
              : 'border-brand-200 dark:border-brand-800 bg-brand-50/20 dark:bg-brand-950/20 hover:border-brand-400 hover:bg-brand-50/50'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
              <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                Uploading document to secure server...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-3 bg-brand-100 dark:bg-brand-800 rounded-full text-brand-700 dark:text-brand-300">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-brand-900 dark:text-white">
                  Drag & Drop file here or <span className="text-brand-600 underline">Browse</span>
                </p>
                <p className="text-[11px] text-brand-500 dark:text-brand-400 mt-0.5">{instruction}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-3.5 border border-brand-200 dark:border-brand-800 rounded-xl bg-white dark:bg-brand-900/40 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-brand-100 dark:bg-brand-800 text-brand-700 dark:text-brand-300 rounded-lg shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-brand-900 dark:text-white truncate">
                {getFileName(value)}
              </p>
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-block mt-0.5"
              >
                View Document Preview ↗
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-900 p-2 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-800 transition-colors"
              title="Replace document"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Replace</span>
            </button>
            <button
              type="button"
              onClick={() => onFileRemove(fieldKey)}
              disabled={isUploading}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Delete document"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Remove</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1 text-red-500 text-[11px] font-medium mt-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};
