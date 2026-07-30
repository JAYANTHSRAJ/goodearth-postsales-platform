import React, { useEffect, useState } from 'react';
import { Download, CheckCircle2, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { useUnitStore } from '../../../store/unitStore';
import { useAuthStore } from '../../../store/authStore';
import kycService from '../services/kyc.service';
import { OfferLetterStatusDto } from '../types/kyc';
import DocumentPreviewModal, { DocumentPreviewViewer } from '../components/documents/DocumentPreviewModal';

export const ClientOfferLetterPage: React.FC = () => {
  const { activeUnit } = useUnitStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<OfferLetterStatusDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const bookingId =
    activeUnit?.unitName ||
    activeUnit?.zohoDealName ||
    activeUnit?.workflowId ||
    activeUnit?.id ||
    'current';

  const loadOfferLetter = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await kycService.getOfferLetterStatus(bookingId);
      setStatus(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load Offer Letter status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfferLetter();
  }, [bookingId]);

  const fileUrl = status?.sent ? kycService.getOfferLetterFileUrl(bookingId) : '';
  const fileName = status?.fileName || `Offer_Letter_${bookingId}.pdf`;

  const formattedDate = status?.sentAt
    ? new Date(status.sentAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const handleDownload = () => {
    if (!fileUrl) return;
    const { accessToken } = useAuthStore.getState();
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    fetch(fileUrl, { headers })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch((err) => console.error('Download error:', err));
  };

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
      </div>
    );
  }

  if (error || !status?.sent) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">
              Offer Letter Not Shared Yet
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {status?.message || error || 'Your official Offer Letter has not been shared by GoodEarth Admin yet.'}
            </p>
            <button
              onClick={loadOfferLetter}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold text-xs hover:bg-amber-700 transition shadow-sm"
            >
              <RefreshCw className="w-4 h-4" /> Check Status Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-brand-900 border border-brand-200 dark:border-brand-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-serif font-bold text-brand-900 dark:text-brand-100">
                Official Offer Letter
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Your official Offer Letter from GoodEarth.
              </p>
            </div>

            {/* Metadata Info */}
            <div className="flex flex-wrap items-center gap-6 pt-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Status:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Shared
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Shared On:</span>
                <span className="font-medium text-slate-900 dark:text-white">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-semibold text-sm rounded-xl transition shadow-sm"
            >
              <Eye className="w-4 h-4" /> View Offer Letter
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-brand-200 hover:bg-brand-50 dark:border-brand-800 dark:hover:bg-brand-800/50 text-brand-700 dark:text-brand-200 font-semibold text-sm rounded-xl transition"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Styled PDF Preview Component (Reused from Admin Portal) */}
      <DocumentPreviewViewer
        fileName={fileName}
        fileUrl={fileUrl}
        mimeType="application/pdf"
        heightClass="h-[75vh]"
      />

      {/* Modal View (Reused from Admin Portal) */}
      <DocumentPreviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        fileName={fileName}
        fileUrl={fileUrl}
        mimeType="application/pdf"
      />
    </div>
  );
};

export default ClientOfferLetterPage;
