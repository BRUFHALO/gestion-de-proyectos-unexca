import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Save, 
  MessageSquare, Trash2, X, Check, FileText, User
} from 'lucide-react';
import { Button } from './ui/Button';

// Configurar worker de PDF.js
// Usar la versión del CDN de unpkg que es más confiable
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Estilos CSS para ocultar la capa de texto duplicada
const pdfStyles = `
  .react-pdf__Page__textContent {
    opacity: 0 !important;
    pointer-events: auto !important;
    height: 15px !important;
    overflow: hidden !important;
  }
  .react-pdf__Page__textContent span {
    color: transparent !important;
  }
`;

interface Annotation {
  id: string;
  page: number;
  rect: number[]; // [x0, y0, x1, y1]
  color: string;
  type: 'highlight' | 'comment';
  comment: string;
  selected_text?: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

interface PDFEvaluationViewerProps {
  projectId: string;
  teacherId: string;
  teacherName: string;
  onSave?: (annotations: Annotation[]) => void;
  onBack?: () => void;
}

export function PDFEvaluationViewer({ 
  projectId, 
  teacherId, 
  teacherName,
  onSave,
  onBack 
}: PDFEvaluationViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('yellow');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [showAnnotationPopup, setShowAnnotationPopup] = useState(false);

  const pageRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const colors = [
    { name: 'Amarillo', value: 'yellow', hex: '#ffff00' },
    { name: 'Rojo', value: 'red', hex: '#ff0000' },
    { name: 'Verde', value: 'green', hex: '#00ff00' },
    { name: 'Azul', value: 'blue', hex: '#0000ff' }
  ];

  useEffect(() => {
    loadPDF();
    loadAnnotations();
  }, [projectId]);

  useEffect(() => {
    if (showCommentBox && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [showCommentBox]);

  const loadPDF = async () => {
    setIsLoading(true);
    try {
      // Obtener información del proyecto para obtener la ruta del PDF
      const response = await fetch(`http://localhost:8005/api/v1/projects/${projectId}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener información del proyecto');
      }

      const project = await response.json();
      const currentVersion = project.versions?.[project.metadata?.current_version - 1];
      const file = currentVersion?.files?.[0];
      
      if (!file) {
        throw new Error('No se encontró el archivo del proyecto');
      }

      // Construir URL del PDF
      const pdfPath = file.file_path || `projects/${projectId}/${file.file_id}`;
      setPdfUrl(`http://localhost:8005/uploads/${pdfPath}`);
    } catch (error) {
      console.error('Error cargando PDF:', error);
      alert('Error al cargar el documento PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnnotations = async () => {
    try {
      const response = await fetch(
        `http://localhost:8005/api/v1/pdf-evaluation/annotations/${projectId}`
      );

      if (response.ok) {
        const data = await response.json();
        setAnnotations(data.annotations || []);
      }
    } catch (error) {
      console.error('Error cargando anotaciones:', error);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    console.log(`PDF cargado: ${numPages} páginas`);
  };

  const handleTextSelection = (e: React.MouseEvent) => {
    // Intentar obtener selección de texto primero
    const selection = window.getSelection();
    const text = selection?.toString().trim() || '';
    
    if (text.length > 0 && selection && !selection.isCollapsed) {
      // Si hay texto seleccionado, usar ese
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(text);
      setSelectionRect(rect);
      setShowCommentBox(true);
      return;
    }

    // Obtener coordenadas relativas al contenedor del PDF
    const pageElement = pageRef.current;
    if (!pageElement) return;

    const pageRect = pageElement.getBoundingClientRect();
    const relativeX = e.clientX - pageRect.left;
    const relativeY = e.clientY - pageRect.top;

    // Crear un rectángulo pequeño en la posición del doble clic (relativo al PDF)
    const fakeRect = {
      left: relativeX,
      top: relativeY,
      right: relativeX + 100,
      bottom: relativeY + 20,
      width: 100,
      height: 20,
      x: relativeX,
      y: relativeY
    } as DOMRect;

    setSelectedText('');
    setSelectionRect(fakeRect);
    setShowCommentBox(true);
  };

  const handleSaveComment = () => {
    if (!commentText.trim() || !selectionRect) {
      alert('Por favor escribe un comentario');
      return;
    }

    // Obtener coordenadas relativas a la página del PDF
    const pageElement = pageRef.current;
    if (!pageElement) return;

    const pageRect = pageElement.getBoundingClientRect();
    
    // Calcular coordenadas relativas al PDF (normalizadas)
    const x0 = (selectionRect.left - pageRect.left) / pageRect.width;
    const y0 = (selectionRect.top - pageRect.top) / pageRect.height;
    const x1 = (selectionRect.right - pageRect.left) / pageRect.width;
    const y1 = (selectionRect.bottom - pageRect.top) / pageRect.height;

    const newAnnotation: Annotation = {
      id: `anno_${Date.now()}`,
      page: currentPage,
      rect: [x0, y0, x1, y1],
      color: selectedColor,
      type: 'highlight',
      comment: commentText,
      selected_text: selectedText,
      author_id: teacherId,
      author_name: teacherName,
      created_at: new Date().toISOString()
    };

    setAnnotations([...annotations, newAnnotation]);
    setCommentText('');
    setShowCommentBox(false);
    setSelectedText('');
    
    // Limpiar selección
    window.getSelection()?.removeAllRanges();
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
  };

  const handleSaveAllAnnotations = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        'http://localhost:8005/api/v1/pdf-evaluation/annotations/save',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            project_id: projectId,
            annotations: annotations
          })
        }
      );

      if (!response.ok) {
        throw new Error('Error guardando anotaciones');
      }

      alert('✅ Anotaciones guardadas exitosamente');
      
      if (onSave) {
        onSave(annotations);
      }
    } catch (error) {
      console.error('Error guardando anotaciones:', error);
      alert('❌ Error al guardar las anotaciones');
    } finally {
      setIsSaving(false);
    }
  };

  const renderAnnotationOverlays = () => {
    if (!pageRef.current) return null;
    
    return annotations
      .filter(anno => anno.page === currentPage)
      .map(anno => {
        // Usar coordenadas normalizadas directamente como porcentajes
        // Limitar entre 2% y 98% para mantener los íconos dentro del canvas
        const left = Math.max(2, Math.min(98, anno.rect[0] * 100));
        const top = Math.max(2, Math.min(98, anno.rect[1] * 100));

        const colorMap: Record<string, string> = {
          yellow: '#fbbf24',
          red: '#ef4444',
          green: '#22c55e',
          blue: '#3b82f6'
        };

        return (
          <div
            key={anno.id}
            className="absolute cursor-pointer group"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              transform: 'translate(-50%, -50%)', // Centrar el ícono en la posición
              zIndex: 20
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAnnotation(anno);
              setShowAnnotationPopup(true);
            }}
          >
            {/* Ícono de comentario */}
            <div 
              className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg hover:scale-110 transition-transform"
              style={{
                backgroundColor: colorMap[anno.color] || colorMap.yellow,
                border: `3px solid ${colorMap[anno.color] || colorMap.yellow}`
              }}
            >
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            
            {/* Tooltip al hacer hover */}
            <div className="absolute left-10 top-0 bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Click para ver comentario
            </div>
          </div>
        );
      });
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Estilos para ocultar la capa de texto duplicada */}
      <style>{pdfStyles}</style>
      
      {/* Panel principal del PDF */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar superior */}
        <div className="bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Navegación de páginas */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Anterior
                </Button>
                
                <span className="text-sm text-slate-600 px-2">
                  Página {currentPage} de {numPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                  disabled={currentPage === numPages}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Siguiente
                </Button>

                {/* Navegación rápida por números */}
                {numPages > 1 && (
                  <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-300">
                    {Array.from({ length: Math.min(numPages, 15) }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded text-sm font-medium transition-all ${
                          currentPage === pageNum
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title={`Ir a página ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    {numPages > 15 && (
                      <span className="text-slate-400 px-1">...</span>
                    )}
                  </div>
                )}
              </div>

              {/* Zoom */}
              <div className="border-l border-slate-200 pl-2 ml-2 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                  disabled={scale <= 0.5}
                  leftIcon={<ZoomOut className="w-4 h-4" />}
                />
                
                <span className="text-sm text-slate-600 min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScale(Math.min(2.0, scale + 0.1))}
                  disabled={scale >= 2.0}
                  leftIcon={<ZoomIn className="w-4 h-4" />}
                />
              </div>

              {/* Guardar */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAllAnnotations}
                disabled={isSaving || annotations.length === 0}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {isSaving ? 'Guardando...' : `Guardar (${annotations.length})`}
              </Button>
            </div>
          </div>

          {/* Selector de color */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200">
            <span className="text-sm text-slate-600">Color de resaltado:</span>
            <div className="flex gap-2">
              {colors.map(color => (
                <button
                  key={color.value}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    selectedColor === color.value 
                      ? 'border-slate-900 scale-110' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500 ml-2">
              Selecciona texto en el PDF y escribe tu comentario
            </span>
          </div>
        </div>

        {/* Área del PDF */}
        <div className="flex-1 overflow-auto bg-slate-200 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
                <p className="text-slate-600">Cargando documento PDF...</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div 
                ref={pageRef}
                className="relative bg-white shadow-2xl"
                onDoubleClick={handleTextSelection}
              >
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<div className="p-8">Cargando PDF...</div>}
                  error={<div className="p-8 text-red-600">Error al cargar el PDF</div>}
                >
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                  />
                </Document>

                {/* Overlays de anotaciones */}
                {renderAnnotationOverlays()}

                {/* Caja de comentario flotante */}
                {showCommentBox && selectionRect && (
                  <div
                    className="absolute z-50 bg-white rounded-lg shadow-2xl border-2 border-primary p-4 w-80"
                    style={{
                      left: `${selectionRect.left}px`,
                      top: `${selectionRect.bottom + 10}px`
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-800">
                        Agregar Comentario
                      </h4>
                      <button
                        onClick={() => {
                          setShowCommentBox(false);
                          setCommentText('');
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mb-2 p-2 bg-slate-50 rounded text-xs text-slate-600 italic">
                      "{selectedText.substring(0, 100)}{selectedText.length > 100 ? '...' : ''}"
                    </div>

                    <textarea
                      ref={commentInputRef}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Escribe tu observación aquí..."
                      className="w-full border border-slate-300 rounded p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleSaveComment();
                        }
                      }}
                    />

                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCommentBox(false);
                          setCommentText('');
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveComment}
                        leftIcon={<Check className="w-4 h-4" />}
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel lateral de anotaciones */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col">
        <div className="bg-white border-b border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Todos los Comentarios ({annotations.length})
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Distribuidos en {numPages} páginas
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {annotations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                No hay comentarios en el documento.
                <br />
                Haz doble clic en el PDF para agregar uno.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Agrupar comentarios por página */}
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
                const pageAnnotations = annotations.filter(a => a.page === pageNum);
                if (pageAnnotations.length === 0) return null;

                return (
                  <div key={pageNum} className="border-l-4 border-primary pl-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-700">
                        Página {pageNum}
                      </h4>
                      <button
                        onClick={() => setCurrentPage(pageNum)}
                        className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1"
                      >
                        Ir a página →
                      </button>
                    </div>

                    <div className="space-y-2">
                      {pageAnnotations.map((anno) => (
                        <div
                          key={anno.id}
                          className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            currentPage === pageNum 
                              ? 'border-primary bg-primary/5' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            setSelectedAnnotation(anno);
                            setShowAnnotationPopup(true);
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border border-slate-300"
                                style={{ 
                                  backgroundColor: colors.find(c => c.value === anno.color)?.hex 
                                }}
                              />
                              <span className="text-xs font-medium text-slate-600">
                                {anno.author_name}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAnnotation(anno.id);
                              }}
                              className="text-slate-400 hover:text-red-600 transition-colors"
                              title="Eliminar comentario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {anno.selected_text && (
                            <div className="mb-2 p-2 bg-slate-50 rounded text-xs text-slate-600 italic">
                              "{anno.selected_text.substring(0, 60)}{anno.selected_text.length > 60 ? '...' : ''}"
                            </div>
                          )}

                          <p className="text-sm text-slate-700 mb-2 line-clamp-2">
                            {anno.comment}
                          </p>

                          <div className="text-xs text-slate-400">
                            {new Date(anno.created_at).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen total */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-600">
            <strong>Total de comentarios:</strong> {annotations.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Distribuidos en {numPages} páginas
          </div>
        </div>
      </div>

      {/* Popup Modal para ver detalles del comentario */}
      {showAnnotationPopup && selectedAnnotation && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowAnnotationPopup(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Detalle del Comentario</h3>
              </div>
              <button
                onClick={() => setShowAnnotationPopup(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Texto seleccionado */}
              {selectedAnnotation.selected_text && (
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
                    Texto Seleccionado
                  </label>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-700 italic">
                      "{selectedAnnotation.selected_text}"
                    </p>
                  </div>
                </div>
              )}

              {/* Comentario */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
                  Comentario
                </label>
                <div className="p-4 bg-white rounded-lg border-2 border-slate-200">
                  <p className="text-base text-slate-800 leading-relaxed">
                    {selectedAnnotation.comment}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">
                    Color
                  </label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-slate-300"
                      style={{ 
                        backgroundColor: selectedAnnotation.color === 'yellow' ? '#fbbf24' :
                                       selectedAnnotation.color === 'red' ? '#ef4444' :
                                       selectedAnnotation.color === 'green' ? '#22c55e' :
                                       '#3b82f6'
                      }}
                    />
                    <span className="text-sm text-slate-700 capitalize">
                      {selectedAnnotation.color === 'yellow' ? 'Amarillo' :
                       selectedAnnotation.color === 'red' ? 'Rojo' :
                       selectedAnnotation.color === 'green' ? 'Verde' : 'Azul'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">
                    Página
                  </label>
                  <span className="text-sm text-slate-700">
                    Página {selectedAnnotation.page}
                  </span>
                </div>
              </div>

              {/* Autor y Fecha */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{selectedAnnotation.author_name}</span>
                  </div>
                  <div className="text-slate-500">
                    {new Date(selectedAnnotation.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnnotationPopup(false)}
              >
                Cerrar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  handleDeleteAnnotation(selectedAnnotation.id);
                  setShowAnnotationPopup(false);
                }}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
