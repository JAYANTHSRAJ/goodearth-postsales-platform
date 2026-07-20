import React from 'react';
import { motion } from 'framer-motion';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-6 text-center lg:text-left">
        <h2 className="font-serif text-2xl font-semibold text-brand-900 dark:text-white mb-1">
          Forgot Password
        </h2>
        <p className="text-xs text-brand-500 dark:text-brand-400 font-sans">
          Enter your email address and we'll send you instructions to reset your password
        </p>
      </div>
      <ForgotPasswordForm />
    </motion.div>
  );
};
