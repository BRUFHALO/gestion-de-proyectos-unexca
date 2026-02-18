import { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, 
  Square, Circle, Type, Highlighter, ArrowRight, Save, 
  Trash2, Move
} from 'lucide-react';
import { Button } from './ui/Button';
import { fabric } from 'fabric';

interface AnnotatedPDFViewerProps {
  fileUrl: string;
  fileName?: string;
  onSave?: (annotations: any[]) => void;
}

export function AnnotatedPDFViewer({ fileUrl, fileName, onSave }: AnnotatedPDFViewerProps) {
  const [scale, setScale] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTool, setSelectedTool] = useState<'select' | 'rectangle' | 'circle' | 'text' | 'highlight' | 'arrow'>('select');
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [isLoading, setIsLoading] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocumentRef = useRef<any>(null);

  const tools = [
    { id: 'select', icon: Move, label: 'Seleccionar' },
    { id: 'rectangle', icon: Square, label: 'Rectángulo' },
    { id: 'circle', icon: Circle, label: 'Círculo' },
    { id: 'text', icon: Type, label: 'Texto' },
    { id: 'highlight', icon: Highlighter, label: 'Resaltar' },
    { id: 'arrow', icon: ArrowRight, label: 'Flecha' }
  ];

  const colors = ['#ff0000', '#ffff00', '#00ff00', '#0000ff', '#000000', '#ffffff'];

  useEffect(() => {
    loadPDF();
  }, [fileUrl]);

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
      
      await renderPage(1);
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
      selection: selectedTool === 'select'
    });
    
    fabricCanvasRef.current = fabricCanvas;
    
    // Add event handlers
    fabricCanvas.on('mouse:down', handleCanvasMouseDown);
  };

  const handleCanvasMouseDown = (options: any) => {
    if (selectedTool === 'select') return;
    
    const pointer = fabricCanvasRef.current?.getPointer(options.e);
    if (!pointer || !fabricCanvasRef.current) return;
    
    let object: fabric.Object | null = null;
    
    switch (selectedTool) {
      case 'rectangle':
        object = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 100,
          height: 60,
          fill: 'transparent',
          stroke: selectedColor,
          strokeWidth: 2,
          selectable: true
        });
        break;
        
      case 'circle':
        object = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 40,
          fill: 'transparent',
          stroke: selectedColor,
          strokeWidth: 2,
          selectable: true
        });
        break;
        
      case 'text':
        const text = new fabric.IText('Escribe aquí...', {
          left: pointer.x,
          top: pointer.y,
          fontFamily: 'Arial',
          fontSize: 16,
          fill: selectedColor,
          selectable: true
        });
        text.enterEditing();
        object = text;
        break;
        
      case 'highlight':
        object = new fabric.Rect({
          left: pointer.x - 50,
          top: pointer.y - 10,
          width: 100,
          height: 20,
          fill: selectedColor + '40', // Add transparency
          selectable: true
        });
        break;
        
      case 'arrow':
        const line = new fabric.Line([pointer.x, pointer.y, pointer.x + 100, pointer.y], {
          stroke: selectedColor,
          strokeWidth: 2,
          selectable: true
        });
        
        const triangle = new fabric.Triangle({
          left: pointer.x + 100,
          top: pointer.y - 5,
          width: 10,
          height: 10,
          fill: selectedColor,
          angle: 90,
          selectable: false
        });
        
        const group = new fabric.Group([line, triangle], {
          selectable: true
        });
        object = group;
        break;
    }
    
    if (object && fabricCanvasRef.current) {
      fabricCanvasRef.current.add(object);
      fabricCanvasRef.current.setActiveObject(object);
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleZoomIn = () => {
    setScale((prev: number) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setScale((prev: number) => Math.max(prev - 10, 50));
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

  const handleClearCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      initializeFabricCanvas();
    }
  };

  const handleSave = () => {
    if (!fabricCanvasRef.current) return;
    
    const canvasObjects = fabricCanvasRef.current.getObjects();
    const annotationsData = canvasObjects.map((obj: fabric.Object) => obj.toObject());
    
    if (onSave) {
      onSave(annotationsData);
    }
    
    // Show success message
    alert('Anotaciones guardadas exitosamente');
  };

  const handleDownload = () => {
    if (!fabricCanvasRef.current) return;
    
    const dataURL = fabricCanvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `annotated_${fileName || 'page_' + currentPage}.png`;
    link.href = dataURL;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">
              {fileName || 'Documento.pdf'} - Página {currentPage} de {totalPages}
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

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Descargar
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Guardar Anotaciones
            </Button>
          </div>
        </div>

        {/* Drawing Tools */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Herramientas:</span>
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool(tool.id as any)}
                leftIcon={<tool.icon className="w-4 h-4" />}
                title={tool.label}
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCanvas}
              leftIcon={<Trash2 className="w-4 h-4" />}
              title="Limpiar canvas"
            />
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Color:</span>
            <div className="flex gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded border-2 ${
                    selectedColor === color ? 'border-slate-900' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
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
                className="block border border-slate-300"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0"
                style={{ pointerEvents: 'auto' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
