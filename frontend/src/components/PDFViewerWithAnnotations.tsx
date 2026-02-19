import { useState, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, 
  Square, Circle, Type, Highlighter, ArrowRight, Save, 
  Trash2, Move
} from 'lucide-react';
import { Button } from './ui/Button';
import { fabric } from 'fabric';

interface PDFViewerWithAnnotationsProps {
  fileUrl: string;
  fileName?: string;
  onSave?: (annotations: any[]) => void;
}

export function PDFViewerWithAnnotations({ fileUrl, fileName, onSave }: PDFViewerWithAnnotationsProps) {
  const [scale, setScale] = useState(100);
  const [selectedTool, setSelectedTool] = useState<'select' | 'rectangle' | 'circle' | 'text' | 'highlight' | 'arrow'>('select');
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [isDrawing, setIsDrawing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const tools = [
    { id: 'select', icon: Move, label: 'Seleccionar' },
    { id: 'rectangle', icon: Square, label: 'Rectángulo' },
    { id: 'circle', icon: Circle, label: 'Círculo' },
    { id: 'text', icon: Type, label: 'Texto' },
    { id: 'highlight', icon: Highlighter, label: 'Resaltar' },
    { id: 'arrow', icon: ArrowRight, label: 'Flecha' }
  ];

  const colors = ['#ff0000', '#ffff00', '#00ff00', '#0000ff', '#ff00ff', '#000000'];

  const initializeFabricCanvas = () => {
    if (!canvasRef.current || fabricCanvasRef.current) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (container) {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    }
    
    const fabricCanvas = new fabric.Canvas(canvas, {
      backgroundColor: 'transparent',
      selection: selectedTool === 'select',
      isDrawingMode: false
    });
    
    fabricCanvasRef.current = fabricCanvas;
    
    fabricCanvas.on('mouse:down', handleCanvasMouseDown);
  };

  const handleCanvasMouseDown = (options: any) => {
    if (selectedTool === 'select' || !fabricCanvasRef.current) return;
    
    const pointer = fabricCanvasRef.current.getPointer(options.e);
    if (!pointer) return;
    
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
          strokeWidth: 3,
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
          strokeWidth: 3,
          selectable: true
        });
        break;
        
      case 'text':
        object = new fabric.IText('Escribe aquí...', {
          left: pointer.x,
          top: pointer.y,
          fontFamily: 'Arial',
          fontSize: 18,
          fill: selectedColor,
          selectable: true
        });
        break;
        
      case 'highlight':
        object = new fabric.Rect({
          left: pointer.x - 50,
          top: pointer.y - 10,
          width: 100,
          height: 20,
          fill: selectedColor + '40',
          selectable: true
        });
        break;
        
      case 'arrow':
        const line = new fabric.Line([pointer.x, pointer.y, pointer.x + 100, pointer.y], {
          stroke: selectedColor,
          strokeWidth: 3,
          selectable: true
        });
        
        const triangle = new fabric.Triangle({
          left: pointer.x + 100,
          top: pointer.y - 5,
          width: 15,
          height: 15,
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

  const handleClearCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
    }
  };

  const handleSave = () => {
    if (!fabricCanvasRef.current) return;
    
    const canvasObjects = fabricCanvasRef.current.getObjects();
    const annotationsData = canvasObjects.map((obj: fabric.Object) => obj.toObject());
    
    if (onSave) {
      onSave(annotationsData);
    }
    
    alert('Anotaciones guardadas exitosamente');
  };

  const handleDownload = () => {
    window.open(fileUrl, '_blank');
  };

  const handleInitCanvas = () => {
    setIsDrawing(true);
    // Use setTimeout to ensure iframe is rendered before initializing canvas
    setTimeout(() => {
      if (!fabricCanvasRef.current) {
        initializeFabricCanvas();
      }
    }, 100);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">
              {fileName || 'Documento.pdf'}
            </span>
          </div>

          <div className="flex items-center gap-2">
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

            {isDrawing && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Guardar Anotaciones
              </Button>
            )}
          </div>
        </div>

        {/* Drawing Tools */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Herramientas:</span>
            <Button
              variant={isDrawing ? 'outline' : 'primary'}
              size="sm"
              onClick={handleInitCanvas}
            >
              {isDrawing ? 'Dibujar Activo' : 'Activar Dibujo'}
            </Button>
            {isDrawing && (
              <>
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
                  title="Limpiar"
                />
              </>
            )}
          </div>

          {isDrawing && (
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
          )}
        </div>
      </div>

      {/* PDF + Canvas Container */}
      <div className="flex-1 overflow-auto p-4 bg-slate-200">
        <div className="flex justify-center">
          <div 
            ref={containerRef}
            className="relative bg-white shadow-lg"
            style={{
              transform: `scale(${scale / 100})`,
              transformOrigin: 'top center',
              width: '100%',
              minWidth: '900px',
              height: '1200px'
            }}
          >
            {/* PDF iframe */}
            <iframe
              src={fileUrl}
              className="w-full h-full border-0"
              title={fileName}
              style={{ pointerEvents: isDrawing ? 'none' : 'auto' }}
            />
            
            {/* Annotation canvas overlay */}
            {isDrawing && (
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0"
                style={{ 
                  zIndex: 10,
                  pointerEvents: 'auto',
                  cursor: selectedTool === 'select' ? 'default' : 'crosshair'
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
