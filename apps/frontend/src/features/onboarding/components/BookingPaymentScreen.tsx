import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Copy, Check, Info, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { KycDropzoneWidget } from './KycDropzoneWidget';

interface BookingPaymentScreenProps {
  receiptUrl: string;
  isUploading: boolean;
  isSubmitting: boolean;
  onFileUpload: (field: string, file: File) => void;
  onFileRemove: (field: string) => void;
  onSubmitPayment: (details: any) => void;
}

export const BookingPaymentScreen: React.FC<BookingPaymentScreenProps> = ({
  receiptUrl,
  isUploading,
  isSubmitting,
  onFileUpload,
  onFileRemove,
  onSubmitPayment,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const bankDetails = {
    companyName: 'Good Earth Eco Futures Pvt Ltd',
    bankName: 'HDFC Bank',
    accountHolder: 'Good Earth Eco Futures Pvt Ltd',
    accountNumber: '50200012345678',
    ifscCode: 'HDFC0001234',
    branch: 'Indiranagar, Bengaluru',
    upiId: 'goodearth@hdfcbank',
    gstin: '29AAAAA0000A1Z5',
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptUrl && !utrNumber.trim()) {
      setPaymentError('Please enter a Transaction Ref / UTR number or upload a payment receipt.');
      return;
    }
    setPaymentError(null);
    onSubmitPayment({
      utrNumber,
      receiptUrl,
      amount: '50000',
      currency: 'INR',
    });
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Editorial Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-brand-850 to-brand-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-800/80 border border-brand-700/50 text-[11px] font-semibold text-brand-200">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-400" />
            Official Booking Deposit Verification
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            Booking Payment & Bank Details
          </h1>
          <p className="text-xs sm:text-sm text-brand-200 leading-relaxed max-w-2xl">
            Please transfer the initial booking deposit of ₹50,000 to the official GoodEarth bank account listed below and upload your payment proof to complete your onboarding milestone.
          </p>
        </div>
      </div>

      {/* Bank Account Details Card */}
      <Card title="Official GoodEarth Bank Account" subtitle="Use these bank details for NEFT, RTGS, IMPS or UPI transfer">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-brand-50/50 dark:bg-brand-900/30 border border-brand-200/80 dark:border-brand-850 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-450 dark:text-brand-400">
                Company Name / Account Holder
              </span>
              <span className="text-xs font-bold text-brand-900 dark:text-white">
                {bankDetails.companyName}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-450 dark:text-brand-400">
                Bank Name & Branch
              </span>
              <span className="text-xs font-bold text-brand-900 dark:text-white">
                {bankDetails.bankName} – {bankDetails.branch}
              </span>
            </div>

            {/* Account Number with Copy */}
            <div className="p-3 rounded-lg bg-white dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold uppercase text-brand-450">Account Number</span>
                <span className="font-mono text-sm font-bold text-brand-900 dark:text-white tracking-wider">
                  {bankDetails.accountNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(bankDetails.accountNumber, 'acc')}
                className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-800 transition-colors"
                title="Copy Account Number"
              >
                {copiedField === 'acc' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* IFSC Code with Copy */}
            <div className="p-3 rounded-lg bg-white dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold uppercase text-brand-450">IFSC Code</span>
                <span className="font-mono text-sm font-bold text-brand-900 dark:text-white tracking-wider">
                  {bankDetails.ifscCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(bankDetails.ifscCode, 'ifsc')}
                className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-800 transition-colors"
                title="Copy IFSC Code"
              >
                {copiedField === 'ifsc' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* UPI ID with Copy */}
            <div className="p-3 rounded-lg bg-white dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold uppercase text-brand-450">UPI VPA Handle</span>
                <span className="font-mono text-xs font-bold text-brand-900 dark:text-white">
                  {bankDetails.upiId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(bankDetails.upiId, 'upi')}
                className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-800 transition-colors"
                title="Copy UPI ID"
              >
                {copiedField === 'upi' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* GSTIN */}
            <div className="p-3 rounded-lg bg-white dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold uppercase text-brand-450">Company GSTIN</span>
                <span className="font-mono text-xs font-bold text-brand-900 dark:text-white">
                  {bankDetails.gstin}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(bankDetails.gstin, 'gst')}
                className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-800 transition-colors"
                title="Copy GSTIN"
              >
                {copiedField === 'gst' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Instructions Section */}
      <Card title="Payment Instructions" subtitle="Guidelines for smooth transfer and verification">
        <div className="space-y-3 text-xs text-brand-700 dark:text-brand-300">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-brand-50/60 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-850">
            <Info className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-brand-900 dark:text-white">Step 1: Initiate Transfer</p>
              <p className="text-brand-600 dark:text-brand-400">
                Transfer ₹50,000 using NEFT, RTGS, IMPS or UPI to the account details above. In the transfer remarks/reference field, please mention your Name or Unit Number.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-brand-50/60 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-850">
            <Info className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-brand-900 dark:text-white">Step 2: Note Reference / UTR Number</p>
              <p className="text-brand-600 dark:text-brand-400">
                After completing the transaction, copy the 12-digit UTR or Transaction Reference ID generated by your banking app.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-brand-50/60 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-850">
            <Info className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-brand-900 dark:text-white">Step 3: Upload Receipt & Submit</p>
              <p className="text-brand-600 dark:text-brand-400">
                Upload a screenshot or PDF receipt of your payment below and click "Submit Payment Proof" to complete onboarding.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Upload Payment Receipt & Submit Section */}
      <Card title="Upload Payment Proof" subtitle="Attach transaction receipt & reference details">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">
              Transaction Reference / UTR Number
            </label>
            <input
              type="text"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="e.g. 320194829102"
              className="w-full rounded-xl border border-brand-200/80 bg-brand-50/30 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white font-mono"
            />
          </div>

          <KycDropzoneWidget
            label="Payment Receipt / Transaction Screenshot"
            fieldKey="paymentReceiptUrl"
            value={receiptUrl}
            required
            instruction="PDF, JPG or PNG up to 5MB"
            isUploading={isUploading}
            error={paymentError || undefined}
            onFileUpload={(_, file) => onFileUpload('paymentReceiptUrl', file)}
            onFileRemove={() => onFileRemove('paymentReceiptUrl')}
          />

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-700 to-brand-900 hover:from-brand-800 hover:to-brand-950 shadow-md transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying Payment...
                </>
              ) : (
                <>
                  Submit Payment Proof
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
