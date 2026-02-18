import { useState, useRef, useEffect } from 'react';
import { 
  Download, ZoomIn, ZoomOut, Square, Circle, Type, 
  Highlighter, ArrowRight, Save, Trash2, Move, FileDown
} from 'lucide-react';
import { Button } from './ui/Button';
import { fabric } from 'fabric';

interface DocxEvaluationViewerProps {
  projectId: string;
  onSave?: (annotations: any[]) => void;
}

interface Annotation {
  id: string;
  type: string;
  position: { x: number; y: number; width?: number; height?: number };
  paragraph_id?: string;
  color: string;
  stroke_width?: number;
  text_content?: string;
  comment?: string;
  created_by: string;
  created_at: string;
}

export function DocxEvaluationViewer({ projectId, onSave }: DocxEvaluationViewerProps) {
  const [scale, setScale] = useState(100);
  const [selectedTool, setSelectedTool] = useState<'select' | 'rectangle' | 'circle' | 'text' | 'highlight' | 'arrow'>('select');
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const tools = [
    { id: 'select', icon: Move, label: 'Seleccionar' },
    { id: 'rectangle', icon: Square, label: 'Rectángulo' },
    { id: 'circle', icon: Circle, label: 'Círculo' },
    { id: 'text', icon: Type, label: 'Texto' },
    { id: 'highlight', icon: Highlighter, label: 'Resaltar' },
    { id: 'arrow', icon: ArrowRight, label: 'Flecha' }
  ];

  const colors = ['#ff0000', '#ffff00', '#00ff00', '#0000ff', '#ff00ff', '#000000'];

  useEffect(() => {
    loadDocument();
  }, [projectId]);

  const loadDocument = async () => {
    setIsLoading(true);
    try {
      // Cargar contenido del documento
      const response = await fetch(`http://localhost:8005/api/v1/docx/parse/${projectId}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Error cargando documento');
      }
      
      const data = await response.json();
      setHtmlContent(data.html);
      
      // Cargar anotaciones existentes
      const annotationsResponse = await fetch(`http://localhost:8005/api/v1/docx/annotations/${projectId}`);
      if (annotationsResponse.ok) {
        const annotationsData = await annotationsResponse.json();
        setAnnotations(annotationsData.annotations || []);
      }
      
    } catch (error) {
      console.error('Error cargando documento:', error);
      alert('Error al cargar el documento. Asegúrate de que el backend esté corriendo.');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeFabricCanvas = () => {
    if (!canvasRef.current || fabricCanvasRef.current) return;
    
    const canvas = canvasRef.current;
    const container = contentRef.current;
    
    if (container) {
      // Obtener dimensiones reales del contenedor
      const rect = container.getBoundingClientRect();
      canvas.width = container.scrollWidth || rect.width;
      canvas.height = container.scrollHeight || rect.height;
      
      console.log('Canvas initialized:', {
        width: canvas.width,
        height: canvas.height,
        containerWidth: container.offsetWidth,
        containerHeight: container.offsetHeight
      });
    }
    
    const fabricCanvas = new fabric.Canvas(canvas, {
      backgroundColor: 'transparent',
      selection: selectedTool === 'select',
      isDrawingMode: false,
      width: canvas.width,
      height: canvas.height
    });
    
    fabricCanvasRef.current = fabricCanvas;
    
    // Cargar anotaciones existentes
    if (annotations.length > 0) {
      loadAnnotationsToCanvas(annotations);
    }
    
    fabricCanvas.on('mouse:down', handleCanvasMouseDown);
    
    console.log('Fabric canvas initialized successfully');
  };

  const loadAnnotationsToCanvas = (annotations: Annotation[]) => {
    if (!fabricCanvasRef.current) return;
    
    annotations.forEach((anno) => {
      let object: fabric.Object | null = null;
      
      switch (anno.type) {
        case 'rectangle':
          object = new fabric.Rect({
            left: anno.position.x,
            top: anno.position.y,
            width: anno.position.width || 100,
            height: anno.position.height || 60,
            fill: 'transparent',
            stroke: anno.color,
            strokeWidth: anno.stroke_width || 3,
            selectable: true
          });
          break;
        
        case 'circle':
          object = new fabric.Circle({
            left: anno.position.x,
            top: anno.position.y,
            radius: (anno.position.width || 80) / 2,
            fill: 'transparent',
            stroke: anno.color,
            strokeWidth: anno.stroke_width || 3,
            selectable: true
          });
          break;
        
        case 'text':
          object = new fabric.IText(anno.text_content || 'Texto', {
            left: anno.position.x,
            top: anno.position.y,
            fontFamily: 'Arial',
            fontSize: 18,
            fill: anno.color,
            selectable: true
          });
          break;
        
        case 'highlight':
          object = new fabric.Rect({
            left: anno.position.x,
            top: anno.position.y,
            width: anno.position.width || 100,
            height: anno.position.height || 20,
            fill: anno.color + '40',
            selectable: true
          });
          break;
      }
      
      if (object && fabricCanvasRef.current) {
        fabricCanvasRef.current.add(object);
      }
    });
    
    fabricCanvasRef.current?.renderAll();
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

  const handleSave = async () => {
    if (!fabricCanvasRef.current) return;
    
    const canvasObjects = fabricCanvasRef.current.getObjects();
    const annotationsData = canvasObjects.map((obj: fabric.Object, index: number) => {
      const objData: any = obj.toObject();
      
      return {
        id: `anno_${Date.now()}_${index}`,
        type: obj.type === 'i-text' ? 'text' : obj.type || 'rectangle',
        position: {
          x: obj.left || 0,
          y: obj.top || 0,
          width: obj.width || 0,
          height: obj.height || 0
        },
        color: objData.stroke || objData.fill || selectedColor,
        stroke_width: objData.strokeWidth || 2,
        text_content: obj.type === 'i-text' ? (obj as fabric.IText).text : undefined,
        created_by: 'teacher',
        created_at: new Date().toISOString()
      };
    });
    
    try {
      const response = await fetch('http://localhost:8005/api/v1/docx/annotations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          annotations: annotationsData
        })
      });
      
      if (!response.ok) {
        throw new Error('Error guardando anotaciones');
      }
      
      alert('Anotaciones guardadas exitosamente');
      
      if (onSave) {
        onSave(annotationsData);
      }
    } catch (error) {
      console.error('Error guardando anotaciones:', error);
      alert('Error al guardar las anotaciones');
    }
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    try {
      const response = await fetch('http://localhost:8005/api/v1/docx/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          export_format: format,
          apply_corrections: false
        })
      });
      
      if (!response.ok) {
        throw new Error('Error exportando documento');
      }
      
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error('Error exportando:', error);
      alert('Error al exportar el documento');
    }
  };

  const handleInitCanvas = () => {
    setIsDrawing(true);
    setTimeout(() => {
      if (!fabricCanvasRef.current) {
        initializeFabricCanvas();
      }
    }, 100);
  };

  return (
    <div className="flex h-full bg-slate-100 rounded-lg overflow-hidden">
      {/* Área principal del documento */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">
              Documento DOCX - Evaluación
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
              onClick={() => handleExport('pdf')}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Exportar PDF
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('docx')}
              leftIcon={<FileDown className="w-4 h-4" />}
            >
              Exportar DOCX
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
              {isDrawing ? 'Dibujo Activo' : 'Activar Dibujo'}
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

      {/* Document Content + Canvas Container */}
      <div className="flex-1 overflow-auto p-4 bg-slate-200">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-slate-600">Cargando documento...</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div 
              ref={contentRef}
              className="relative bg-white shadow-lg p-8"
              style={{
                transform: `scale(${scale / 100})`,
                transformOrigin: 'top center',
                width: '100%',
                maxWidth: '900px',
                minHeight: '1200px'
              }}
            >
              {/* Document HTML Content */}
              <div 
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                style={{ 
                  pointerEvents: isDrawing ? 'none' : 'auto',
                  fontFamily: 'Calibri, Arial, sans-serif',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  position: 'relative',
                  zIndex: 1
                }}
              />
              
              {/* Annotation canvas overlay */}
              {isDrawing && (
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ 
                    zIndex: 100,
                    pointerEvents: 'auto',
                    cursor: selectedTool === 'select' ? 'default' : 'crosshair',
                    backgroundColor: 'transparent'
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Panel lateral de anotaciones guardadas a la derecha */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            Anotaciones Guardadas ({annotations.length})
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {annotations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">
                  No hay anotaciones guardadas aún.
                  <br />
                  Usa las herramientas de dibujo para agregar anotaciones.
                </p>
              </div>
            ) : (
              annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="p-3 rounded-lg border-2 border-slate-200 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {annotation.type === 'rectangle' && <Square className="w-4 h-4" style={{ color: annotation.color }} />}
                      {annotation.type === 'circle' && <Circle className="w-4 h-4" style={{ color: annotation.color }} />}
                      {annotation.type === 'text' && <Type className="w-4 h-4" style={{ color: annotation.color }} />}
                      {annotation.type === 'highlight' && <Highlighter className="w-4 h-4" style={{ color: annotation.color }} />}
                      {annotation.type === 'arrow' && <ArrowRight className="w-4 h-4" style={{ color: annotation.color }} />}
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {annotation.type}
                      </span>
                    </div>
                  </div>

                  {annotation.text_content && (
                    <p className="text-sm text-slate-600 mb-2">
                      "{annotation.text_content}"
                    </p>
                  )}

                  {annotation.comment && (
                    <p className="text-sm text-slate-600 mb-2">
                      {annotation.comment}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                    <span>{new Date(annotation.created_at).toLocaleString('es-ES')}</span>
                    <div 
                      className="w-4 h-4 rounded border border-slate-300"
                      style={{ backgroundColor: annotation.color }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
