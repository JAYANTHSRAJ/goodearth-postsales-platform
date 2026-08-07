import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { Shield, Check, X, AlertCircle, Lock, ArrowLeft } from 'lucide-react';

export const ResetPasswordForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenMessage, setTokenMessage] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password requirements checks
  const meetsMinLength = password.length >= 8;
  const meetsUppercase = /[A-Z]/.test(password);
  const meetsLowercase = /[a-z]/.test(password);
  const meetsNumber = /[0-9]/.test(password);
  const meetsSpecial = /[!@#$%^&*()_+\-=[\]{};':",./<>?]/.test(password);
  const passwordsMatch = password === confirmPassword && password !== '';
  const isPasswordValid = meetsMinLength && meetsUppercase && meetsLowercase && meetsNumber && meetsSpecial;

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidating(false);
        setTokenValid(false);
        setTokenMessage('No password reset token provided.');
        return;
      }

      try {
        const response = await api.get<{ valid: boolean; email?: string; fullName?: string; message?: string }>(
          `/auth/reset-password/validate?token=${encodeURIComponent(token)}`
        );
        setTokenValid(response.valid);
        setTokenMessage(response.message || null);
      } catch (err: any) {
        setTokenValid(false);
        setTokenMessage(err?.response?.data?.message || err?.message || 'Invalid or expired password reset link.');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid || !passwordsMatch || !token) return;

    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: password,
        confirmPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="max-w-md w-full mx-auto text-center py-8 space-y-3">
        <div className="animate-spin mx-auto h-8 w-8 border-2 border-brand-600 border-t-transparent rounded-full"></div>
        <p className="text-xs text-brand-500 dark:text-brand-400">Verifying password reset link...</p>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="max-w-md w-full mx-auto text-center space-y-6">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-semibold text-brand-900 dark:text-white">Invalid or Expired Link</h3>
          <p className="text-xs text-brand-600 dark:text-brand-300 mt-2 leading-relaxed">
            {tokenMessage || 'This password reset link is invalid or has expired. Password reset links are valid for 30 minutes.'}
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <Link
            to="/forgot-password"
            className="w-full inline-flex items-center justify-center rounded-xl bg-brand-700 hover:bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors duration-150 dark:bg-brand-600 dark:hover:bg-brand-500 cursor-pointer"
          >
            Request New Password Reset Link
          </Link>
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline py-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md w-full mx-auto text-center space-y-6">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">
          <Shield className="h-7 w-7" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-semibold text-brand-900 dark:text-white">Password Reset Successfully</h3>
          <p className="text-xs text-brand-600 dark:text-brand-300 mt-2 leading-relaxed">
            Your password has been updated. All active sessions have been logged out. You can now log in with your new password.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center rounded-xl bg-brand-700 hover:bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors duration-150 dark:bg-brand-600 dark:hover:bg-brand-500 cursor-pointer"
          >
            Log In to Portal
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
          <label htmlFor="password" className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters with upper, lower, digit, symbol"
              className="w-full rounded-xl border border-brand-200 bg-brand-50/50 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 focus:bg-white dark:border-brand-800 dark:bg-brand-950/20 dark:focus:border-brand-650"
            />
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-brand-400 dark:text-brand-500" />
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              className="w-full rounded-xl border border-brand-200 bg-brand-50/50 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 focus:bg-white dark:border-brand-800 dark:bg-brand-950/20 dark:focus:border-brand-650"
            />
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-brand-400 dark:text-brand-500" />
          </div>
        </div>

        {/* Password Requirements Checklist */}
        <div className="p-3 bg-brand-50/30 border border-brand-100 rounded-2xl dark:bg-brand-950/10 dark:border-brand-850 space-y-1.5 text-[11px] text-brand-500 dark:text-brand-400">
          <span className="font-semibold text-brand-700 dark:text-brand-300 block mb-1">Password Requirements:</span>
          <div className="flex items-center gap-1.5">
            {meetsMinLength ? <Check className="h-3.5 w-3.5 text-green-600" /> : <X className="h-3.5 w-3.5 text-red-500" />}
            <span>At least 8 characters</span>
          </div>
          <div className="flex items-center gap-1.5">
            {meetsUppercase ? <Check className="h-3.5 w-3.5 text-green-600" /> : <X className="h-3.5 w-3.5 text-red-500" />}
            <span>At least one uppercase letter (A-Z)</span>
          </div>
          <div className="flex items-center gap-1.5">
            {meetsLowercase ? <Check className="h-3.5 w-3.5 text-green-600" /> : <X className="h-3.5 w-3.5 text-red-500" />}
            <span>At least one lowercase letter (a-z)</span>
          </div>
          <div className="flex items-center gap-1.5">
            {meetsNumber ? <Check className="h-3.5 w-3.5 text-green-600" /> : <X className="h-3.5 w-3.5 text-red-500" />}
            <span>At least one number (0-9)</span>
          </div>
          <div className="flex items-center gap-1.5">
            {meetsSpecial ? <Check className="h-3.5 w-3.5 text-green-600" /> : <X className="h-3.5 w-3.5 text-red-500" />}
            <span>At least one special character (!@#$%^&*)</span>
          </div>
          <div className="flex items-center gap-1.5">
            {passwordsMatch ? <Check className="h-3.5 w-3.5 text-green-600" /> : <X className="h-3.5 w-3.5 text-red-500" />}
            <span>Passwords match</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isPasswordValid || !passwordsMatch}
          className="w-full rounded-xl bg-brand-700 hover:bg-brand-800 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors duration-150 focus:ring-2 focus:ring-brand-500/50 focus:outline-none dark:bg-brand-600 dark:hover:bg-brand-500 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? 'Resetting Password...' : 'Reset My Password'}
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
