import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Search,
  Download,
  Eye,
  Calendar,
  User,
  AlertCircle,
  RefreshCw,
  X,
  Maximize2,
  FileCode,
  Image as ImageIcon,
  FileSpreadsheet,
  Archive,
  ArrowUpDown,
  File,
} from 'lucide-react';
import { clientService, ClientAttachment } from '../../../../services/client.service';
import { Card } from '../../../../components/ui/Card';

const CATEGORIES = [
  { id: 'ALL', label: 'All Documents' },
  { id: 'AGREEMENT', label: 'Agreements' },
  { id: 'LEGAL', label: 'Legal & RERA' },
  { id: 'PAYMENT', label: 'Payments & Invoices' },
  { id: 'WARRANTY', label: 'Warranty & Manuals' },
  { id: 'PLAN', label: 'Architectural & Plans' },
  { id: 'OTHER', label: 'Other Documents' },
];

export const DocumentsTab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('NEWEST');

  // Preview Modal State
  const [activePreviewDoc, setActivePreviewDoc] = useState<ClientAttachment | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Query attachments directly from Zoho CRM single source of truth
  const {
    data: attachments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['clientAttachments', selectedCategory, sortBy],
    queryFn: () => clientService.getAttachments(selectedCategory, undefined, sortBy),
  });

  // Client-side search and filtering
  const filteredAttachments = useMemo(() => {
    return attachments.filter((doc) => {
      const matchCategory =
        selectedCategory === 'ALL' || doc.category?.toUpperCase() === selectedCategory.toUpperCase();
      const matchSearch =
        !searchQuery.trim() ||
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fileType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [attachments, selectedCategory, searchQuery]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '1.2 MB';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string, isPreviewable: boolean) => {
    if (isPreviewable) {
      if (fileType.includes('Image')) return <ImageIcon className="h-5 w-5 text-amber-500" />;
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (fileType.includes('Word')) return <FileCode className="h-5 w-5 text-blue-500" />;
    if (fileType.includes('Excel')) return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    if (fileType.includes('Archive')) return <Archive className="h-5 w-5 text-purple-500" />;
    return <File className="h-5 w-5 text-brand-400" />;
  };

  const formatCategoryBadge = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case 'AGREEMENT':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'LEGAL':
        return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30';
      case 'PAYMENT':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'WARRANTY':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'PLAN':
        return 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-300 border-brand-200 dark:border-brand-700';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 rounded-2xl bg-brand-100/50 dark:bg-brand-900 animate-pulse border border-brand-200/50 dark:border-brand-850" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 rounded-3xl bg-brand-100/40 dark:bg-brand-900 animate-pulse border border-brand-200/50 dark:border-brand-850"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <div className="p-8 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-brand-900 dark:text-white">
            Unable to Load Documents
          </h3>
          <p className="text-xs text-brand-500 dark:text-brand-400 max-w-md mx-auto">
            {(error as Error)?.message ||
              'A network error occurred while querying Zoho CRM Deal attachments.'}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-md"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Connection
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* 1. Top Controls: Search Bar & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-brand-900 p-5 rounded-2xl border border-brand-200/80 dark:border-brand-800 shadow-sm">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by name, category, or file type..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-850 text-xs text-brand-900 dark:text-white focus:outline-none focus:border-amber-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-900 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-brand-400 shrink-0" />
          <span className="text-xs font-bold text-brand-500 dark:text-brand-400 shrink-0">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-brand-200 dark:border-brand-800 bg-white dark:bg-brand-850 text-xs font-semibold text-brand-900 dark:text-white focus:outline-none focus:border-amber-500"
          >
            <option value="NEWEST">Newest Uploads First</option>
            <option value="OLDEST">Oldest Uploads First</option>
            <option value="A-Z">Alphabetical A-Z</option>
          </select>
        </div>
      </div>

      {/* 2. Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white dark:bg-brand-900 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-850'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Document Cards Grid */}
      {filteredAttachments.length === 0 ? (
        /* Empty State */
        <Card>
          <div className="p-12 text-center space-y-4 bg-brand-50/30 dark:bg-brand-950/20 rounded-3xl border border-brand-200/60 dark:border-brand-850">
            <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
              <FileText className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif text-lg font-bold text-brand-900 dark:text-white">
                No Documents Available
              </h4>
              <p className="text-xs text-brand-500 dark:text-brand-400 max-w-md mx-auto">
                No attachments found matching the selected category or search filter in your Zoho CRM Deal record.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAttachments.map((doc) => (
            <Card
              key={doc.id || doc.attachmentId}
              className="p-5 rounded-3xl border border-brand-200/80 dark:border-brand-800 bg-white dark:bg-brand-900 flex flex-col justify-between space-y-4 hover:shadow-lg transition-all group"
            >
              <div className="space-y-3">
                {/* Header: Icon & Category Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-brand-50 dark:bg-brand-850 border border-brand-200/50 dark:border-brand-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {getFileIcon(doc.fileType, doc.isPreviewable)}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${formatCategoryBadge(
                      doc.category
                    )}`}
                  >
                    {doc.category}
                  </span>
                </div>

                {/* Title & Metadata */}
                <div className="space-y-1">
                  <h4
                    title={doc.fileName}
                    className="font-serif text-sm font-bold text-brand-900 dark:text-white truncate"
                  >
                    {doc.fileName}
                  </h4>
                  <p className="text-[11px] text-brand-400 flex items-center gap-2">
                    <span>{doc.fileType}</span>
                    <span>•</span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-brand-100 dark:border-brand-850 flex flex-wrap items-center justify-between gap-2 text-[11px] text-brand-500 dark:text-brand-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-brand-400" />
                    {doc.uploadedTime ? new Date(doc.uploadedTime).toLocaleDateString() : 'Recent'}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-brand-400" />
                    {doc.uploadedBy || 'GoodEarth CRM'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {doc.isPreviewable ? (
                  <button
                    onClick={() => setActivePreviewDoc(doc)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-100 dark:bg-brand-850 hover:bg-brand-200 dark:hover:bg-brand-800 text-brand-800 dark:text-brand-200 text-xs font-bold transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-amber-500" />
                    <span>Preview</span>
                  </button>
                ) : (
                  <span className="flex-1 py-2 px-3 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-400 text-[11px] font-semibold text-center truncate">
                    Download Only
                  </span>
                )}

                <a
                  href={doc.downloadUrl}
                  download
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 4. Document Preview Modal */}
      {activePreviewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div
            className={`bg-brand-950 text-white w-full rounded-3xl border border-brand-800 shadow-2xl flex flex-col justify-between overflow-hidden transition-all ${
              isFullscreen ? 'fixed inset-0 z-50 rounded-none p-4' : 'max-w-4xl max-h-[90vh]'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-brand-900 border-b border-brand-800">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand-800 flex items-center justify-center">
                  {getFileIcon(activePreviewDoc.fileType, activePreviewDoc.isPreviewable)}
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                    {activePreviewDoc.fileName}
                  </h3>
                  <p className="text-[11px] text-brand-400">
                    {activePreviewDoc.fileType} • {formatFileSize(activePreviewDoc.fileSize)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-xl bg-brand-800 hover:bg-brand-700 text-white transition-colors"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <a
                  href={activePreviewDoc.downloadUrl}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  onClick={() => setActivePreviewDoc(null)}
                  className="p-2 rounded-xl bg-brand-800 hover:bg-brand-700 text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Viewer Body */}
            <div className="relative min-h-[500px] flex-1 bg-brand-950 flex items-center justify-center p-4 overflow-auto">
              {activePreviewDoc.isPreviewable ? (
                activePreviewDoc.mimeType.startsWith('image/') ? (
                  <img
                    src={activePreviewDoc.previewUrl}
                    alt={activePreviewDoc.fileName}
                    className="max-h-[650px] w-auto object-contain rounded-xl shadow-2xl border border-brand-800 bg-white"
                  />
                ) : (
                  <iframe
                    src={activePreviewDoc.previewUrl}
                    title={activePreviewDoc.fileName}
                    className="w-full h-[650px] rounded-xl border border-brand-800 bg-white shadow-2xl"
                  />
                )
              ) : (
                /* Non-previewable file card */
                <div className="text-center space-y-4 p-8 max-w-sm bg-brand-900 rounded-3xl border border-brand-800">
                  <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                    <File className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-serif text-base font-bold text-white">
                      Inline Preview Unavailable
                    </h4>
                    <p className="text-xs text-brand-400">
                      This file format ({activePreviewDoc.fileType}) does not support inline browser preview. Download the file to view its contents.
                    </p>
                  </div>
                  <a
                    href={activePreviewDoc.downloadUrl}
                    download
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md w-full justify-center"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download File ({formatFileSize(activePreviewDoc.fileSize)})</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
