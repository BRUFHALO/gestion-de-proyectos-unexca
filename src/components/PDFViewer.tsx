import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { Button } from './ui/Button';

// Configurar worker de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  fileName?: string;
  onPageChange?: (page: number) => void;
  highlightedPages?: number[];
  annotations?: Array<{
    page: number;
    type: 'correction' | 'suggestion' | 'approval';
    x: number;
    y: number;
    comment: string;
  }>;
}

export function PDFViewer({ 
  fileUrl, 
  fileName, 
  onPageChange,
  highlightedPages = [],
  annotations = []
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    console.log('PDF cargado exitosamente. Páginas:', numPages);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    console.error('URL del PDF:', fileUrl);
    setLoading(false);
  }

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1;
      setPageNumber(newPage);
      onPageChange?.(newPage);
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      const newPage = pageNumber + 1;
      setPageNumber(newPage);
      onPageChange?.(newPage);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
      onPageChange?.(page);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const getAnnotationColor = (type: 'correction' | 'suggestion' | 'approval') => {
    switch (type) {
      case 'correction': return 'rgba(239, 68, 68, 0.3)';
      case 'suggestion': return 'rgba(234, 179, 8, 0.3)';
      case 'approval': return 'rgba(34, 197, 94, 0.3)';
    }
  };

  const pageAnnotations = annotations.filter(a => a.page === pageNumber);

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Anterior
          </Button>
          
          <div className="flex items-center gap-2 px-3">
            <input
              type="number"
              min={1}
              max={numPages}
              value={pageNumber}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 border border-slate-300 rounded text-center text-sm"
            />
            <span className="text-sm text-slate-600">/ {numPages || '...'}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            leftIcon={<ChevronRight className="w-4 h-4" />}
          >
            Siguiente
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            leftIcon={<ZoomOut className="w-4 h-4" />}
          >
            -
          </Button>
          
          <span className="text-sm text-slate-600 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3.0}
            leftIcon={<ZoomIn className="w-4 h-4" />}
          >
            +
          </Button>

          {fileName && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(fileUrl, '_blank')}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Descargar
            </Button>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-center">
          <div className="relative inline-block shadow-lg">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-slate-600">Cargando PDF...</p>
                </div>
              </div>
            )}

            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="h-96 w-full bg-slate-200 animate-pulse"></div>}
              options={{
                cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                cMapPacked: true,
              }}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className={highlightedPages.includes(pageNumber) ? 'ring-4 ring-yellow-400' : ''}
              />
            </Document>

            {/* Overlay de anotaciones */}
            {pageAnnotations.map((annotation, index) => (
              <div
                key={index}
                className="absolute rounded-lg border-2 cursor-pointer hover:opacity-100 transition-opacity"
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                  width: '100px',
                  height: '100px',
                  backgroundColor: getAnnotationColor(annotation.type),
                  borderColor: getAnnotationColor(annotation.type).replace('0.3', '1'),
                  opacity: 0.7
                }}
                title={annotation.comment}
              >
                <div className="absolute -top-8 left-0 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                  {annotation.comment.substring(0, 50)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page indicators */}
      {highlightedPages.length > 0 && (
        <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-2">
          <p className="text-sm text-yellow-800">
            📍 Páginas con comentarios: {highlightedPages.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
