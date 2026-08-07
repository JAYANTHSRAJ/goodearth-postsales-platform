import React, { useState } from 'react';
import { api } from '../../../services/api';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md w-full mx-auto text-center space-y-6">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-semibold text-brand-900 dark:text-white">Check Your Email</h3>
          <p className="text-xs text-brand-600 dark:text-brand-300 mt-2 leading-relaxed">
            If an account exists for <span className="font-semibold text-brand-900 dark:text-white">{email}</span>, a password reset link has been sent. Please check your inbox and click the link within 30 minutes.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 hover:bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors duration-150 dark:bg-brand-600 dark:hover:bg-brand-500 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-400 font-medium">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
            Account Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email address"
              className="w-full rounded-xl border border-brand-200 bg-brand-50/50 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 focus:bg-white dark:border-brand-800 dark:bg-brand-950/20 dark:focus:border-brand-650"
            />
            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-brand-400 dark:text-brand-500" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full rounded-xl bg-brand-700 hover:bg-brand-800 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors duration-150 focus:ring-2 focus:ring-brand-500/50 focus:outline-none dark:bg-brand-600 dark:hover:bg-brand-500 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
        </button>
      </form>

      <div className="text-center mt-6">
        <Link to="/login" className="text-xs text-brand-600 hover:underline dark:text-brand-400 font-medium flex items-center justify-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Login
        </Link>
      </div>
    </div>
  );
};
