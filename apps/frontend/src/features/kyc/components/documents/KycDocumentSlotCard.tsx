import React, { useState } from 'react';
import KycDocumentDropzone from './KycDocumentDropzone';
import DocumentPreviewModal from './DocumentPreviewModal';
import { DocumentSlotDto } from '../../types/kyc';
import kycService from '../../services/kyc.service';

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
    setUploadProgress(20);

    try {
      setUploadProgress(60);
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
      setError(err?.message || 'Failed to upload document to WorkDrive.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await kycService.deleteDocument(slot.documentId);
      setShowConfirmDelete(false);
      onRefresh();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete draft document.');
    }
  };

  const previewUrl = isUploaded
    ? kycService.getFileUrl(slot.documentId, currentVer?.versionNumber)
    : '#';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {formatDocName(slot.documentType)}
            </h4>
            <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {slot.applicantType}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {slot.isRequired ? (
              <span className="text-rose-500 font-semibold">* Required Slot</span>
            ) : (
              'Optional'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isApproved && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Approved
            </span>
          )}
          {isRejected && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              Rejected (Action Required)
            </span>
          )}
          {isUploaded && !isApproved && !isRejected && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              Uploaded (v{currentVer?.versionNumber})
            </span>
          )}
          {!isUploaded && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 dark:bg-slate-800">
              Pending Upload
            </span>
          )}
        </div>
      </div>

      {/* Rejection comments banner if rejected */}
      {isRejected && currentVer?.rejectionComments && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-200">
          <p className="font-bold">Rejection Reason: {currentVer.rejectionReasonCode || 'Correction Required'}</p>
          <p className="mt-0.5">{currentVer.rejectionComments}</p>
        </div>
      )}

      {/* Dropzone or Uploaded File Details */}
      {!isUploaded || isRejected ? (
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
        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-bold text-xs">
              v{currentVer?.versionNumber}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentVer?.fileName}</p>
              <p className="text-xs text-slate-400">
                Uploaded {currentVer?.uploadedAt ? new Date(currentVer.uploadedAt).toLocaleDateString() : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
            >
              Preview & Download
            </button>
            {canEdit && !isApproved && (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Delete Document Version?</h4>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete <span className="font-semibold">{currentVer?.fileName}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 border"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700"
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
