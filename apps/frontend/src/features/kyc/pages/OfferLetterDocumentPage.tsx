import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { kycService } from '../services/kyc.service';
import { OfferLetterStatusDto } from '../types/kyc';
import { NativePdfCanvasViewer } from '../components/documents/NativePdfCanvasViewer';
import { useAuthStore } from '../../../store/authStore';
import {
  Download,
  Send,
  Share2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';

export const OfferLetterDocumentPage: React.FC = () => {
  const { bookingId: paramBookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isAdminOrCrm = user ? ['super_admin', 'admin', 'crm', 'finance'].includes(user.role.toLowerCase()) : false;

  // Determine booking identifier
  const targetBooking = paramBookingId || (user?.role.toLowerCase() === 'buyer' ? 'motif16' : '');

  const [statusInfo, setStatusInfo] = useState<OfferLetterStatusDto | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch Offer Letter Status & Document Stream
  const fetchOfferLetter = useCallback(async () => {
    if (!targetBooking) {
      setError('Booking reference is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Status DTO
      const status = await kycService.getOfferLetterStatus(targetBooking);
      setStatusInfo(status);

      // If buyer and not sent yet, show forbidden message
      if (!isAdminOrCrm && !status.sent) {
        setError(status.message || 'Your Offer Letter has not been shared by the builder team yet.');
        setLoading(false);
        return;
      }

      // 2. Stream PDF binary using authenticated request
      const url = kycService.getOfferLetterFileUrl(targetBooking);
      setPdfUrl(url);

      const token = useAuthStore.getState().accessToken;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error(`Failed to stream document (${res.status} ${res.statusText})`);
      }

      const buffer = await res.arrayBuffer();
      setPdfData(buffer);
    } catch (err: any) {
      console.error('[OFFER_LETTER_PAGE] Error loading offer letter:', err);
      setError(err?.response?.data?.message || err?.message || 'Unable to load Offer Letter.');
    } finally {
      setLoading(false);
    }
  }, [targetBooking, isAdminOrCrm]);

  useEffect(() => {
    fetchOfferLetter();
  }, [fetchOfferLetter]);

  // Action: Send / Resend Offer Letter (Admin only)
  const handleSendOfferLetter = async () => {
    if (!targetBooking || !isAdminOrCrm) return;
    setActionLoading(true);
    setNotification(null);

    try {
      const res = await kycService.sendOfferLetter(targetBooking);
      setStatusInfo((prev: OfferLetterStatusDto | null) =>
        prev ? { ...prev, sent: true, sentAt: res.sentAt || new Date().toISOString() } : res
      );
      setNotification({ message: 'Offer Letter successfully sent to homebuyer!', type: 'success' });
      // Re-fetch document stream
      fetchOfferLetter();
    } catch (err: any) {
      console.error('[OFFER_LETTER_PAGE] Error sending offer letter:', err);
      setNotification({
        message: err?.response?.data?.message || err?.message || 'Failed to send Offer Letter.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Download PDF File
  const handleDownloadPdf = async () => {
    if (!targetBooking || !pdfUrl) return;
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(pdfUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Offer_Letter_${targetBooking.toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[OFFER_LETTER_PAGE] Download error:', err);
      setNotification({ message: 'Failed to download Offer Letter PDF.', type: 'error' });
    }
  };

  // Action: Share Link (Admin only)
  const handleShare = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    setNotification({ message: 'Offer Letter page link copied to clipboard!', type: 'success' });
    setTimeout(() => setNotification(null), 4000);
  };

  const formattedGeneratedAt = statusInfo?.sentAt
    ? new Date(statusInfo.sentAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  const formattedSharedAt = statusInfo?.sentAt
    ? new Date(statusInfo.sentAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not shared yet';

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-950 text-slate-100 font-sans p-3 md:p-6 lg:p-8">
      {/* Page Header Card */}
      <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Section: GoodEarth Branding & Metadata */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {/* Official GoodEarth Header Branding */}
            <div className="flex items-center gap-3">
              <img
                src="https://goodearth.org.in/assets/1778746789898_wewsp.svg"
                alt="GoodEarth - building sustainable communities"
                className="h-10 md:h-12 w-auto object-contain bg-white/95 p-1.5 rounded-xl border border-slate-700 shadow-md"
              />
              <div className="flex flex-col">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Official Offer Letter
                </h1>
                <span className="text-[11px] font-semibold text-emerald-400 tracking-wide">
                  building sustainable communities
                </span>
              </div>
            </div>

            {statusInfo && (
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                  statusInfo.sent
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                    : 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                }`}
              >
                {statusInfo.sent ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Shared & Active
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Draft / Pending Send
                  </>
                )}
              </span>
            )}
          </div>

          {/* Detailed Required Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs">
            {/* Offer Letter No */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Offer Letter No</span>
              <span className="font-mono text-emerald-400 font-bold">
                GE/OL/{targetBooking.toUpperCase()}/2026
              </span>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Status</span>
              <span className={`font-semibold ${statusInfo?.sent ? 'text-emerald-300' : 'text-amber-300'}`}>
                {statusInfo?.sent ? 'Shared with Buyer' : 'Draft / Pending Send'}
              </span>
            </div>

            {/* Generated On */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Generated On</span>
              <span className="text-slate-200 font-medium flex items-center gap-1">
                <FileCheck2 className="w-3 h-3 text-slate-400" />
                {formattedGeneratedAt}
              </span>
            </div>

            {/* Shared On */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Shared On</span>
              <span className="text-slate-200 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {formattedSharedAt}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Action Buttons (Print Removed, Download PDF Preserved) */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          {isAdminOrCrm && (
            <button
              onClick={handleSendOfferLetter}
              disabled={actionLoading}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg ${
                statusInfo?.sent
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {actionLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{actionLoading ? 'Processing...' : statusInfo?.sent ? 'Resend Offer Letter' : 'Send Offer Letter'}</span>
            </button>
          )}

          {isAdminOrCrm && (
            <button
              onClick={handleShare}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-2 transition border border-slate-700"
              title="Share Link"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Share</span>
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            disabled={!pdfUrl}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs flex items-center gap-2 transition border border-slate-700 shadow-md disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800/60'
              : 'bg-rose-950/80 text-rose-200 border-rose-800/60'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white font-bold ml-4">
            ×
          </button>
        </div>
      )}

      {/* Main Content Area: Native Application Canvas Viewer */}
      <div className="flex-1 flex flex-col min-h-[650px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-24 bg-slate-900/60 border border-slate-800 rounded-2xl gap-4">
            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
            <p className="text-sm font-medium text-slate-300">Loading Official Offer Letter...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 px-6 bg-rose-950/20 border border-rose-900/40 rounded-2xl text-center gap-4 my-auto">
            <AlertTriangle className="w-12 h-12 text-rose-400" />
            <h3 className="text-lg font-bold text-rose-200">Offer Letter Access Restricted</h3>
            <p className="text-xs text-rose-300/80 max-w-md">{error}</p>
            <button
              onClick={fetchOfferLetter}
              className="mt-2 px-5 py-2.5 bg-rose-900/60 hover:bg-rose-800 text-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        ) : pdfData ? (
          <NativePdfCanvasViewer
            pdfData={pdfData}
            fileName={`Offer_Letter_${targetBooking.toUpperCase()}.pdf`}
            className="flex-1 min-h-[700px]"
          />
        ) : null}
      </div>
    </div>
  );
};

export default OfferLetterDocumentPage;
