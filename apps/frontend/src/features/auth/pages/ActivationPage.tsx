import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import { Shield, Check, X, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

export const ActivationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1: Password Form, 2: Success
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Resend activation state
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  // Password requirements checks
  const meetsMinLength = password.length >= 8;
  const meetsUppercase = /[A-Z]/.test(password);
  const meetsLowercase = /[a-z]/.test(password);
  const meetsNumber = /[0-9]/.test(password);
  const meetsSpecial = /[!@#$%^&*()_+\-=[\]{};':",./<>?]/.test(password);
  const passwordsMatch = password === confirmPassword && password !== '';
  const isPasswordValid = meetsMinLength && meetsUppercase && meetsLowercase && meetsNumber && meetsSpecial;

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerificationError('Missing activation token. Please check your email link.');
        setVerifying(false);
        return;
      }

      try {
        const response = await api.get(`/auth/activate?token=${token}`) as any;
        const name = response?.data?.name || response?.name || 'Homeowner';
        const email = response?.data?.email || response?.email || '';
        setUserName(name);
        setUserEmail(email);
        setVerifying(false);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 410) {
          setIsExpired(true);
          setVerificationError('This activation link has expired. Links expire after 24 hours.');
        } else {
          setVerificationError(err?.response?.data?.message || 'Activation link is invalid or has already been used.');
        }
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleCompleteActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !isPasswordValid || !passwordsMatch) return;

    setLoading(true);
    setActionError(null);
    try {
      await api.post('/auth/activate', { token, password });
      setStep(2);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || 'Activation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = resendEmail || userEmail;
    if (!emailToUse) return;

    setResendLoading(true);
    setResendError(null);
    setResendSuccess(false);
    try {
      await api.post('/auth/resend-activation', { email: emailToUse });
      setResendSuccess(true);
    } catch (err: any) {
      setResendError(err?.response?.data?.message || 'Failed to resend activation link.');
    } finally {
      setResendLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-brand-400" />
        <p className="text-sm font-medium text-brand-700 dark:text-brand-300">Verifying activation link...</p>
      </div>
    );
  }

  if (verificationError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-auto p-6 bg-white dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900 rounded-3xl shadow-xl space-y-6"
      >
        <div className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-600 border border-red-200 dark:border-red-900">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-brand-900 dark:text-white">Activation Failed</h3>
            <p className="text-xs text-brand-500 dark:text-brand-400 mt-2">
              {verificationError}
            </p>
          </div>
        </div>

        {/* Resend panel */}
        {(isExpired || userEmail) && (
          <div className="p-4 bg-brand-50/50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-850 rounded-2xl space-y-3">
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-300 block">
              Request a New Link
            </span>
            <p className="text-[11px] text-brand-500 dark:text-brand-400">
              Enter your email address below to receive a new secure activation link.
            </p>
            {resendSuccess ? (
              <div className="p-3 bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-[11px] text-green-700 dark:text-green-400 rounded-xl flex gap-2 font-medium">
                <Check className="h-4 w-4 shrink-0" />
                <span>New activation email has been sent! Check your inbox.</span>
              </div>
            ) : (
              <form onSubmit={handleResendActivation} className="space-y-3">
                {!userEmail && (
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-800 dark:bg-brand-950/20"
                  />
                )}
                {resendError && (
                  <div className="text-[11px] text-red-600 font-medium">
                    {resendError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full rounded-xl bg-brand-700 hover:bg-brand-800 disabled:opacity-50 px-3 py-2 text-xs font-semibold text-white transition-colors duration-150 cursor-pointer flex justify-center items-center gap-1.5"
                >
                  {resendLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Resend Link
                </button>
              </form>
            )}
          </div>
        )}

        <div className="text-center">
          <Link to="/login" className="text-xs text-brand-600 hover:underline dark:text-brand-400 font-medium font-sans">
            Back to Login
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="max-w-md w-full mx-auto"
    >
      <div className="mb-6 text-center lg:text-left">
        <h2 className="font-serif text-2xl font-semibold text-brand-900 dark:text-white mb-1">
          Activate Your Account
        </h2>
        <p className="text-xs text-brand-500 dark:text-brand-400 font-sans">
          GoodEarth Post-Sales Customer Portal
        </p>
      </div>

      {actionError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-400 font-medium">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleCompleteActivation} className="space-y-4">
          <div className="p-4 bg-brand-50/40 dark:bg-brand-950/10 border border-brand-100 dark:border-brand-850 rounded-2xl text-xs text-brand-700 dark:text-brand-300">
            Welcome <span className="font-semibold">{userName}</span>! Please create a secure password to activate your homeowner account for <span className="font-semibold">{userEmail}</span>.
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
              Create Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters with upper, lower, digit, symbol"
                className="w-full rounded-xl border border-brand-200 bg-brand-50/50 px-4 pr-10 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 focus:bg-white dark:border-brand-800 dark:bg-brand-950/20 dark:focus:border-brand-650"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full rounded-xl border border-brand-200 bg-brand-50/50 px-4 pr-10 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 focus:bg-white dark:border-brand-800 dark:bg-brand-950/20 dark:focus:border-brand-650"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
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
            {loading ? 'Activating Account...' : 'Activate My Account'}
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="text-center space-y-4 bg-white dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900 p-6 rounded-3xl shadow-xl">
          <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-950/20 flex items-center justify-center text-green-600 border border-green-200">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-brand-900 dark:text-white">Activation Complete</h3>
            <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">
              Your homeowner portal account is now active and secure.
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
    </motion.div>
  );
};
