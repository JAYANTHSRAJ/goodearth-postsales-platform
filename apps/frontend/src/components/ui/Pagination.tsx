import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrevious: () => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onNext,
  onPrevious,
}) => {
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages || totalPages === 0;

  return (
    <div className="flex items-center justify-between py-4 border-t border-brand-100 dark:border-brand-800">
      {/* Mobile pager UI */}
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={onPrevious}
          disabled={isPrevDisabled}
          className={`relative inline-flex items-center px-4 py-2 border border-brand-200 text-xs font-medium rounded-xl transition-colors ${
            isPrevDisabled
              ? 'text-brand-400 bg-brand-50/10 cursor-not-allowed border-brand-100'
              : 'text-brand-700 bg-white hover:bg-brand-50 dark:text-brand-300 dark:bg-brand-900 dark:hover:bg-brand-800'
          }`}
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={isNextDisabled}
          className={`ml-3 relative inline-flex items-center px-4 py-2 border border-brand-200 text-xs font-medium rounded-xl transition-colors ${
            isNextDisabled
              ? 'text-brand-400 bg-brand-50/10 cursor-not-allowed border-brand-100'
              : 'text-brand-700 bg-white hover:bg-brand-50 dark:text-brand-300 dark:bg-brand-900 dark:hover:bg-brand-800'
          }`}
        >
          Next
        </button>
      </div>

      {/* Desktop pager UI */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div className="text-left">
          <p className="text-xs text-brand-500 dark:text-brand-400">
            Showing Page <span className="font-semibold">{totalPages === 0 ? 0 : currentPage}</span> of{' '}
            <span className="font-semibold">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={onPrevious}
              disabled={isPrevDisabled}
              className={`relative inline-flex items-center px-2.5 py-1.5 rounded-l-xl border border-brand-200 bg-white text-xs font-medium transition-colors ${
                isPrevDisabled
                  ? 'text-brand-300 bg-brand-50/10 cursor-not-allowed border-brand-100 dark:bg-brand-950/20'
                  : 'text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:bg-brand-900 dark:hover:bg-brand-800'
              }`}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled
              className="relative inline-flex items-center px-3.5 py-1.5 border border-brand-200 bg-brand-100 text-xs font-semibold text-brand-900 dark:bg-brand-800 dark:text-white"
            >
              {totalPages === 0 ? 0 : currentPage}
            </button>
            <button
              onClick={onNext}
              disabled={isNextDisabled}
              className={`relative inline-flex items-center px-2.5 py-1.5 rounded-r-xl border border-brand-200 bg-white text-xs font-medium transition-colors ${
                isNextDisabled
                  ? 'text-brand-300 bg-brand-50/10 cursor-not-allowed border-brand-100 dark:bg-brand-950/20'
                  : 'text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:bg-brand-900 dark:hover:bg-brand-800'
              }`}
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
export default Pagination;
