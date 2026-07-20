import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { resetPasswordSchema } from '../schemas/reset-password.schema';
import { ResetPasswordInput } from '../types/auth.types';

export const ResetPasswordForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = (_data: ResetPasswordInput) => {
    // No-op placeholder submit action (no console.log)
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="password" className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
          New Password
        </label>
        <input
          id="password"
          type="password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
          className="w-full rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 focus:bg-white dark:border-brand-800 dark:bg-brand-950/20 dark:focus:border-brand-650"
        />
        {errors.password && (
          <p id="password-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
          {...register('confirmPassword')}
          className="w-full rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 focus:bg-white dark:border-brand-800 dark:bg-brand-950/20 dark:focus:border-brand-650"
        />
        {errors.confirmPassword && (
          <p id="confirmPassword-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-brand-700 hover:bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors duration-150 focus:ring-2 focus:ring-brand-500/50 focus:outline-none dark:bg-brand-600 dark:hover:bg-brand-500"
      >
        Update Password
      </button>

      <div className="text-center mt-4">
        <Link to="/login" className="text-xs text-brand-600 hover:underline dark:text-brand-400 font-medium">
          Back to Login
        </Link>
      </div>
    </form>
  );
};
