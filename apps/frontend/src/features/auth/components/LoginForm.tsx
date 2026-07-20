import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema } from '../schemas/login.schema';
import { LoginInput } from '../types/auth.types';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../services/api';

export const LoginForm: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: {
          id: string;
          email: string;
          fullName: string;
          role: string;
          onboardingStage?: string;
        };
      }>('/auth/login', {
        email: data.email,
        password: data.password,
        deviceName: 'Web Browser',
      });

      const roleMap = (role: string): string => {
        switch (role) {
          case 'SUPER_ADMIN':
            return 'admin';
          case 'CLIENT':
            return 'buyer';
          default:
            return 'employee';
        }
      };

      const mappedUser = {
        id: response.user.id,
        name: response.user.fullName,
        email: response.user.email,
        role: roleMap(response.user.role),
        onboardingStage: response.user.onboardingStage,
      };

      login(response.accessToken, response.refreshToken, mappedUser);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {error && (
        <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          disabled={isLoading}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
          className="w-full rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 focus:bg-white dark:border-brand-800 dark:bg-brand-950/20 dark:focus:border-brand-650 disabled:opacity-50"
        />
        {errors.email && (
          <p id="email-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="password" className="block text-xs font-semibold text-brand-700 dark:text-brand-300">
            Password
          </label>
          <Link
            to="/forgot-password"
            className="text-xs text-accent-600 hover:underline dark:text-accent-400 font-medium"
          >
            Forgot Password?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          disabled={isLoading}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
          className="w-full rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 focus:bg-white dark:border-brand-800 dark:bg-brand-950/20 dark:focus:border-brand-650 disabled:opacity-50"
        />
        {errors.password && (
          <p id="password-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex items-center">
        <input
          id="rememberMe"
          type="checkbox"
          disabled={isLoading}
          {...register('rememberMe')}
          className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
        />
        <label htmlFor="rememberMe" className="ml-2 text-xs text-brand-600 dark:text-brand-400 font-medium">
          Remember me for 30 days
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-brand-700 hover:bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors duration-150 focus:ring-2 focus:ring-brand-500/50 focus:outline-none dark:bg-brand-600 dark:hover:bg-brand-500 disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Signing In...
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
};
