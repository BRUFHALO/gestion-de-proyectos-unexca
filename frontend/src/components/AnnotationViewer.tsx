import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './ui/Button';
import { fabric } from 'fabric';

interface AnnotationViewerProps {
  fileUrl: string;
  fileName?: string;
  annotations: any[];
  currentPage?: number;
}

export function AnnotationViewer({ 
  fileUrl, 
  fileName, 
  annotations, 
  currentPage: initialPage = 1 
}: AnnotationViewerProps) {
  const [scale, setScale] = useState(100);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocumentRef = useRef<any>(null);

  useEffect(() => {
    loadPDF();
  }, [fileUrl]);

  useEffect(() => {
    renderAnnotations();
  }, [annotations, currentPage]);

  const loadPDF = async () => {
    setIsLoading(true);
    try {
      // Load PDF using pdf.js
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      
      pdfDocumentRef.current = pdf;
      setTotalPages(pdf.numPages);
      
      await renderPage(currentPage);
      initializeFabricCanvas();
      
    } catch (error) {
      console.error('Error loading PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPage = async (pageNumber: number) => {
    if (!pdfDocumentRef.current) return;
    
    const page = await pdfDocumentRef.current.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.5 });
    
    const canvas = pdfCanvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // Update fabric canvas size
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setDimensions({
        width: viewport.width,
        height: viewport.height
      });
      fabricCanvasRef.current.renderAll();
    }
  };

  const initializeFabricCanvas = () => {
    if (!canvasRef.current || !pdfCanvasRef.current) return;
    
    const canvas = canvasRef.current;
    const pdfCanvas = pdfCanvasRef.current;
    
    canvas.width = pdfCanvas.width;
    canvas.height = pdfCanvas.height;
    
    const fabricCanvas = new fabric.Canvas(canvas, {
      backgroundColor: 'transparent',
      selection: false, // Disable selection for viewer
      interactive: false // Disable all interactions
    });
    
    fabricCanvasRef.current = fabricCanvas;
    
    // Set PDF as background
    fabricCanvas.setBackgroundImage(
      pdfCanvas.toDataURL(),
      fabricCanvas.renderAll.bind(fabricCanvas),
      {
        scaleX: 1,
        scaleY: 1,
        originX: 'left',
        originY: 'top'
      }
    );
  };

  const renderAnnotations = () => {
    if (!fabricCanvasRef.current || !annotations.length) return;
    
    // Clear existing annotations
    fabricCanvasRef.current.clear();
    initializeFabricCanvas();
    
    // Filter annotations for current page
    const pageAnnotations = annotations.filter(
      annotation => annotation.page === currentPage && annotation.annotation_data
    );
    
    // Render each annotation
    pageAnnotations.forEach(annotationData => {
      try {
        // Use fabric.js to recreate the annotation from saved data
        fabric.util.enlivenObjects([annotationData.annotation_data], (objects: any[]) => {
          objects.forEach(obj => {
            obj.set({
              selectable: false,
              evented: false,
              lockMovementX: true,
              lockMovementY: true,
              lockScalingX: true,
              lockScalingY: true,
              lockRotation: true
            });
            fabricCanvasRef.current?.add(obj);
          });
          fabricCanvasRef.current?.renderAll();
        });
      } catch (error) {
        console.error('Error rendering annotation:', error);
      }
    });
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 10, 50));
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      renderPage(newPage);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      renderPage(newPage);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">
              {fileName || 'Documento.pdf'} - Página {currentPage} de {totalPages}
              {annotations.filter(a => a.page === currentPage).length > 0 && (
                <span className="ml-2 text-xs text-blue-600">
                  ({annotations.filter(a => a.page === currentPage).length} anotaciones)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Anterior
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              leftIcon={<ChevronRight className="w-4 h-4" />}
            >
              Siguiente
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 50}
              leftIcon={<ZoomOut className="w-4 h-4" />}
            >
              -
            </Button>
            
            <span className="text-sm text-slate-600 min-w-[60px] text-center">
              {scale}%
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 200}
              leftIcon={<ZoomIn className="w-4 h-4" />}
            >
              +
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 overflow-auto p-4 bg-slate-200">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-slate-600">Cargando PDF...</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div 
              className="relative bg-white shadow-lg"
              style={{
                transform: `scale(${scale / 100})`,
                transformOrigin: 'top center'
              }}
            >
              <canvas
                ref={pdfCanvasRef}
                className="absolute top-0 left-0"
                style={{ display: 'none' }}
              />
              <canvas
                ref={canvasRef}
                className="border border-slate-300"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
