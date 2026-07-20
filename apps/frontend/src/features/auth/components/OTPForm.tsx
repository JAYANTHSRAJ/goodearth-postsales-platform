import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { otpSchema } from '../schemas/otp.schema';
import { OTPInput } from '../types/auth.types';

export const OTPForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPInput>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit = (_data: OTPInput) => {
    // No-op placeholder submit action (no console.log)
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="code" className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
          Verification Code
        </label>
        <input
          id="code"
          type="text"
          maxLength={6}
          placeholder="000000"
          aria-invalid={!!errors.code}
          aria-describedby={errors.code ? 'code-error' : undefined}
          {...register('code')}
          className="w-full text-center tracking-widest font-mono rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-2.5 text-lg outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 focus:bg-white dark:border-brand-800 dark:bg-brand-950/20 dark:focus:border-brand-650"
        />
        {errors.code && (
          <p id="code-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400 text-center">
            {errors.code.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-brand-700 hover:bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors duration-150 focus:ring-2 focus:ring-brand-500/50 focus:outline-none dark:bg-brand-600 dark:hover:bg-brand-500"
      >
        Verify Code
      </button>

      <div className="text-center mt-4">
        <Link to="/login" className="text-xs text-brand-600 hover:underline dark:text-brand-400 font-medium">
          Back to Login
        </Link>
      </div>
    </form>
  );
};
