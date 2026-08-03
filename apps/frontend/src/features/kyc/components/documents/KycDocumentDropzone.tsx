import React, { useState, useRef } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

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
      setLocalError('Allowed: PDF, JPG, PNG');
      return;
    }
    if (file.size > maxSizeBytes) {
      setLocalError(`Exceeds limit of ${maxMbLabel}`);
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
        className={`relative border border-dashed rounded-xl p-3 text-center transition-all cursor-pointer ${
          isDragOver
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
            : activeError
            ? 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/20'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-brand-400 hover:bg-slate-100/50'
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
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-600 h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            {onCancel && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onCancel(); }}
                className="text-[10px] text-rose-600 hover:underline font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center shrink-0">
              <Upload className="w-3.5 h-3.5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                <span className="text-brand-600 dark:text-brand-400 font-bold hover:underline">Click to upload</span> or drag & drop file
              </p>
              <p className="text-[10px] text-slate-400">
                PDF, JPG, PNG (Max {maxMbLabel})
              </p>
            </div>
          </div>
        )}
      </div>

      {activeError && (
        <div className="mt-1.5 flex items-center justify-between gap-2 px-1 text-[11px] font-semibold text-rose-500">
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {activeError}
          </span>
          {onRetry && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRetry(); }}
              className="text-brand-600 hover:underline"
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
