import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-accent-700 dark:bg-accent-950/30 dark:text-accent-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-serif text-4xl font-semibold text-brand-900 dark:text-white">
          Page Not Found
        </h1>
        <p className="mt-2 text-sm text-brand-600 dark:text-brand-300 max-w-sm">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-8 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-800 transition-colors dark:bg-brand-600 dark:hover:bg-brand-500"
        >
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
};
