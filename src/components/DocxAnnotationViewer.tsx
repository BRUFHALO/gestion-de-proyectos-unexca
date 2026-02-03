import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Highlighter, AlertCircle, CheckCircle, 
  X, Send, Download, FileDown, Save
} from 'lucide-react';
import { Button } from './ui/Button';

interface DocxAnnotationViewerProps {
  projectId: string;
  onSave?: (annotations: any[]) => void;
}

interface Comment {
  id: string;
  text: string;
  type: 'error' | 'suggestion' | 'comment';
  selectedText: string;
  position: { top: number; left: number };
  paragraphId?: string;
  anchorId?: string;  // ID del elemento HTML donde se colocó el comentario
  timestamp: string;
}

export function DocxAnnotationViewer({ projectId, onSave }: DocxAnnotationViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentPosition, setCommentPosition] = useState({ top: 0, left: 0 });
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'error' | 'suggestion' | 'comment'>('comment');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(100);
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDocument();
  }, [projectId]);

  useEffect(() => {
    // Calcular número de páginas después de cargar el contenido
    if (htmlContent && contentRef.current) {
      setTimeout(() => {
        const pageHeight = 297 * 3.7795275591; // 297mm en pixels (aprox)
        const contentHeight = contentRef.current?.scrollHeight || 0;
        const calculatedPages = Math.ceil(contentHeight / pageHeight);
        setTotalPages(Math.max(1, calculatedPages));
      }, 100);
    }
  }, [htmlContent]);

  const loadDocument = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8005/api/v1/docx/parse/${projectId}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Error cargando documento');
      }
      
      const data = await response.json();
      setHtmlContent(data.html);
      
      // Cargar comentarios existentes desde la base de datos
      try {
        const commentsResponse = await fetch(`http://localhost:8005/api/v1/docx/annotations/${projectId}`);
        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          console.log('Comentarios cargados desde BD:', commentsData);
          
          if (commentsData.annotations && commentsData.annotations.length > 0) {
            // Convertir formato de BD a formato del componente
            const loadedComments = commentsData.annotations.map((anno: any) => ({
              id: anno.id,
              text: anno.text_content,
              type: anno.type,
              selectedText: anno.selected_text,
              position: anno.position,
              anchorId: anno.anchor_id || '',
              timestamp: anno.created_at
            }));
            
            setComments(loadedComments);
            console.log('Comentarios procesados:', loadedComments);
            
            // Resaltar el texto de cada comentario cargado después de que el DOM esté listo
            setTimeout(() => {
              console.log('Intentando resaltar comentarios cargados...');
              console.log('contentRef.current:', contentRef.current);
              
              loadedComments.forEach((comment: any) => {
                console.log('Resaltando comentario:', comment.id, 'Texto:', comment.selectedText);
                highlightLoadedComment(comment);
              });
            }, 1500); // Aumentado a 1.5 segundos para asegurar que el DOM esté listo
          }
        }
      } catch (error) {
        console.error('Error cargando comentarios:', error);
      }
      
    } catch (error) {
      console.error('Error cargando documento:', error);
      alert('Error al cargar el documento.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSelection = () => {
    // Pequeño delay para asegurar que la selección está completa
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        return;
      }

      const text = selection.toString().trim();
      if (text.length === 0) return;

      console.log('Texto seleccionado:', text);
      setSelectedText(text);
      
      // Obtener posición de la selección en viewport
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Encontrar el elemento padre más cercano (párrafo, heading, etc.)
      const container = range.commonAncestorContainer;
      const parentElement = container.nodeType === Node.TEXT_NODE 
        ? container.parentElement 
        : container as HTMLElement;
      
      // Buscar el elemento de bloque más cercano (p, h1, h2, etc.)
      let anchorElement = parentElement;
      while (anchorElement && !['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'DIV'].includes(anchorElement.tagName)) {
        anchorElement = anchorElement.parentElement;
      }
      
      // Crear o obtener ID único para el elemento
      let anchorId = '';
      if (anchorElement) {
        if (!anchorElement.id) {
          anchorElement.id = `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        anchorId = anchorElement.id;
      }
      
      console.log('Elemento ancla:', anchorId);
      
      // Guardar el anchorId en el state para usarlo al crear el comentario
      (window as any).currentAnchorId = anchorId;
      
      // Obtener posición relativa al contenedor del documento
      const contentContainer = contentRef.current;
      if (!contentContainer) return;
      
      const containerRect = contentContainer.getBoundingClientRect();
      
      // Calcular posición relativa al documento (absolute positioning)
      // Usar la posición del texto seleccionado relativa al contenedor
      let top = rect.top - containerRect.top + 10; // Posición del inicio del texto
      let left = rect.right - containerRect.left + 10; // A la derecha del texto
      
      // Ajustar si se sale del contenedor
      const boxWidth = 360;
      const boxHeight = 400;
      const containerWidth = containerRect.width;
      
      // Si la caja se sale por la derecha, ponerla a la izquierda del texto
      if (left + boxWidth > containerWidth) {
        left = rect.left - containerRect.left - boxWidth - 10;
      }
      
      // Si aún se sale por la izquierda, centrarla
      if (left < 0) {
        left = (containerWidth - boxWidth) / 2;
      }
      
      // Si se sale por abajo, moverla hacia arriba
      if (top + boxHeight > containerRect.height) {
        top = Math.max(10, containerRect.height - boxHeight - 10);
      }
      
      console.log('Posición de la caja:', { top, left, rect, containerRect });
      
      setCommentPosition({ top, left });
      setShowCommentBox(true);
      setNewComment('');
    }, 10);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedText) {
      alert('Por favor escribe un comentario y selecciona texto');
      return;
    }

    const anchorId = (window as any).currentAnchorId || '';

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      text: newComment.trim(),
      type: commentType,
      selectedText: selectedText.trim(),
      position: commentPosition,
      anchorId: anchorId,
      timestamp: new Date().toISOString()
    };

    console.log('Agregando comentario con ancla:', comment);
    setComments([...comments, comment]);
    
    // Resaltar el texto seleccionado
    highlightSelectedText(comment.id);
    
    // Limpiar
    setNewComment('');
    setShowCommentBox(false);
    window.getSelection()?.removeAllRanges();
  };

  const highlightSelectedText = (commentId: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = 'text-commented';
    span.setAttribute('data-comment-id', commentId);
    span.style.backgroundColor = getHighlightColor(commentType);
    span.style.borderBottom = `2px solid ${getBorderColor(commentType)}`;
    span.style.cursor = 'pointer';
    
    try {
      range.surroundContents(span);
      
      // Agregar evento click para navegar al comentario
      span.addEventListener('click', (e) => {
        e.stopPropagation();
        setActiveCommentId(commentId);
        
        // Scroll al comentario en la lista
        const commentCard = document.getElementById(`comment-card-${commentId}`);
        if (commentCard) {
          commentCard.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
          });
          
          // Resaltar temporalmente el comentario
          commentCard.style.transform = 'scale(1.02)';
          commentCard.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
          
          setTimeout(() => {
            commentCard.style.transform = '';
            commentCard.style.boxShadow = '';
          }, 1500);
        }
      });
    } catch (e) {
      console.error('Error resaltando texto:', e);
    }
  };

  const highlightLoadedComment = (comment: Comment) => {
    // Buscar el texto en el documento y resaltarlo
    if (!contentRef.current || !comment.selectedText) {
      console.warn('No se puede resaltar comentario:', comment.id, 'contentRef o selectedText no disponible');
      return;
    }
    
    console.log('Buscando texto para resaltar:', comment.selectedText);
    
    try {
      // Primero intentar encontrar por anchorId si existe
      if (comment.anchorId) {
        const anchorElement = document.getElementById(comment.anchorId);
        if (anchorElement) {
          console.log('Elemento ancla encontrado:', comment.anchorId);
          // Buscar el texto dentro del elemento ancla
          const walker = document.createTreeWalker(
            anchorElement,
            NodeFilter.SHOW_TEXT,
            null
          );
          
          let node;
          while ((node = walker.nextNode())) {
            const text = node.textContent || '';
            const index = text.indexOf(comment.selectedText);
            
            if (index !== -1) {
              const range = document.createRange();
              range.setStart(node, index);
              range.setEnd(node, index + comment.selectedText.length);
              
              const span = document.createElement('span');
              span.className = 'text-commented';
              span.setAttribute('data-comment-id', comment.id);
              span.style.backgroundColor = getHighlightColor(comment.type);
              span.style.borderBottom = `2px solid ${getBorderColor(comment.type)}`;
              span.style.cursor = 'pointer';
              
              try {
                range.surroundContents(span);
                addClickEventToHighlight(span, comment.id);
                console.log('✅ Texto resaltado exitosamente:', comment.selectedText);
                return; // Éxito
              } catch (e) {
                console.error('Error aplicando resaltado en ancla:', e);
              }
            }
          }
        } else {
          console.warn('Elemento ancla no encontrado:', comment.anchorId);
        }
      }
      
      // Si no se encontró por ancla, buscar en todo el documento
      console.log('Buscando en todo el documento...');
      const walker = document.createTreeWalker(
        contentRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent || '';
        const index = text.indexOf(comment.selectedText);
        
        if (index !== -1) {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + comment.selectedText.length);
          
          const span = document.createElement('span');
          span.className = 'text-commented';
          span.setAttribute('data-comment-id', comment.id);
          span.style.backgroundColor = getHighlightColor(comment.type);
          span.style.borderBottom = `2px solid ${getBorderColor(comment.type)}`;
          span.style.cursor = 'pointer';
          
          try {
            range.surroundContents(span);
            addClickEventToHighlight(span, comment.id);
            console.log('✅ Texto resaltado exitosamente (búsqueda global):', comment.selectedText);
            return; // Solo resaltar la primera ocurrencia
          } catch (e) {
            console.error('Error aplicando resaltado:', e);
          }
        }
      }
      
      console.warn('❌ No se pudo encontrar el texto para resaltar:', comment.selectedText);
    } catch (error) {
      console.error('Error buscando texto para resaltar:', error);
    }
  };

  const addClickEventToHighlight = (span: HTMLElement, commentId: string) => {
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      setActiveCommentId(commentId);
      
      const commentCard = document.getElementById(`comment-card-${commentId}`);
      if (commentCard) {
        commentCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        commentCard.style.transform = 'scale(1.02)';
        commentCard.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
        setTimeout(() => {
          commentCard.style.transform = '';
          commentCard.style.boxShadow = '';
        }, 1500);
      }
    });
  };

  const getHighlightColor = (type: string) => {
    switch (type) {
      case 'error': return '#ffebee';
      case 'suggestion': return '#e3f2fd';
      case 'comment': return '#fff9e6';
      default: return '#fff9e6';
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'error': return '#f44336';
      case 'suggestion': return '#2196f3';
      case 'comment': return '#ffc107';
      default: return '#ffc107';
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      // Eliminar de la base de datos
      const response = await fetch('http://localhost:8005/api/v1/docx/annotations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          annotations: comments.filter(c => c.id !== commentId).map(c => ({
            id: c.id,
            type: c.type,
            text_content: c.text.trim(),
            selected_text: c.selectedText.trim(),
            position: {
              top: c.position.top,
              left: c.position.left
            },
            paragraph_id: c.paragraphId || null,
            anchor_id: c.anchorId || null,
            created_by: 'teacher',
            created_at: c.timestamp
          }))
        })
      });
      
      if (!response.ok) {
        throw new Error('Error eliminando comentario');
      }
      
      // Eliminar del estado local
      setComments(comments.filter(c => c.id !== commentId));
      
      // Remover resaltado
      const highlightedElement = document.querySelector(`[data-comment-id="${commentId}"]`);
      if (highlightedElement) {
        const parent = highlightedElement.parentNode;
        while (highlightedElement.firstChild) {
          parent?.insertBefore(highlightedElement.firstChild, highlightedElement);
        }
        parent?.removeChild(highlightedElement);
      }
      
      setActiveCommentId(null);
      console.log('Comentario eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando comentario:', error);
      alert('Error al eliminar el comentario');
    }
  };

  const handleSaveAnnotations = async () => {
    try {
      // Filtrar comentarios válidos (que tengan todos los campos requeridos)
      const validComments = comments.filter(c => {
        const isValid = c.text && c.text.trim() !== '' && 
                       c.selectedText && c.selectedText.trim() !== '' &&
                       c.timestamp;
        if (!isValid) {
          console.warn('Comentario inválido ignorado:', c);
        }
        return isValid;
      });
      
      if (validComments.length === 0) {
        alert('No hay comentarios válidos para guardar');
        return;
      }
      
      const payload = {
        project_id: projectId,
        annotations: validComments.map(c => ({
          id: c.id,
          type: c.type,
          text_content: c.text.trim(),
          selected_text: c.selectedText.trim(),
          position: {
            top: c.position.top,
            left: c.position.left
          },
          paragraph_id: c.paragraphId || null,
          anchor_id: c.anchorId || null,
          created_by: 'teacher',
          created_at: c.timestamp
        }))
      };
      
      console.log('=== ENVIANDO DATOS AL BACKEND ===');
      console.log('Project ID:', projectId);
      console.log('Número de comentarios:', comments.length);
      console.log('Payload completo:', JSON.stringify(payload, null, 2));
      console.log('================================');
      
      const response = await fetch('http://localhost:8005/api/v1/docx/annotations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
        throw new Error('Error guardando comentarios');
      }
      
      alert('Comentarios guardados exitosamente');
      
      if (onSave) {
        onSave(comments);
      }
    } catch (error) {
      console.error('Error guardando comentarios:', error);
      alert('Error al guardar los comentarios');
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

  return (
    <div className="flex h-full bg-slate-50">
      {/* Área principal del documento */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">
              Documento DOCX - Evaluación
            </span>
          </div>

          <div className="flex items-center gap-2">
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

            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAnnotations}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Guardar Comentarios
            </Button>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <p className="text-sm text-blue-800">
            💡 <strong>Cómo usar:</strong> Selecciona cualquier texto del documento para agregar un comentario, error o sugerencia.
          </p>
        </div>

        {/* Contenido del documento */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
                <p className="text-slate-600">Cargando documento...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              {/* Controles de página */}
              <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm sticky top-0 z-10">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  ← Anterior
                </button>
                <span className="text-sm font-medium">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  Siguiente →
                </button>
                <div className="border-l pl-4 ml-2 flex items-center gap-2">
                  <button
                    onClick={() => setScale(Math.max(50, scale - 10))}
                    className="px-2 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded"
                  >
                    -
                  </button>
                  <span className="text-sm w-12 text-center">{scale}%</span>
                  <button
                    onClick={() => setScale(Math.min(150, scale + 10))}
                    className="px-2 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Páginas del documento */}
              <div 
                ref={contentRef}
                className="document-pages"
                style={{
                  transform: `scale(${scale / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s'
                }}
                onMouseUp={handleTextSelection}
              >
                {/* Contenido HTML del documento con paginación */}
                <div 
                  className="document-page bg-white shadow-xl"
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    padding: '25mm 20mm',
                    margin: '0 auto',
                    boxSizing: 'border-box',
                    pageBreakAfter: 'always',
                    position: 'relative'
                  }}
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />

                {/* Caja de comentario flotante */}
                {showCommentBox && (
                  <div 
                    className="absolute bg-white rounded-lg shadow-2xl border-2 border-primary p-4"
                    style={{
                      top: `${commentPosition.top}px`,
                      left: `${commentPosition.left}px`,
                      width: '360px',
                      zIndex: 9999,
                      maxHeight: '500px',
                      overflow: 'auto'
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-700">
                        Agregar comentario
                      </span>
                      <button
                        onClick={() => setShowCommentBox(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs text-slate-500 mb-1">Texto seleccionado:</div>
                      <div className="text-sm bg-slate-50 p-2 rounded border border-slate-200 max-h-20 overflow-auto">
                        "{selectedText}"
                      </div>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setCommentType('error')}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                          commentType === 'error'
                            ? 'bg-red-100 text-red-700 border-2 border-red-500'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        Error
                      </button>
                      <button
                        onClick={() => setCommentType('suggestion')}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                          commentType === 'suggestion'
                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Sugerencia
                      </button>
                      <button
                        onClick={() => setCommentType('comment')}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                          commentType === 'comment'
                            ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        Comentario
                      </button>
                    </div>

                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escribe tu comentario aquí..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows={3}
                      autoFocus
                    />

                    <div className="flex justify-end gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCommentBox(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddComment}
                        leftIcon={<Send className="w-4 h-4" />}
                        disabled={!newComment.trim()}
                      >
                        Agregar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel lateral de comentarios a la derecha */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            Comentarios ({comments.length})
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  No hay comentarios aún.
                  <br />
                  Selecciona texto para agregar uno.
                </p>
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  id={`comment-card-${comment.id}`}
                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    activeCommentId === comment.id
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  style={{ transition: 'all 0.3s ease' }}
                  onClick={() => {
                    setActiveCommentId(comment.id);
                    
                    // Scroll automático a la sección vinculada
                    if (comment.anchorId) {
                      const anchorElement = document.getElementById(comment.anchorId);
                      if (anchorElement) {
                        // Scroll suave a la sección
                        anchorElement.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'center' 
                        });
                        
                        // Resaltar temporalmente la sección
                        anchorElement.style.backgroundColor = '#fff4cc';
                        anchorElement.style.transition = 'background-color 0.3s';
                        
                        setTimeout(() => {
                          anchorElement.style.backgroundColor = '';
                        }, 2000);
                      } else {
                        console.warn('No se encontró el elemento ancla:', comment.anchorId);
                      }
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {comment.type === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      {comment.type === 'suggestion' && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                      {comment.type === 'comment' && (
                        <MessageSquare className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className="text-xs font-medium text-slate-600 capitalize">
                        {comment.type === 'error' ? 'Error' : comment.type === 'suggestion' ? 'Sugerencia' : 'Comentario'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteComment(comment.id);
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 mb-2 bg-slate-50 p-2 rounded max-h-16 overflow-hidden">
                    "{comment.selectedText}"
                  </div>

                  <p className="text-sm text-slate-700 line-clamp-3">{comment.text}</p>

                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                    <span>{new Date(comment.timestamp).toLocaleString('es-ES')}</span>
                    {comment.anchorId && (
                      <span className="flex items-center gap-1 text-primary">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Vinculado
                      </span>
                    )}
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
