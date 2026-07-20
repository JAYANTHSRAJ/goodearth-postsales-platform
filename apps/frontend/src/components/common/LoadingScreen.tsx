import React from 'react';
import { motion } from 'framer-motion';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-brand-50 dark:bg-brand-950 transition-colors duration-200">
      <div className="flex flex-col items-center">
        <motion.div
          animate={{
            scale: [1, 1.2, 1.2, 1, 1],
            rotate: [0, 0, 270, 270, 0],
            borderRadius: ['20%', '20%', '50%', '50%', '20%'],
          }}
          transition={{
            duration: 2,
            ease: 'easeInOut',
            times: [0, 0.2, 0.5, 0.8, 1],
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
          className="h-12 w-12 bg-brand-600 dark:bg-brand-400"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 font-serif text-lg font-medium text-brand-800 dark:text-brand-200"
        >
          GoodEarth Post-Sales
        </motion.p>
        <p className="mt-1 text-xs text-brand-500 dark:text-brand-400 font-sans tracking-wide">
          Loading resources...
        </p>
      </div>
    </div>
  );
};
