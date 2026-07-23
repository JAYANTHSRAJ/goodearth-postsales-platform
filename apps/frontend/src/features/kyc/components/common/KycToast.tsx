import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface KycToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const KycToastContainer: React.FC<KycToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-900/95 text-white border-emerald-700';
      case 'error':
        return 'bg-rose-900/95 text-white border-rose-700';
      case 'warning':
        return 'bg-amber-900/95 text-white border-amber-700';
      default:
        return 'bg-slate-900/95 text-white border-slate-700';
    }
  };

  return (
    <div
      className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-slide-in ${getStyle(
        toast.type
      )}`}
      role="alert"
    >
      <div className="space-y-0.5">
        <p className="text-xs font-bold">{toast.title}</p>
        {toast.message && <p className="text-[11px] opacity-90">{toast.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-3 text-xs opacity-70 hover:opacity-100 focus:outline-none"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
};

export default KycToastContainer;
