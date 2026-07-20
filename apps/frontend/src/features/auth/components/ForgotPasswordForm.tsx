import React, { useState } from 'react';
import { api } from '../../../services/api';
import { Link } from 'react-router-dom';
import { Shield, Check, X, AlertCircle } from 'lucide-react';

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: OTP & New Password, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password requirements checks
  const meetsMinLength = password.length >= 8;
  const meetsUppercase = /[A-Z]/.test(password);
  const meetsLowercase = /[a-z]/.test(password);
  const meetsNumber = /[0-9]/.test(password);
  const meetsSpecial = /[!@#$%^&*()_+\-=[\]{};':",./<>?]/.test(password);
  const passwordsMatch = password === confirmPassword && password !== '';
  const isPasswordValid = meetsMinLength && meetsUppercase && meetsLowercase && meetsNumber && meetsSpecial;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/password-reset/request-otp', { email });
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !isPasswordValid || !passwordsMatch) return;

    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/password-reset/complete', { email, otp, password });
      setStep(3);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-400 font-medium">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
              Account Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email address"
              className="w-full rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 focus:bg-white dark:border-brand-800 dark:bg-brand-950/20 dark:focus:border-brand-650"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-700 hover:bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors duration-150 focus:ring-2 focus:ring-brand-500/50 focus:outline-none dark:bg-brand-600 dark:hover:bg-brand-500 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Sending OTP...' : 'Send Password Reset OTP'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
              Reset Code (6-Digit OTP)
            </label>
            <input
              id="otp"
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit OTP"
              className="w-full rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-2.5 text-sm font-mono tracking-widest text-center outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 focus:bg-white dark:border-brand-800 dark:bg-brand-950/20 dark:focus:border-brand-650"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters with upper, lower, digit, symbol"
              className="w-full rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 focus:bg-white dark:border-brand-800 dark:bg-brand-950/20 dark:focus:border-brand-650"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              className="w-full rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 focus:bg-white dark:border-brand-800 dark:bg-brand-950/20 dark:focus:border-brand-650"
            />
          </div>

          {/* Password Validation Requirements Panel */}
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
              <span>At least one digit (0-9)</span>
            </div>
            <div className="flex items-center gap-1.5">
              {meetsSpecial ? <Check className="h-3.5 w-3.5 text-green-600" /> : <X className="h-3.5 w-3.5 text-red-500" />}
              <span>At least one special symbol (!@#$%^&*)</span>
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

          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-brand-600 hover:underline dark:text-brand-400 font-medium cursor-pointer"
            >
              Change Email Address
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-950/20 flex items-center justify-center text-green-600 border border-green-200">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-brand-900 dark:text-white">Password Reset Successfully</h3>
            <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">
              Your password has been successfully reset. You can now log in.
            </p>
          </div>
          <Link
            to="/login"
            className="w-full block rounded-xl bg-brand-700 hover:bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors duration-150 dark:bg-brand-600 dark:hover:bg-brand-500 cursor-pointer"
          >
            Log In to Portal
          </Link>
        </div>
      )}

      <div className="text-center mt-6">
        <Link to="/login" className="text-xs text-brand-600 hover:underline dark:text-brand-400 font-medium">
          Back to Login
        </Link>
      </div>
    </div>
  );
};
