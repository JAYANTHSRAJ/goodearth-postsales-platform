import React, { useState, useRef } from 'react';

interface KycDocumentDropzoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  onCancel?: () => void;
  onRetry?: () => void;
  error?: string | null;
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

const DEFAULT_ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB default

export const KycDocumentDropzone: React.FC<KycDocumentDropzoneProps> = ({
  onFileSelect,
  isUploading = false,
  uploadProgress = 0,
  onCancel,
  onRetry,
  error,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxMbLabel = `${Math.round(maxSizeBytes / (1024 * 1024))}MB`;

  const validateAndPassFile = (file: File) => {
    setLocalError(null);
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setLocalError('Invalid file type. Allowed: PDF, JPG, PNG');
      return;
    }
    if (file.size > maxSizeBytes) {
      setLocalError(`File size exceeds maximum permitted limit of ${maxMbLabel}.`);
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPassFile(e.dataTransfer.files[0]);
    }
  };

  const activeError = error || localError;

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
          isDragOver
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
            : activeError
            ? 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/20'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-brand-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              validateAndPassFile(e.target.files[0]);
            }
          }}
        />

        {isUploading ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Uploading to WorkDrive...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-600 h-2 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            {onCancel && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onCancel(); }}
                className="text-xs text-rose-600 hover:underline font-semibold mt-2"
              >
                Cancel Upload
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600">
              <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Drag & drop file here, or <span className="text-brand-600 underline">browse</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supported formats: PDF, JPG, PNG (Max {maxMbLabel})
            </p>
          </div>
        )}
      </div>

      {activeError && (
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-xs font-semibold text-rose-500">{activeError}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-xs font-bold text-brand-600 underline"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default KycDocumentDropzone;
