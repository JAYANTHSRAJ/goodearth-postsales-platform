import { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export const AuthLayout: FC = () => {
  return (
    <div className="flex min-h-screen w-screen bg-brand-50 dark:bg-brand-950 font-sans transition-colors duration-200">
      {/* Left side: branding/aesthetic panel */}
      <div className="relative hidden w-1/2 bg-brand-900 px-12 py-16 dark:bg-brand-950 lg:flex lg:flex-col lg:justify-between overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-900 to-accent-950/20 opacity-90" />

        {/* Abstract design elements */}
        <div className="absolute -left-1/4 -top-1/4 h-[700px] w-[700px] rounded-full border border-brand-800/20" />
        <div className="absolute -left-1/3 -top-1/3 h-[900px] w-[900px] rounded-full border border-brand-700/10" />

        <div className="relative z-10">
          <span className="font-serif text-2xl font-semibold tracking-wider text-white">
            GoodEarth
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-4xl font-light leading-tight text-white"
          >
            A reliable post-sales journey, built with sustainability in mind.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-sm text-brand-300 font-sans"
          >
            Empowering GoodEarth teams and buyers to track, manage, and complete unit handovers
            seamlessly and transparently.
          </motion.p>
        </div>

        <div className="relative z-10 text-xs text-brand-400 font-medium">
          &copy; {new Date().getFullYear()} GoodEarth. All rights reserved.
        </div>
      </div>

      {/* Right side: content wrapper */}
      <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 block text-center lg:hidden">
            <span className="font-serif text-2xl font-semibold tracking-wider text-brand-900 dark:text-white">
              GoodEarth
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-brand-200/60 bg-white p-8 shadow-xl dark:border-brand-800/40 dark:bg-brand-900/60 dark:backdrop-blur-md"
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
