import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { kycService } from '../services/kyc.service';
import { OfferLetterStatusDto, ZohoSignDto } from '../types/kyc';
import { NativePdfCanvasViewer } from '../components/documents/NativePdfCanvasViewer';
import { useAuthStore } from '../../../store/authStore';
import { useUnitStore } from '../../../store/unitStore';
import {
  Download,
  Send,
  Share2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  RefreshCw,
  FileCheck2,
  FileSignature,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

export const OfferLetterDocumentPage: React.FC = () => {
  const { bookingId: paramBookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeUnit } = useUnitStore();

  // Admin or CRM evaluation (Defaults to Admin if no explicitly logged-in buyer role)
  const isAdminOrCrm = !user || user.role?.toLowerCase() !== 'buyer';

  // Determine booking identifier dynamically in priority order
  const targetBooking =
    paramBookingId ||
    activeUnit?.unitName ||
    activeUnit?.zohoDealName ||
    activeUnit?.workflowId ||
    activeUnit?.id ||
    '';

  const [statusInfo, setStatusInfo] = useState<OfferLetterStatusDto | null>(null);
  const [signRequest, setSignRequest] = useState<ZohoSignDto | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Fetch Offer Letter Status, Live Zoho Sign Status & Document Stream
  const fetchOfferLetter = useCallback(async () => {
    if (!targetBooking) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // 1. Fetch Status DTO
      const status = await kycService.getOfferLetterStatus(targetBooking);
      setStatusInfo(status);

      // 2. Fetch Live Zoho Sign Request Status directly from Zoho Sign API
      const liveSign = await kycService.getSignRequestForBooking(targetBooking);
      setSignRequest(liveSign);

      // 3. Determine PDF Stream URL (Signed PDF stream from Zoho Sign if signed, else local generator stream)
      let streamUrl = kycService.getOfferLetterFileUrl(targetBooking);
      if (liveSign && (liveSign.requestStatus === 'COMPLETED' || liveSign.requestStatus === 'SIGNED')) {
        streamUrl = kycService.getSignedDocumentDownloadUrl(liveSign.requestId);
      }
      setPdfUrl(streamUrl);

      const token = useAuthStore.getState().accessToken;
      const res = await fetch(streamUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const buffer = await res.arrayBuffer();
        setPdfData(buffer);
      } else {
        console.warn(`[OFFER_LETTER_PAGE] Stream returned status ${res.status}`);
      }
    } catch (err: any) {
      console.error('[OFFER_LETTER_PAGE] Error loading offer letter:', err);
    } finally {
      setLoading(false);
    }
  }, [targetBooking]);

  useEffect(() => {
    fetchOfferLetter();
  }, [fetchOfferLetter]);

  // Action: Send for e-Sign (Admin only)
  const handleSendForESign = async () => {
    if (!targetBooking || !isAdminOrCrm) return;
    setActionLoading(true);
    setNotification(null);

    try {
      const res = await kycService.sendOfferLetter(targetBooking);
      setStatusInfo((prev: OfferLetterStatusDto | null) =>
        prev ? { ...prev, sent: true, sentAt: res.sentAt || new Date().toISOString() } : res
      );

      const liveSign = await kycService.getSignRequestForBooking(targetBooking);
      setSignRequest(liveSign);

      if (liveSign?.requestStatus === 'DRAFT' || liveSign?.apiLicenseRequired) {
        setNotification({
          message: 'Request created as DRAFT in Zoho Sign. API submission requires a Zoho Sign plan upgrade or manual send from Zoho Sign portal.',
          type: 'warning',
        });
      } else {
        setNotification({ message: 'Offer Letter sent for e-Sign via Zoho Sign!', type: 'success' });
      }
    } catch (err: any) {
      console.error('[OFFER_LETTER_PAGE] Error sending for e-Sign:', err);
      setNotification({
        message: err?.response?.data?.message || err?.message || 'Failed to send for e-Sign.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Handle Buyer e-Sign (Fetch live sign URL directly from Zoho Sign API and open)
  const handleBuyerSign = async () => {
    if (!signRequest?.requestId) return;
    setActionLoading(true);

    try {
      // Fetch latest live status and signing URL directly from Zoho Sign API
      const liveStatus = await kycService.getSignRequestStatus(signRequest.requestId);
      if (liveStatus?.signUrl && liveStatus.requestStatus !== 'DRAFT') {
        window.open(liveStatus.signUrl, '_blank', 'noopener,noreferrer');
      } else {
        setNotification({
          message: 'Document is currently in DRAFT state. Signing will be enabled once dispatched by GoodEarth.',
          type: 'warning',
        });
      }
    } catch (err: any) {
      console.error('[OFFER_LETTER_PAGE] Error fetching signing URL:', err);
      setNotification({ message: 'Failed to retrieve live signing session.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Download Signed / Standard PDF
  const handleDownloadPdf = async (customRequestId?: string) => {
    const targetUrl = customRequestId
      ? kycService.getSignedDocumentDownloadUrl(customRequestId)
      : pdfUrl;

    if (!targetBooking || !targetUrl) return;

    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(targetUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = customRequestId
        ? `Signed_Offer_Letter_${targetBooking.toUpperCase()}.pdf`
        : `Offer_Letter_${targetBooking.toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[OFFER_LETTER_PAGE] Download error:', err);
      setNotification({ message: 'Failed to download document PDF.', type: 'error' });
    }
  };

  // Action: Share Link (Admin only)
  const handleShare = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    setNotification({ message: 'Offer Letter page link copied to clipboard!', type: 'success' });
    setTimeout(() => setNotification(null), 4000);
  };

  const isSigned =
    signRequest?.requestStatus === 'COMPLETED' || signRequest?.requestStatus === 'SIGNED';

  const isDraftLicenseBlocked =
    signRequest?.requestStatus === 'DRAFT' || signRequest?.apiLicenseRequired;

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

  const formattedSentAt = signRequest?.createdAt
    ? new Date(signRequest.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : statusInfo?.sentAt
    ? new Date(statusInfo.sentAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not sent yet';

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
                src="/assets/goodearth-logo.png"
                alt="GoodEarth - building sustainable communities"
                className="h-9 md:h-11 w-auto max-w-[200px] md:max-w-[240px] object-contain bg-white/95 px-2 py-1 rounded-xl border border-slate-700 shadow-md flex-shrink-0"
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

            {/* Live Zoho Sign Status Badge */}
            {isSigned ? (
              <span className="text-xs font-bold px-3.5 py-1 rounded-full border bg-emerald-950/90 text-emerald-300 border-emerald-700/80 flex items-center gap-1.5 shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {isAdminOrCrm ? '✓ Signed' : '✅ Offer Letter Signed'}
              </span>
            ) : isDraftLicenseBlocked ? (
              <span className="text-xs font-bold px-3.5 py-1 rounded-full border bg-amber-950/90 text-amber-300 border-amber-700/80 flex items-center gap-1.5 shadow-lg">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                {isAdminOrCrm ? '⚠️ Draft (Action Required)' : '⏳ Signature Pending Dispatch'}
              </span>
            ) : signRequest ? (
              <span className={`text-xs font-bold px-3.5 py-1 rounded-full border flex items-center gap-1.5 shadow-lg ${
                signRequest.requestStatus === 'VIEWED'
                  ? 'bg-sky-950/90 text-sky-300 border-sky-700/80'
                  : 'bg-amber-950/90 text-amber-300 border-amber-700/80'
              }`}>
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                {isAdminOrCrm
                  ? '✓ e-Sign Sent'
                  : signRequest.requestStatus === 'VIEWED'
                  ? 'Resume Signing'
                  : '🟡 Signature Pending'}
              </span>
            ) : statusInfo?.sent ? (
              <span className="text-xs font-bold px-3.5 py-1 rounded-full border bg-emerald-950/80 text-emerald-300 border-emerald-800/60 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Shared with Buyer
              </span>
            ) : (
              <span className="text-xs font-bold px-3.5 py-1 rounded-full border bg-slate-800 text-slate-300 border-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {isAdminOrCrm ? 'Draft / Pending Send' : 'Waiting for GoodEarth to send the document for signature.'}
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

            {/* Request ID / Status */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                {signRequest ? 'Zoho Sign Request ID' : 'Status'}
              </span>
              <span className="font-mono font-semibold text-slate-200 truncate">
                {signRequest ? signRequest.requestId : statusInfo?.sent ? 'Shared with Buyer' : 'Draft / Pending Send'}
              </span>
            </div>

            {/* Sent / Signed Details */}
            {isSigned ? (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Signed By</span>
                  <span className="text-emerald-300 font-medium flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                    {signRequest?.recipientName || signRequest?.recipientEmail || 'Buyer'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Signed Time</span>
                  <span className="text-slate-200 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formattedSentAt}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Generated On</span>
                  <span className="text-slate-200 font-medium flex items-center gap-1">
                    <FileCheck2 className="w-3 h-3 text-slate-400" />
                    {formattedGeneratedAt}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Sent Time</span>
                  <span className="text-slate-200 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formattedSentAt}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Section: Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          {/* ADMIN ACTIONS */}
          {isAdminOrCrm && (
            <>
              {!signRequest ? (
                <button
                  onClick={handleSendForESign}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSignature className="w-4 h-4" />
                  )}
                  <span>{actionLoading ? 'Initiating e-Sign...' : 'Send for e-Sign'}</span>
                </button>
              ) : isSigned ? (
                <>
                  <button
                    onClick={() => handleDownloadPdf(signRequest.requestId)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Signed Copy</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(signRequest.requestId)}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-2 transition border border-slate-700"
                    title="Download Audit Certificate"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Audit Certificate</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSendForESign}
                  disabled={actionLoading}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{actionLoading ? 'Processing...' : 'Resend e-Sign Email'}</span>
                </button>
              )}

              <button
                onClick={handleShare}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-2 transition border border-slate-700"
                title="Share Link"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>Share</span>
              </button>
            </>
          )}

          {/* BUYER ACTIONS */}
          {!isAdminOrCrm && (
            <>
              {isSigned ? (
                <button
                  onClick={() => handleDownloadPdf(signRequest?.requestId)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Signed Offer Letter</span>
                </button>
              ) : isDraftLicenseBlocked ? (
                <div className="flex flex-col items-end gap-1">
                  <button
                    disabled
                    className="px-5 py-2.5 bg-slate-800 text-slate-500 rounded-xl font-bold text-xs flex items-center gap-2 cursor-not-allowed border border-slate-800"
                    title="Document signature is being initialized by GoodEarth."
                  >
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                    <span>Sign Offer Letter (Pending Dispatch)</span>
                  </button>
                  <span className="text-[10px] text-amber-400 font-medium">
                    Document signature is being initialized by GoodEarth.
                  </span>
                </div>
              ) : signRequest ? (
                <button
                  onClick={handleBuyerSign}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg animate-bounce"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  <span>
                    {actionLoading
                      ? 'Fetching Sign Session...'
                      : signRequest.requestStatus === 'VIEWED'
                      ? 'Resume Signing'
                      : 'Sign Offer Letter'}
                  </span>
                </button>
              ) : (
                <div className="px-4 py-2 bg-amber-950/60 border border-amber-800/60 text-amber-300 rounded-xl text-xs font-semibold">
                  Waiting for GoodEarth to send the document for signature.
                </div>
              )}
            </>
          )}

          {/* STANDARD DOWNLOAD BUTTON FOR ADMIN OR PRE-SIGN BUYER */}
          {(!isSigned || isAdminOrCrm) && (
            <button
              onClick={() => handleDownloadPdf()}
              disabled={!pdfUrl}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs flex items-center gap-2 transition border border-slate-700 shadow-md disabled:opacity-40"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* License Warning Banner for Admin */}
      {isAdminOrCrm && isDraftLicenseBlocked && (
        <div className="mb-6 p-4 rounded-xl text-xs font-medium bg-amber-950/90 text-amber-200 border border-amber-700/80 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-bold text-amber-300 text-sm">
              Zoho Sign License Action Required (Error 12000)
            </span>
            <p className="text-amber-200/90 leading-relaxed">
              The signature request (ID: <code className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">{signRequest?.requestId}</code>) was successfully created as a <strong>DRAFT</strong> in Zoho Sign, but automated API dispatch requires a Zoho Sign plan upgrade.
            </p>
            <div className="mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-amber-300 font-semibold">
              <span>To complete dispatch, an administrator must either:</span>
              <span className="bg-amber-900/60 px-2 py-0.5 rounded border border-amber-600/50">
                1. Upgrade Zoho Sign Plan
              </span>
              <span>or</span>
              <span className="bg-amber-900/60 px-2 py-0.5 rounded border border-amber-600/50">
                2. Send Draft manually from Zoho Sign Portal
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800/60'
              : notification.type === 'warning'
              ? 'bg-amber-950/80 text-amber-200 border-amber-800/60'
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
            <p className="text-sm font-medium text-slate-300">Loading Official Offer Letter & Zoho Sign Status...</p>
          </div>
        ) : pdfData ? (
          <NativePdfCanvasViewer
            pdfData={pdfData}
            fileName={
              isSigned
                ? `Signed_Offer_Letter_${targetBooking.toUpperCase()}.pdf`
                : `Offer_Letter_${targetBooking.toUpperCase()}.pdf`
            }
            className="flex-1 min-h-[700px]"
          />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 bg-slate-900/40 border border-slate-800 rounded-2xl text-center gap-4 my-auto">
            <Clock className="w-12 h-12 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Offer Letter Pending Initiation</h3>
            <p className="text-xs text-slate-400 max-w-md">
              {!isAdminOrCrm
                ? 'Your Offer Letter has not been sent for e-Sign by GoodEarth yet. Please check back shortly.'
                : 'Click "Send for e-Sign" above to generate the PDF and initiate the signature workflow.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferLetterDocumentPage;
