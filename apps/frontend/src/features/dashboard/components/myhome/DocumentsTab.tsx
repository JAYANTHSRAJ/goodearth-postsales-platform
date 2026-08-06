import React from 'react';
import { FolderGit2, Clock, Lock } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';

export const DocumentsTab: React.FC = () => {
  return (
    <Card>
      <div className="p-12 sm:p-16 text-center space-y-5 bg-gradient-to-b from-brand-50/30 via-white to-brand-50/20 dark:from-brand-950/20 dark:via-brand-900 dark:to-brand-950/20 rounded-3xl border border-brand-200/70 dark:border-brand-850">
        <div className="h-20 w-20 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto shadow-sm">
          <FolderGit2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5" />
            Coming Soon
          </div>
          <h3 className="font-serif text-2xl font-bold text-brand-900 dark:text-white">
            Documents Repository
          </h3>
          <p className="text-sm text-brand-500 dark:text-brand-400 max-w-md mx-auto leading-relaxed">
            This module will later integrate directly with your dedicated WorkDrive Documents vault for legal deeds, agreement contracts, and receipts.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-brand-100/70 text-brand-700 dark:bg-brand-800 dark:text-brand-300">
            <Lock className="h-3.5 w-3.5" />
            WorkDrive Vault Security Integration Scheduled
          </span>
        </div>
      </div>
    </Card>
  );
};
