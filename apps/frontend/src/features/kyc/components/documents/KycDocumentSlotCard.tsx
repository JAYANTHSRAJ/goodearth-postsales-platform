import React, { useState, useRef } from 'react';
import KycDocumentDropzone from './KycDocumentDropzone';
import DocumentPreviewModal from './DocumentPreviewModal';
import { DocumentSlotDto } from '../../types/kyc';
import kycService from '../../services/kyc.service';
import { CheckCircle2, Eye, RefreshCw, Trash2, FileText, AlertCircle, Loader2 } from 'lucide-react';

interface KycDocumentSlotCardProps {
  slot: DocumentSlotDto;
  kycApplicationId: string;
  onRefresh: () => void;
  canEdit?: boolean;
}

export const KycDocumentSlotCard: React.FC<KycDocumentSlotCardProps> = ({
  slot,
  kycApplicationId,
  onRefresh,
  canEdit = true,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const currentVer = slot.currentVersion;
  const isUploaded = !!currentVer;
  const isRejected = currentVer?.status === 'REJECTED';
  const isApproved = currentVer?.status === 'APPROVED';

  const formatDocName = (type: string) => {
    switch (type) {
      case 'PAN_CARD': return 'PAN Card';
      case 'AADHAAR_CARD': return 'Aadhaar Card';
      case 'PASSPORT': return 'Passport';
      case 'PHOTO': return 'Passport Size Photograph';
      case 'ADDRESS_PROOF': return 'Address Proof Document';
      case 'VOTER_ID': return 'Voter ID Card';
      default: return type.replace(/_/g, ' ');
    }
  };

  const getMaxSizeBytes = (_type?: string) => {
    return 5 * 1024 * 1024; // 5MB
  };

  const maxSizeBytes = getMaxSizeBytes(slot.documentType);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(25);

    try {
      setUploadProgress(65);
      await kycService.uploadDocument(
        kycApplicationId,
        slot.documentCategory,
        slot.documentType,
        slot.applicantType,
        file
      );
      setUploadProgress(100);
      onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReplaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDelete = async () => {
    try {
      await kycService.deleteDocument(slot.documentId);
      setShowConfirmDelete(false);
      onRefresh();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete document.');
    }
  };

  const previewUrl = isUploaded
    ? kycService.getFileUrl(slot.documentId, currentVer?.versionNumber)
    : '#';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 font-bold text-xs">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {formatDocName(slot.documentType)}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                {slot.applicantType === 'PRIMARY' ? 'Primary' : slot.applicantType === 'JOINT_1' ? 'Co-App' : 'Third'}
              </span>
              {slot.isRequired ? (
                <span className="text-[10px] text-rose-500 font-semibold">* Required</span>
              ) : (
                <span className="text-[10px] text-slate-400">Optional</span>
              )}
            </div>
          </div>
        </div>

        {/* Compact Status Pill */}
        <div className="shrink-0">
          {isApproved && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3" /> Approved
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-3 h-3" /> Action Required
            </span>
          )}
          {isUploaded && !isApproved && !isRejected && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              ✓ Uploaded (v{currentVer?.versionNumber})
            </span>
          )}
          {!isUploaded && !isUploading && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Pending
            </span>
          )}
        </div>
      </div>

      {/* Rejection comments banner if rejected */}
      {isRejected && currentVer?.rejectionComments && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-800 dark:text-rose-200">
          <p className="font-bold text-[11px]">Reason: {currentVer.rejectionReasonCode || 'Correction Required'}</p>
          <p className="mt-0.5 text-[11px]">{currentVer.rejectionComments}</p>
        </div>
      )}

      {/* Inline Upload Progress Micro-State */}
      {isUploading && (
        <div className="p-3 bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-brand-700 dark:text-brand-300">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
              Uploading {formatDocName(slot.documentType)}...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-brand-200 dark:bg-brand-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-brand-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Card Actions / State View */}
      {!isUploading && (
        !isUploaded || isRejected ? (
          canEdit && (
            <KycDocumentDropzone
              onFileSelect={handleFileSelect}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              error={error}
              maxSizeBytes={maxSizeBytes}
            />
          )
        ) : (
          <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 shrink-0 rounded bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold text-[10px]">
                v{currentVer?.versionNumber}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{currentVer?.fileName}</p>
                <p className="text-[10px] text-slate-400">
                  {currentVer?.uploadedAt ? new Date(currentVer.uploadedAt).toLocaleDateString() : ''}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-all"
                title="Preview Document"
              >
                <Eye className="w-3 h-3 text-brand-600" />
                <span>Preview</span>
              </button>

              {canEdit && !isApproved && (
                <>
                  <button
                    type="button"
                    onClick={() => replaceFileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-all"
                    title="Replace Document"
                  >
                    <RefreshCw className="w-3 h-3 text-blue-600" />
                    <span>Replace</span>
                  </button>
                  <input
                    type="file"
                    ref={replaceFileInputRef}
                    onChange={handleReplaceChange}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-900/50 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1 transition-all"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3 h-3 text-rose-500" />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Delete Document Version?</h4>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">{currentVer?.fileName}</span>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-300 dark:border-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        fileName={currentVer?.fileName || 'Document'}
        fileUrl={previewUrl}
        mimeType={currentVer?.mimeType}
      />
    </div>
  );
};

export default KycDocumentSlotCard;
