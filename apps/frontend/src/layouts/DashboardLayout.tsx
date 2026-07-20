import { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardLayout: FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-50 text-brand-950 dark:bg-brand-950 dark:text-brand-50 transition-colors duration-200">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main app panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Content container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="mx-auto max-w-7xl"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
