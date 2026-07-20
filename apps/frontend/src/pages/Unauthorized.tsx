import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="mt-6 font-serif text-3xl font-semibold text-brand-900 dark:text-white">
        Access Denied
      </h1>
      <p className="mt-2 text-sm text-brand-600 dark:text-brand-300 max-w-sm">
        You do not have the permissions required to access this section of the platform.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-800 transition-colors dark:bg-brand-600 dark:hover:bg-brand-500"
      >
        Back to Dashboard
      </Link>
    </div>
  );
};
