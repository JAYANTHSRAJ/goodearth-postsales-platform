import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, ShieldCheck, Trash2, RefreshCw, History, Loader2 } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { clientService, DocumentMetadata } from '../../../../services/client.service';

interface Step8DocumentUploadPlaceholderProps {
  form: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  workflowId?: string;
}

export const Step8DocumentUploadPlaceholder: React.FC<Step8DocumentUploadPlaceholderProps> = ({
  form,
  workflowId,
}) => {
  const hasCoApp = form.hasCoApplicant === 'Yes';
  const hasThirdApp = form.hasThirdApplicant === 'Yes';

  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [historyModalDocId, setHistoryModalDocId] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<DocumentMetadata[]>([]);

  // Helper to handle real upload call to Phase 4 REST API
  const handleUpload = async (applicantType: string, documentType: string, file: File) => {
    if (!workflowId) return;
    setLoadingDocId(`${applicantType}_${documentType}`);
    try {
      const res = await clientService.uploadKycDocument(workflowId, applicantType, documentType, file);
      const meta = (res as any).data || res;
      setDocuments((prev) => [...prev.filter((d) => !(d.applicantType === applicantType && d.documentType === documentType)), meta]);
    } catch (e) {
      console.error('Upload failed', e);
    } finally {
      setLoadingDocId(null);
    }
  };

  // Helper to handle soft delete
  const handleDelete = async (docId: string) => {
    try {
      await clientService.deleteKycDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  // Helper to fetch version history
  const handleViewHistory = async (docId: string) => {
    setHistoryModalDocId(docId);
    try {
      const res = await clientService.getDocumentVersionHistory(docId);
      const list = (res as any).data || res;
      setHistoryList(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Fetch history failed', e);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <Card
        title="Step 8: Document Vault & Proof Verification"
        subtitle="Upload statutory identity and address proofs with versioning and security checks"
      >
        <div className="space-y-6 pt-2">
          {/* Security & Validation Notice Banner */}
          <div className="p-4 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-850 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-brand-900 dark:text-white block">GoodEarth Secure Document Vault (Phase 4 Enabled)</span>
              <p className="text-brand-600 dark:text-brand-300">
                Supports PDF, JPG, PNG up to 5MB (Address/PAN) and 2MB (Aadhaar/Voter ID). Documents undergo automatic path sanitization, MIME verification, virus scanning, and zero-overwrite incremental versioning.
              </p>
            </div>
          </div>

          {/* Primary Applicant Proof Dropzones */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-600" /> Primary Applicant Vault
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DropzoneWidget
                applicantType="PRIMARY"
                documentType="AADHAAR"
                label="Primary Applicant Aadhaar Card / Passport"
                required
                maxMb="2MB"
                existingDoc={documents.find((d) => d.applicantType === 'PRIMARY' && d.documentType === 'AADHAAR')}
                isLoading={loadingDocId === 'PRIMARY_AADHAAR'}
                onUpload={(file) => handleUpload('PRIMARY', 'AADHAAR', file)}
                onDelete={handleDelete}
                onViewHistory={handleViewHistory}
              />
              <DropzoneWidget
                applicantType="PRIMARY"
                documentType="PAN"
                label="Primary Applicant PAN Card"
                required
                maxMb="5MB"
                existingDoc={documents.find((d) => d.applicantType === 'PRIMARY' && d.documentType === 'PAN')}
                isLoading={loadingDocId === 'PRIMARY_PAN'}
                onUpload={(file) => handleUpload('PRIMARY', 'PAN', file)}
                onDelete={handleDelete}
                onViewHistory={handleViewHistory}
              />
              <DropzoneWidget
                applicantType="PRIMARY"
                documentType="ADDRESS_PROOF"
                label="Primary Applicant Address Proof"
                required
                maxMb="5MB"
                existingDoc={documents.find((d) => d.applicantType === 'PRIMARY' && d.documentType === 'ADDRESS_PROOF')}
                isLoading={loadingDocId === 'PRIMARY_ADDRESS_PROOF'}
                onUpload={(file) => handleUpload('PRIMARY', 'ADDRESS_PROOF', file)}
                onDelete={handleDelete}
                onViewHistory={handleViewHistory}
              />
              <DropzoneWidget
                applicantType="PRIMARY"
                documentType="VOTER_ID"
                label="Primary Applicant Voter ID (Optional)"
                maxMb="2MB"
                existingDoc={documents.find((d) => d.applicantType === 'PRIMARY' && d.documentType === 'VOTER_ID')}
                isLoading={loadingDocId === 'PRIMARY_VOTER_ID'}
                onUpload={(file) => handleUpload('PRIMARY', 'VOTER_ID', file)}
                onDelete={handleDelete}
                onViewHistory={handleViewHistory}
              />
            </div>
          </div>

          {/* Co-Applicant Vault Dropzones */}
          {hasCoApp && (
            <div className="space-y-4 pt-4 border-t border-brand-100 dark:border-brand-850">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600" /> Co-Applicant Vault
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DropzoneWidget
                  applicantType="CO_APPLICANT"
                  documentType="AADHAAR"
                  label="Co-Applicant Aadhaar Card"
                  required
                  maxMb="2MB"
                  existingDoc={documents.find((d) => d.applicantType === 'CO_APPLICANT' && d.documentType === 'AADHAAR')}
                  isLoading={loadingDocId === 'CO_APPLICANT_AADHAAR'}
                  onUpload={(file) => handleUpload('CO_APPLICANT', 'AADHAAR', file)}
                  onDelete={handleDelete}
                  onViewHistory={handleViewHistory}
                />
                <DropzoneWidget
                  applicantType="CO_APPLICANT"
                  documentType="PAN"
                  label="Co-Applicant PAN Card"
                  required
                  maxMb="5MB"
                  existingDoc={documents.find((d) => d.applicantType === 'CO_APPLICANT' && d.documentType === 'PAN')}
                  isLoading={loadingDocId === 'CO_APPLICANT_PAN'}
                  onUpload={(file) => handleUpload('CO_APPLICANT', 'PAN', file)}
                  onDelete={handleDelete}
                  onViewHistory={handleViewHistory}
                />
              </div>
            </div>
          )}

          {/* Third Applicant Vault Dropzones */}
          {hasThirdApp && (
            <div className="space-y-4 pt-4 border-t border-brand-100 dark:border-brand-850">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600" /> Third Applicant Vault
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DropzoneWidget
                  applicantType="THIRD_APPLICANT"
                  documentType="AADHAAR"
                  label="Third Applicant Aadhaar Card"
                  required
                  maxMb="2MB"
                  existingDoc={documents.find((d) => d.applicantType === 'THIRD_APPLICANT' && d.documentType === 'AADHAAR')}
                  isLoading={loadingDocId === 'THIRD_APPLICANT_AADHAAR'}
                  onUpload={(file) => handleUpload('THIRD_APPLICANT', 'AADHAAR', file)}
                  onDelete={handleDelete}
                  onViewHistory={handleViewHistory}
                />
                <DropzoneWidget
                  applicantType="THIRD_APPLICANT"
                  documentType="PAN"
                  label="Third Applicant PAN Card"
                  required
                  maxMb="5MB"
                  existingDoc={documents.find((d) => d.applicantType === 'THIRD_APPLICANT' && d.documentType === 'PAN')}
                  isLoading={loadingDocId === 'THIRD_APPLICANT_PAN'}
                  onUpload={(file) => handleUpload('THIRD_APPLICANT', 'PAN', file)}
                  onDelete={handleDelete}
                  onViewHistory={handleViewHistory}
                />
              </div>
            </div>
          )}

          {/* Version History Modal */}
          {historyModalDocId && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-brand-900 rounded-2xl p-6 max-w-md w-full space-y-4 border border-brand-200 dark:border-brand-800 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-brand-950 dark:text-white flex items-center gap-2">
                    <History className="h-4 w-4 text-brand-600" /> Version Audit History
                  </h3>
                  <button
                    type="button"
                    onClick={() => setHistoryModalDocId(null)}
                    className="text-xs font-bold text-brand-400 hover:text-brand-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {historyList.map((h) => (
                    <div key={h.id} className="p-3 rounded-xl bg-brand-50/50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-850 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-brand-900 dark:text-white block">{h.fileName}</span>
                        <span className="text-[10px] text-brand-400">Version {h.version} • {Math.round(h.sizeBytes / 1024)} KB</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">Preserved</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

const DropzoneWidget: React.FC<{
  applicantType: string;
  documentType: string;
  label: string;
  required?: boolean;
  maxMb?: string;
  existingDoc?: DocumentMetadata;
  isLoading?: boolean;
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
  onViewHistory: (id: string) => void;
}> = ({ label, required, maxMb = '5MB', existingDoc, isLoading, onUpload, onDelete, onViewHistory }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-dashed border-brand-200 dark:border-brand-800 bg-brand-50/20 dark:bg-brand-950/20 space-y-3 relative hover:border-brand-400 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-brand-900 dark:text-white block">
            {label} {required && <span className="text-red-500">*</span>}
          </span>
          <p className="text-[11px] text-brand-400">PDF, JPG or PNG format. Max {maxMb}.</p>
        </div>
        {existingDoc && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> v{existingDoc.version} Uploaded
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-4 text-center space-y-2">
          <Loader2 className="h-6 w-6 text-brand-600 animate-spin mx-auto" />
          <span className="text-xs font-semibold text-brand-600 block">Uploading & Sanitizing...</span>
        </div>
      ) : existingDoc ? (
        <div className="p-3 rounded-lg bg-white dark:bg-brand-900 border border-brand-100 dark:border-brand-800 flex items-center justify-between text-xs">
          <div className="truncate pr-2">
            <span className="font-semibold text-brand-900 dark:text-white block truncate">{existingDoc.fileName}</span>
            <span className="text-[10px] text-brand-400 font-mono">Version {existingDoc.version}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              title="View Version History"
              onClick={() => onViewHistory(existingDoc.id)}
              className="p-1.5 rounded-md hover:bg-brand-100 dark:hover:bg-brand-800 text-brand-600"
            >
              <History className="h-3.5 w-3.5" />
            </button>
            <label className="p-1.5 rounded-md hover:bg-brand-100 dark:hover:bg-brand-800 text-brand-600 cursor-pointer" title="Replace (Upload new version)">
              <RefreshCw className="h-3.5 w-3.5" />
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
            </label>
            <button
              type="button"
              title="Delete Document"
              onClick={() => onDelete(existingDoc.id)}
              className="p-1.5 rounded-md hover:bg-red-100 text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <label className="block text-center py-3 cursor-pointer group">
          <UploadCloud className="h-6 w-6 text-brand-400 group-hover:text-brand-600 mx-auto transition-colors" />
          <span className="text-xs font-bold text-brand-700 dark:text-brand-300 mt-1 block">Click or Drag & Drop File</span>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
        </label>
      )}
    </div>
  );
};
