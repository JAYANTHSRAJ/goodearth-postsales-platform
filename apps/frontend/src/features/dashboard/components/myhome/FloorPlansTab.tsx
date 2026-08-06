import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Expand,
  Download,
  FileSpreadsheet,
  Calendar,
  User,
  HardDrive,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { clientService, ClientDrawingSummary } from '../../../../services/client.service';
import { Card } from '../../../../components/ui/Card';

export const FloorPlansTab: React.FC = () => {
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedVersion, setSelectedVersion] = useState<ClientDrawingSummary | null>(null);

  const {
    data: floorPlansData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['clientFloorPlans'],
    queryFn: () => clientService.getFloorPlans(),
  });

  // Extract all available drawing versions (revision history + latest)
  const allVersions: ClientDrawingSummary[] = React.useMemo(() => {
    if (!floorPlansData) return [];
    const list: ClientDrawingSummary[] = [];
    if (floorPlansData.latestDrawing) {
      list.push(floorPlansData.latestDrawing);
    }
    if (floorPlansData.allPreviousVersions && floorPlansData.allPreviousVersions.length > 0) {
      floorPlansData.allPreviousVersions.forEach((prev) => {
        if (!list.some((item) => item.id === prev.id)) {
          list.push(prev);
        }
      });
    }
    return list;
  }, [floorPlansData]);

  // Active drawing currently displayed in the PDF viewer
  const activeDrawing = selectedVersion || floorPlansData?.latestDrawing || (allVersions.length > 0 ? allVersions[0] : null);

  const previewUrl = activeDrawing?.previewUrl || floorPlansData?.previewUrl;
  const downloadUrl = activeDrawing?.downloadUrl || floorPlansData?.downloadUrl;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '1.2 MB';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 rounded-2xl bg-brand-100/50 dark:bg-brand-900/40 animate-pulse border border-brand-200/50 dark:border-brand-850" />
        <div className="h-96 rounded-3xl bg-brand-100/40 dark:bg-brand-900/30 animate-pulse border border-brand-200/50 dark:border-brand-850 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-brand-400">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="text-xs font-semibold">Fetching Floor Plans from WorkDrive...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <div className="p-8 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-brand-900 dark:text-white">Unable to Load Floor Plans</h3>
          <p className="text-xs text-brand-500 dark:text-brand-400 max-w-md mx-auto">
            {(error as Error)?.message || 'A network error occurred while connecting to WorkDrive.'}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand-700 hover:bg-brand-800 text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Connection
          </button>
        </div>
      </Card>
    );
  }

  // Premium Empty State if no floor plan PDF exists in WorkDrive
  if (!activeDrawing && !previewUrl) {
    return (
      <Card>
        <div className="p-12 sm:p-16 text-center space-y-5 bg-gradient-to-b from-brand-50/30 via-white to-brand-50/20 dark:from-brand-950/20 dark:via-brand-900 dark:to-brand-950/20 rounded-3xl border border-brand-200/70 dark:border-brand-850">
          <div className="h-20 w-20 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto shadow-sm">
            <FileSpreadsheet className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-2xl font-bold text-brand-900 dark:text-white">
              No Floor Plans Uploaded Yet
            </h3>
            <p className="text-sm text-brand-500 dark:text-brand-400 max-w-md mx-auto leading-relaxed">
              Your CRM Team will upload architectural drawings and approved floor plans to your WorkDrive folder here.
            </p>
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-brand-100/70 text-brand-700 dark:bg-brand-800 dark:text-brand-300">
              <RefreshCw className="h-3.5 w-3.5" />
              Automated WorkDrive Vault Sync Enabled
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 text-left ${isFullscreen ? 'fixed inset-0 z-50 bg-brand-950 p-6 overflow-y-auto' : ''}`}>
      {/* Top Header & Version Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-brand-900 p-4 rounded-2xl border border-brand-200/80 dark:border-brand-800 shadow-sm">
        <div>
          <h2 className="font-serif text-lg font-bold text-brand-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            {activeDrawing?.fileName || 'Approved Floor Plan Drawing'}
          </h2>
          <p className="text-xs text-brand-500 dark:text-brand-400">
            WorkDrive File ID: <code className="font-mono text-[11px] font-semibold text-brand-700 dark:text-brand-300">{activeDrawing?.id || 'N/A'}</code>
          </p>
        </div>

        {/* Version Switcher (V1, V2, V3...) */}
        {allVersions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-brand-500 dark:text-brand-400">Version:</span>
            <div className="inline-flex rounded-xl p-1 bg-brand-100/70 dark:bg-brand-850 border border-brand-200 dark:border-brand-800">
              {allVersions.map((ver, i) => {
                const isActive = (activeDrawing?.id === ver.id) || (!selectedVersion && i === 0);
                const versionLabel = ver.version ? `Floor Plan V${ver.version}` : `Floor Plan V${allVersions.length - i}`;

                return (
                  <button
                    key={ver.id || i}
                    onClick={() => setSelectedVersion(ver)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-brand-600 hover:text-brand-900 dark:text-brand-300 dark:hover:text-white'
                    }`}
                  >
                    {versionLabel}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Embedded PDF Viewer Container */}
      <div className="relative rounded-3xl border border-brand-200/90 dark:border-brand-800 bg-brand-900 overflow-hidden shadow-xl">
        {/* PDF Viewer Toolbar Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-brand-950/90 border-b border-brand-800 text-white text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono text-amber-400 font-bold text-[11px] uppercase tracking-wider">
              PDF Viewer
            </span>
            <span className="text-brand-500">|</span>
            <span className="text-brand-300 font-semibold">{zoom}% Zoom</span>
          </div>

          {/* Controls: Zoom In, Zoom Out, Reset, Fullscreen, Download */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <button
              onClick={handleResetZoom}
              title="Fit Width"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors hidden sm:inline-flex"
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Expand className="h-4 w-4" />
            </button>

            {downloadUrl && (
              <a
                href={downloadUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                title="Download PDF"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 font-bold text-white transition-colors shadow-sm ml-2"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}
          </div>
        </div>

        {/* Embedded Viewer Canvas */}
        <div className="relative w-full h-[550px] bg-brand-950 flex items-center justify-center overflow-auto p-4">
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="w-full h-full transition-transform duration-200"
          >
            {previewUrl ? (
              <iframe
                src={previewUrl}
                title="WorkDrive Floor Plan Viewer"
                className="w-full h-full rounded-xl border border-brand-800 shadow-2xl bg-white"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white space-y-3 p-8">
                <FileText className="h-16 w-16 text-amber-500 opacity-80" />
                <p className="text-sm font-semibold">Floor Plan Drawing Loaded</p>
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-amber-500 font-bold text-xs text-white shadow-lg"
                  >
                    Open Document Link
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Metadata Details Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-brand-900 border border-brand-200/80 dark:border-brand-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-brand-400 uppercase">Upload Date</span>
            <span className="text-sm font-bold text-brand-900 dark:text-white">
              {activeDrawing?.uploadedAt ? new Date(activeDrawing.uploadedAt).toLocaleDateString() : 'Recent'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-brand-900 border border-brand-200/80 dark:border-brand-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-brand-400 uppercase">File Size</span>
            <span className="text-sm font-bold text-brand-900 dark:text-white">
              {formatFileSize(activeDrawing?.fileSize)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-brand-900 border border-brand-200/80 dark:border-brand-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-brand-400 uppercase">Uploaded By</span>
            <span className="text-sm font-bold text-brand-900 dark:text-white">
              {activeDrawing?.uploadedBy || 'GoodEarth Design Team'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
