import React from 'react';
import { Highlighter, Edit3, ClipboardCheck, FolderOpen } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { TableToolbar } from '../../../components/ui/TableToolbar';
import { Pagination } from '../../../components/ui/Pagination';
import { AnnotationsTable } from '../components/AnnotationsTable';
import { useAnnotations } from '../hooks/useAnnotations';

export const AnnotationsPage: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    filteredAnnotations,
    isLoading,
    stats,
  } = useAnnotations();

  const handleNext = () => {};
  const handlePrevious = () => {};

  const filterOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'drawing', label: 'Drawing' },
    { value: 'highlight', label: 'Highlight' },
    { value: 'text', label: 'Text' },
    { value: 'stamp', label: 'Stamp' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-left">
        <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white">
          Document Annotations
        </h1>
        <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
          Collaborative drawing overlays, highlights, and marks on blueprints and handoff packages
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard
          title="Total Annotations"
          value={String(stats.totalAnnotations)}
          icon={Highlighter}
          badge={<StatusBadge label="Synced" type="info" />}
        />
        <StatCard
          title="Active Notes"
          value={String(stats.activeCount)}
          icon={Edit3}
          badge={<StatusBadge label="Active" type="success" />}
        />
        <StatCard
          title="Resolved Notes"
          value={String(stats.resolvedCount)}
          icon={ClipboardCheck}
          badge={<StatusBadge label="Completed" type="success" />}
        />
      </div>

      {/* Annotations Data Segment */}
      <Card>
        <TableToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search annotations..."
          filterValue={typeFilter}
          onFilterChange={setTypeFilter}
          filterOptions={filterOptions}
          filterLabel="Annotation Type Filter"
        />

        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <span className="text-sm text-brand-500 font-sans tracking-wide">Loading Annotations...</span>
          </div>
        ) : filteredAnnotations.length > 0 ? (
          <div className="mt-4 space-y-4">
            <AnnotationsTable annotations={filteredAnnotations} />
            <Pagination
              currentPage={1}
              totalPages={1}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="No annotations found"
              description="No records match the active search queries or annotation type filters."
              icon={FolderOpen}
            />
          </div>
        )}
      </Card>
    </div>
  );
};
export default AnnotationsPage;
