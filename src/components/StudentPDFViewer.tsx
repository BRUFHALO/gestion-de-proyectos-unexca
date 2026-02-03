import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
  MessageSquare, X, User, ArrowLeft
} from 'lucide-react';
import { Button } from './ui/Button';

// Configurar worker de PDF.js
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
  rect: number[];
  color: string;
  type: string;
  comment: string;
  selected_text?: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

interface StudentPDFViewerProps {
  projectId: string;
  onBack?: () => void;
}

export function StudentPDFViewer({ projectId, onBack }: StudentPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [showAnnotationPopup, setShowAnnotationPopup] = useState(false);

  const pageRef = useRef<HTMLDivElement>(null);

  const colors = [
    { name: 'Amarillo', value: 'yellow', hex: '#ffff00' },
    { name: 'Rojo', value: 'red', hex: '#ff0000' },
    { name: 'Verde', value: 'green', hex: '#00ff00' },
    { name: 'Azul', value: 'blue', hex: '#0000ff' }
  ];

  useEffect(() => {
    if (projectId) {
      console.log('useEffect ejecutado con projectId:', projectId);
      loadPDF();
      loadAnnotations();
    } else {
      console.warn('useEffect: projectId está vacío');
    }
  }, [projectId]);

  const loadPDF = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8005/api/v1/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Error al obtener información del proyecto');
      }
      let project = await response.json();
      
      // Si el API devuelve un array, tomar el primer elemento
      if (Array.isArray(project)) {
        console.log('API devolvió un array, tomando primer elemento');
        project = project[0];
      }
      
      console.log('Proyecto completo:', project);
      console.log('Metadata:', project.metadata);
      console.log('Versions:', project.versions);
      
      // Intentar obtener el archivo de diferentes maneras
      let pdfPath = null;
      
      // Opción 1: Desde versions array
      if (project.versions && project.versions.length > 0) {
        const currentVersionIndex = (project.metadata?.current_version || 1) - 1;
        const currentVersion = project.versions[currentVersionIndex];
        console.log('Current version:', currentVersion);
        
        if (currentVersion?.files && currentVersion.files.length > 0) {
          const file = currentVersion.files[0];
          console.log('File from version:', file);
          pdfPath = file.file_path || `projects/${projectId}/${file.file_id}`;
        }
      }
      
      // Opción 2: Desde file_path directo
      if (!pdfPath && project.file_path) {
        console.log('Using direct file_path:', project.file_path);
        pdfPath = project.file_path;
      }
      
      // Opción 3: Desde uploaded_files
      if (!pdfPath && project.uploaded_files && project.uploaded_files.length > 0) {
        const file = project.uploaded_files[0];
        console.log('File from uploaded_files:', file);
        pdfPath = file.file_path || `projects/${projectId}/${file.file_id}`;
      }
      
      if (!pdfPath) {
        console.error('No se pudo encontrar la ruta del PDF en ninguna ubicación');
        console.log('Estructura del proyecto:', JSON.stringify(project, null, 2));
        throw new Error('No se encontró el archivo del proyecto. Por favor, contacta al administrador.');
      }
      
      const fullUrl = `http://localhost:8005/uploads/${pdfPath}`;
      console.log('URL final del PDF:', fullUrl);
      setPdfUrl(fullUrl);
    } catch (error) {
      console.error('Error cargando PDF:', error);
      alert(`Error al cargar el documento PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnnotations = async () => {
    try {
      if (!projectId) {
        console.warn('No hay projectId para cargar anotaciones');
        return;
      }
      console.log('Cargando anotaciones para proyecto:', projectId);
      const response = await fetch(
        `http://localhost:8005/api/v1/pdf-evaluation/annotations/${projectId}`
      );
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Datos de anotaciones recibidos:', data);
        console.log('Número de anotaciones:', data.annotations?.length || 0);
        setAnnotations(data.annotations || []);
      } else {
        console.warn('No se pudieron cargar las anotaciones, status:', response.status);
      }
    } catch (error) {
      console.error('Error cargando anotaciones:', error);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF cargado exitosamente, número de páginas:', numPages);
    setNumPages(numPages);
    setIsLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error al cargar el documento PDF:', error);
    setIsLoading(false);
    alert(`Error al cargar el PDF: ${error.message}`);
  };

  const renderAnnotationOverlays = () => {
    if (!pageRef.current) return null;
    
    return annotations
      .filter(anno => anno.page === currentPage)
      .map(anno => {
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
              transform: 'translate(-50%, -50%)',
              zIndex: 20
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAnnotation(anno);
              setShowAnnotationPopup(true);
            }}
          >
            <div 
              className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg hover:scale-110 transition-transform"
              style={{
                backgroundColor: colorMap[anno.color] || colorMap.yellow,
                border: `3px solid ${colorMap[anno.color] || colorMap.yellow}`
              }}
            >
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            
            <div className="absolute left-10 top-0 bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Click para ver comentario
            </div>
          </div>
        );
      });
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <style>{pdfStyles}</style>
      
      <div className="flex-1 flex flex-col">
        {/* Toolbar superior */}
        <div className="bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onBack && (
                <Button variant="outline" size="sm" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Volver
                </Button>
              )}

              <div className="flex items-center gap-3 ml-4">
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

              {/* Botón temporal para recargar anotaciones */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Recargando anotaciones manualmente...');
                  loadAnnotations();
                }}
                leftIcon={<MessageSquare className="w-4 h-4" />}
              >
                Recargar Comentarios
              </Button>
            </div>
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
              <div ref={pageRef} className="relative bg-white shadow-2xl">
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={<div className="p-8">Cargando PDF...</div>}
                  error={<div className="p-8 text-red-600">Error al cargar el PDF</div>}
                  options={{
                    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                    cMapPacked: true,
                  }}
                >
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                  />
                </Document>

                {renderAnnotationOverlays()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel lateral de comentarios */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col">
        <div className="bg-white border-b border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comentarios del Profesor ({annotations.length})
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
                Aún no hay comentarios del profesor en este proyecto.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
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
            <div className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Comentario del Profesor</h3>
              </div>
              <button
                onClick={() => setShowAnnotationPopup(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
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

            <div className="bg-slate-50 px-6 py-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnnotationPopup(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
