import React, { useState } from 'react';
import { Sparkles, CheckCircle2, FileText, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { KycCopySourceDto } from '../types/kyc';

interface CopyKycModalProps {
  sources: KycCopySourceDto[];
  targetUnitName?: string;
  onCopy: (selectedSourceId: string) => Promise<void>;
  onClose: () => void;
}

export const CopyKycModal: React.FC<CopyKycModalProps> = ({
  sources,
  targetUnitName = 'this property',
  onCopy,
  onClose,
}) => {
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    sources.length > 0 ? sources[0].workflowId : ''
  );
  const [step, setStep] = useState<'SELECT' | 'CONFIRM'>('SELECT');
  const [copying, setCopying] = useState<boolean>(false);

  if (!sources || sources.length === 0) return null;

  const selectedSource = sources.find((s) => s.workflowId === selectedSourceId) || sources[0];

  const handleConfirmCopy = async () => {
    if (!selectedSourceId) return;
    setCopying(true);
    try {
      await onCopy(selectedSourceId);
    } finally {
      setCopying(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '07-Aug-2026';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-amber-100 transform transition-all">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-amber-200 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-amber-500/20 backdrop-blur border border-amber-400/30 rounded-xl">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {step === 'SELECT'
                  ? sources.length > 1
                    ? 'Choose KYC Source'
                    : 'Reuse Existing KYC?'
                  : 'Copy KYC Details'}
              </h2>
              <p className="text-xs text-amber-200">
                {step === 'SELECT'
                  ? 'We found verified KYC details from your other property'
                  : 'Review the details to be copied to ' + targetUnitName}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {step === 'SELECT' ? (
            <>
              {sources.length === 1 ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    We found an existing verified KYC for another property. Would you like to copy the KYC information from this property to fill <span className="font-semibold text-gray-900">{targetUnitName}</span>?
                  </p>

                  {/* Single Source Card */}
                  <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-amber-700" />
                        <span className="font-bold text-gray-900">{selectedSource.unitName || selectedSource.bookingId}</span>
                      </div>
                      <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                        {selectedSource.status || 'Verified'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 flex justify-between pt-1">
                      <span>Project: {selectedSource.projectName}</span>
                      <span>Submitted On: {formatDate(selectedSource.submittedAt)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Select which property KYC you would like to copy data from:
                  </p>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {sources.map((src) => {
                      const isSelected = selectedSourceId === src.workflowId;
                      return (
                        <label
                          key={src.workflowId}
                          onClick={() => setSelectedSourceId(src.workflowId)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? 'bg-amber-50 border-amber-500 shadow-sm ring-1 ring-amber-500'
                              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="kycSource"
                              checked={isSelected}
                              onChange={() => setSelectedSourceId(src.workflowId)}
                              className="text-amber-600 focus:ring-amber-500 h-4 w-4"
                            />
                            <div>
                              <div className="font-semibold text-sm text-gray-900">
                                {src.unitName || src.bookingId}
                              </div>
                              <div className="text-xs text-gray-500">{src.projectName}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-md">
                              {src.status || 'Verified'}
                            </span>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {formatDate(src.submittedAt)}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Fill Manually
                </button>
                <button
                  type="button"
                  onClick={() => setStep('CONFIRM')}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md hover:shadow-lg transition flex items-center space-x-2"
                >
                  <span>{sources.length > 1 ? 'Copy Selected' : 'Copy KYC'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Confirmation Checklist */}
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900">
                    <p className="font-semibold mb-0.5">Copying from: {selectedSource.unitName || selectedSource.bookingId}</p>
                    This will populate your application for <span className="font-bold">{targetUnitName}</span>. You can still edit any detail before submitting.
                  </div>
                </div>

                <div className="text-sm font-semibold text-gray-800">
                  The following information will be copied:
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Personal Details</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Address Details</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Aadhaar Card</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>PAN Details</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Passport (if available)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Bank Details</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Nominee Details</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Communication Details</span>
                  </div>
                  <div className="flex items-center space-x-2 col-span-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Uploaded Documents</span>
                  </div>
                </div>
              </div>

              {/* Confirmation Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep('SELECT')}
                  disabled={copying}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCopy}
                  disabled={copying}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md transition flex items-center space-x-2"
                >
                  {copying ? (
                    <span>Copying...</span>
                  ) : (
                    <>
                      <span>Yes, Copy Everything</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
