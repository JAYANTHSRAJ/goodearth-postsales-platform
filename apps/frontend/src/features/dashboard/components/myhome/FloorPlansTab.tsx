import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  FileSpreadsheet,
  Calendar,
  User,
  HardDrive,
  FileText,
  AlertCircle,
  RefreshCw,
  Eye,
  Layers,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { clientService, ClientDrawingSummary } from '../../../../services/client.service';
import { Card } from '../../../../components/ui/Card';

export const FloorPlansTab: React.FC = () => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = 1;
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedVersion, setSelectedVersion] = useState<ClientDrawingSummary | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

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

  // Active drawing currently displayed in the viewer
  const activeDrawing = selectedVersion || floorPlansData?.latestDrawing || (allVersions.length > 0 ? allVersions[0] : null);

  const previewUrl = activeDrawing?.previewUrl || floorPlansData?.previewUrl;
  const downloadUrl = activeDrawing?.downloadUrl || floorPlansData?.downloadUrl;
  const isImage = activeDrawing?.mimeType?.startsWith('image/') || activeDrawing?.fileName?.toLowerCase().match(/\.(png|jpg|jpeg)$/);

  // Zoom and rotation handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => {
    setZoom(100);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
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
            <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
            <span className="text-xs font-semibold">Fetching Floor Plans from Zoho CRM Deals...</span>
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
            {(error as Error)?.message || 'A network error occurred while querying Zoho CRM Deal attachments.'}
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

  // Premium Empty State if no floor plan exists in Zoho CRM
  if (!activeDrawing && !previewUrl) {
    return (
      <Card>
        <div className="p-12 sm:p-16 text-center space-y-5 bg-gradient-to-b from-brand-50/30 via-white to-brand-50/20 dark:from-brand-950/20 dark:via-brand-900 dark:to-brand-950/20 rounded-3xl border border-brand-200/70 dark:border-brand-850">
          <div className="h-20 w-20 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto shadow-sm">
            <FileSpreadsheet className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-2xl font-bold text-brand-900 dark:text-white">
              No Floor Plans Available
            </h3>
            <p className="text-sm text-brand-500 dark:text-brand-400 max-w-md mx-auto leading-relaxed">
              Your GoodEarth Relationship Manager will upload approved floor plans here once they are available in your Zoho CRM Deal record.
            </p>
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-brand-100/70 text-brand-700 dark:bg-brand-800 dark:text-brand-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Zoho CRM Single Source Sync Active
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className={`space-y-6 text-left ${
        isFullscreen ? 'fixed inset-0 z-50 bg-brand-950 p-6 overflow-y-auto' : ''
      }`}
    >
      {/* 1. Top Header & Metadata */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-brand-900 p-5 rounded-2xl border border-brand-200/80 dark:border-brand-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              {isImage ? 'Architectural Image' : 'PDF Drawing'}
            </span>
            <span className="text-xs text-brand-400 font-medium">
              Version {activeDrawing?.version || 1}
            </span>
          </div>
          <h2 className="font-serif text-xl font-bold text-brand-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            {activeDrawing?.fileName || 'Approved Floor Plan Drawing'}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-brand-500 dark:text-brand-400 pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-brand-400" />
              Uploaded: {activeDrawing?.uploadedTime ? new Date(activeDrawing.uploadedTime).toLocaleDateString() : 'Recent'}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-brand-400" />
              By: {activeDrawing?.uploadedBy || 'GoodEarth CRM Team'}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="h-3.5 w-3.5 text-brand-400" />
              Size: {formatFileSize(activeDrawing?.fileSize)}
            </span>
          </div>
        </div>

        {/* Top Right Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-100 dark:bg-brand-850 hover:bg-brand-200 dark:hover:bg-brand-800 text-brand-800 dark:text-brand-200 text-xs font-bold transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
            <span>{isFullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
          </button>

          {downloadUrl && (
            <a
              href={downloadUrl}
              download
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-md"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </a>
          )}
        </div>
      </div>

      {/* 2. Main Viewer Grid (Left Panel Revisions + Center Viewer) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Revision Panel / Strip */}
        <div className="lg:col-span-1 space-y-3 bg-white dark:bg-brand-900 p-4 rounded-3xl border border-brand-200/80 dark:border-brand-800 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-brand-900 dark:text-white flex items-center gap-2 border-b border-brand-100 dark:border-brand-850 pb-2">
              <Layers className="h-4 w-4 text-amber-500" />
              Revision History ({allVersions.length})
            </h3>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {allVersions.map((ver, i) => {
                const isActive = (activeDrawing?.id === ver.id) || (!selectedVersion && i === 0);
                const versionLabel = ver.version ? `Floor Plan V${ver.version}` : `Revision V${allVersions.length - i}`;
                const isVerImg = ver.mimeType?.startsWith('image/') || ver.fileName?.toLowerCase().match(/\.(png|jpg|jpeg)$/);

                return (
                  <button
                    key={ver.id || i}
                    onClick={() => setSelectedVersion(ver)}
                    className={`w-full p-3 rounded-2xl text-left border transition-all flex items-start gap-3 ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500/50 text-brand-900 dark:text-white shadow-sm'
                        : 'border-brand-100 dark:border-brand-850 hover:bg-brand-50 dark:hover:bg-brand-850 text-brand-600 dark:text-brand-300'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-amber-500 text-white' : 'bg-brand-100 dark:bg-brand-800 text-brand-500'
                    }`}>
                      {isVerImg ? <ImageIcon className="h-4 w-4" /> : <FileCode className="h-4 w-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-xs font-bold truncate">{versionLabel}</span>
                        {isActive && <Eye className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-brand-400 truncate mt-0.5">{ver.fileName}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-brand-100 dark:border-brand-850 text-[11px] text-brand-400 text-center font-medium">
            Zoho CRM Deal Attachment Stream
          </div>
        </div>

        {/* Center PDF / Image Viewer Area */}
        <div className="lg:col-span-3 relative rounded-3xl border border-brand-200/90 dark:border-brand-800 bg-brand-950 overflow-hidden shadow-xl flex flex-col justify-between">
          {/* Main Display Canvas */}
          <div className="relative min-h-[520px] max-h-[750px] bg-brand-950 flex items-center justify-center overflow-auto p-4">
            {previewUrl ? (
              <div
                className="transition-all duration-300 origin-center flex items-center justify-center w-full h-full"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                }}
              >
                {isImage ? (
                  <img
                    src={previewUrl}
                    alt={activeDrawing?.fileName || 'Floor Plan'}
                    className="max-h-[600px] w-auto object-contain rounded-xl shadow-2xl border border-brand-800 bg-white"
                  />
                ) : (
                  <iframe
                    src={previewUrl}
                    title={activeDrawing?.fileName || 'Floor Plan PDF'}
                    className="w-full min-h-[600px] rounded-xl border border-brand-800 bg-white shadow-2xl"
                  />
                )}
              </div>
            ) : (
              <div className="text-center space-y-3 p-8 text-brand-400">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-brand-500" />
                <p className="text-sm font-semibold">Preview stream unavailable for this drawing.</p>
              </div>
            )}
          </div>

          {/* Bottom Interactive Control Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-brand-900 border-t border-brand-800 text-white text-xs z-10">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                title="Zoom Out (-25%)"
                className="p-2 rounded-xl bg-brand-800 hover:bg-brand-700 text-white transition-colors shadow-sm"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              <span className="font-mono text-amber-400 font-bold text-xs min-w-[50px] text-center">
                {zoom}%
              </span>

              <button
                onClick={handleZoomIn}
                title="Zoom In (+25%)"
                className="p-2 rounded-xl bg-brand-800 hover:bg-brand-700 text-white transition-colors shadow-sm"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <button
                onClick={handleResetZoom}
                title="Fit Width / Reset Zoom"
                className="px-3 py-1.5 rounded-xl bg-brand-800 hover:bg-brand-700 text-white text-xs font-semibold transition-colors ml-1 hidden sm:inline-flex"
              >
                Fit Width
              </button>
            </div>

            {/* Rotation Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRotate}
                title="Rotate 90°"
                className="p-2 rounded-xl bg-brand-800 hover:bg-brand-700 text-white transition-colors shadow-sm flex items-center gap-1.5"
              >
                <RotateCw className="h-4 w-4" />
                <span className="hidden sm:inline">Rotate {rotation}°</span>
              </button>
            </div>

            {/* Page Navigation Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg bg-brand-800 hover:bg-brand-700 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-brand-300 font-medium">
                Page <strong className="text-white">{currentPage}</strong> of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg bg-brand-800 hover:bg-brand-700 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
