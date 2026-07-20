import React from 'react';
import { motion } from 'framer-motion';
import { ResetPasswordForm } from '../components/ResetPasswordForm';

export const ResetPasswordPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-6 text-center lg:text-left">
        <h2 className="font-serif text-2xl font-semibold text-brand-900 dark:text-white mb-1">
          Reset Password
        </h2>
        <p className="text-xs text-brand-500 dark:text-brand-400 font-sans">
          Create a new strong password for your account
        </p>
      </div>
      <ResetPasswordForm />
    </motion.div>
  );
};
