import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, Layers } from 'lucide-react';

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

interface NativePdfCanvasViewerProps {
  pdfUrl?: string;
  pdfData?: ArrayBuffer | Uint8Array;
  fileName?: string;
  className?: string;
}

export const NativePdfCanvasViewer: React.FC<NativePdfCanvasViewerProps> = ({
  pdfUrl,
  pdfData,
  fileName = 'Offer_Letter.pdf',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const renderTasksRef = useRef<(pdfjsLib.RenderTask | null)[]>([]);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState<number>(0);

  // Clean up PDF.js document and active render tasks on unmount
  useEffect(() => {
    return () => {
      renderTasksRef.current.forEach((task) => {
        if (task) {
          try {
            task.cancel();
          } catch {
            // Ignore cancellation error on unmount
          }
        }
      });
      if (pdfDoc) {
        try {
          pdfDoc.cleanup();
        } catch {
          // Ignore destroy error on unmount
        }
      }
    };
  }, [pdfDoc]);

  // Load PDF Document Proxy
  const loadPdf = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPdfDoc(null);
    setNumPages(0);
    setRenderProgress(0);

    try {
      let loadingTask: pdfjsLib.PDFDocumentLoadingTask;

      if (pdfData) {
        loadingTask = pdfjsLib.getDocument({ data: pdfData });
      } else if (pdfUrl) {
        loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: true,
        });
      } else {
        throw new Error('No PDF binary or URL provided for document rendering.');
      }

      loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
        if (progressData.total > 0) {
          setRenderProgress(Math.round((progressData.loaded / progressData.total) * 100));
        }
      };

      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      canvasRefs.current = new Array(doc.numPages).fill(null);
      renderTasksRef.current = new Array(doc.numPages).fill(null);
    } catch (err: any) {
      console.error('[PDF_CANVAS_VIEWER] Failed to load PDF:', err);
      setError(err?.message || 'Failed to parse PDF document.');
    } finally {
      setLoading(false);
    }
  }, [pdfUrl, pdfData]);

  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  // Render individual page onto HTML5 canvas with cancellation safety
  const renderPage = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement) => {
      if (!pdfDoc) return;

      // Cancel any ongoing render task for this specific page index
      const existingTask = renderTasksRef.current[pageNumber - 1];
      if (existingTask) {
        try {
          existingTask.cancel();
        } catch {
          // Task already completed or cancelled
        }
      }

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const pixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * pixelRatio });

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / pixelRatio}px`;
        canvas.style.height = `${viewport.height / pixelRatio}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        };

        const renderTask = page.render(renderContext);
        renderTasksRef.current[pageNumber - 1] = renderTask;

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`[PDF_CANVAS_VIEWER] Error rendering page ${pageNumber}:`, err);
        }
      }
    },
    [pdfDoc, scale]
  );

  // Re-render all pages when pdfDoc, numPages, or scale changes
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;

    for (let i = 1; i <= numPages; i++) {
      const canvas = canvasRefs.current[i - 1];
      if (canvas) {
        renderPage(i, canvas);
      }
    }
  }, [pdfDoc, numPages, scale, renderPage]);

  // Scroll position detection for updating active page counter
  const handleScroll = () => {
    if (!containerRef.current || numPages <= 1) return;
    const container = containerRef.current;
    const scrollPosition = container.scrollTop + container.clientHeight / 3;

    for (let i = 0; i < numPages; i++) {
      const canvas = canvasRefs.current[i];
      if (canvas) {
        const canvasTop = canvas.offsetTop;
        const canvasBottom = canvasTop + canvas.clientHeight;

        if (scrollPosition >= canvasTop && scrollPosition <= canvasBottom) {
          setCurrentPage(i + 1);
          break;
        }
      }
    }
  };

  const scrollToPage = (pageIndex: number) => {
    if (pageIndex < 1 || pageIndex > numPages) return;
    setCurrentPage(pageIndex);
    const canvas = canvasRefs.current[pageIndex - 1];
    if (canvas && containerRef.current) {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 2.5));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.6));
  const zoomReset = () => setScale(1.2);

  return (
    <div className={`flex flex-col h-full bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl ${className}`}>
      {/* Canvas Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur border-b border-slate-800 gap-3 z-10">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/70 px-3 py-1.5 rounded-xl border border-emerald-800/50">
            <Layers className="w-4 h-4 text-emerald-400" />
            {fileName}
          </span>
          {numPages > 0 && (
            <span className="text-xs text-slate-400 font-semibold">
              ({numPages} {numPages === 1 ? 'Page' : 'Pages'})
            </span>
          )}
        </div>

        {/* Navigation & Zoom Controls */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => scrollToPage(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="p-1.5 hover:bg-slate-800 disabled:opacity-30 text-slate-300 rounded-lg transition"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-300 px-2 font-medium">
            Page {currentPage} of {numPages || 1}
          </span>
          <button
            onClick={() => scrollToPage(currentPage + 1)}
            disabled={currentPage >= numPages || loading}
            className="p-1.5 hover:bg-slate-800 disabled:opacity-30 text-slate-300 rounded-lg transition"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={zoomOut}
            disabled={scale <= 0.6 || loading}
            className="p-1.5 hover:bg-slate-800 disabled:opacity-30 text-slate-300 rounded-lg transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={zoomReset}
            className="px-2.5 py-1 text-xs font-mono hover:bg-slate-800 text-emerald-400 rounded-lg transition font-semibold"
            title="Reset Zoom (120%)"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            onClick={zoomIn}
            disabled={scale >= 2.5 || loading}
            className="p-1.5 hover:bg-slate-800 disabled:opacity-30 text-slate-300 rounded-lg transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-auto p-4 md:p-8 bg-slate-950 flex flex-col items-center gap-8 custom-scrollbar"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center my-auto py-24 gap-4">
            <RefreshCw className="w-9 h-9 text-emerald-400 animate-spin" />
            <p className="text-sm font-medium text-slate-300">Rendering document content...</p>
            {renderProgress > 0 && (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/40">
                {renderProgress}% loaded
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center my-auto py-16 px-6 bg-rose-950/40 border border-rose-800/50 rounded-2xl max-w-md text-center gap-3">
            <AlertTriangle className="w-10 h-10 text-rose-400" />
            <h4 className="text-base font-bold text-rose-200">Unable to Render Document</h4>
            <p className="text-xs text-rose-300/80">{error}</p>
            <button
              onClick={loadPdf}
              className="mt-2 px-4 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-100 rounded-xl text-xs font-semibold transition"
            >
              Retry Rendering
            </button>
          </div>
        )}

        {!loading && !error && numPages > 0 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-5xl">
            {Array.from({ length: numPages }, (_, index) => {
              const pageNum = index + 1;
              return (
                <div
                  key={pageNum}
                  className="flex flex-col items-center bg-white rounded-xl shadow-2xl p-2 relative group transition-all duration-300 hover:shadow-emerald-950/30"
                >
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[index] = el;
                    }}
                    className="rounded shadow-inner bg-white max-w-full"
                  />
                  <div className="absolute bottom-4 right-4 bg-slate-900/85 backdrop-blur text-slate-300 text-[10px] font-mono px-2.5 py-1 rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Page {pageNum} of {numPages}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NativePdfCanvasViewer;
