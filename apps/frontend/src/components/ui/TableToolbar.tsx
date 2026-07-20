import React from 'react';
import { Search, Filter } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface TableToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterValue: string;
  onFilterChange: (value: string) => void;
  filterOptions: FilterOption[];
  filterLabel?: string;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterValue,
  onFilterChange,
  filterOptions,
  filterLabel = 'Filter',
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-brand-100 dark:border-brand-800">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-400">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-brand-200 bg-brand-50/50 pl-10 pr-4 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 focus:bg-white dark:border-brand-800 dark:bg-brand-950/20"
        />
      </div>

      {/* Filter Selector */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-brand-400" />
        <select
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          aria-label={filterLabel}
          className="rounded-xl border border-brand-200 bg-brand-50/50 px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-800 dark:bg-brand-950/20 dark:text-brand-300"
        >
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
export default TableToolbar;
