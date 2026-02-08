import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';
import { 
  ArrowLeft, Download, MessageSquare, AlertCircle, CheckCircle, 
  Lightbulb, FileText, Send, User, Calendar, Tag
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { projectsAPI, feedbackAPI } from '../services/api';
import { PDFViewer } from '../components/PDFViewer';
import { AnnotationViewer } from '../components/AnnotationViewer';

interface ProjectDetailViewProps {
  projectId: string;
  onBack: () => void;
}

type FeedbackType = 'correction' | 'suggestion' | 'approval';

interface Feedback {
  id: string;
  type: FeedbackType;
  comment: string;
  page?: number;
  section?: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  anchor?: string;
  annotation_data?: any;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

export function ProjectDetailView({ projectId, onBack }: ProjectDetailViewProps) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (projectId) {
      loadProjectDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProjectDetails = async () => {
    if (!projectId) {
      showToast('error', 'ID de proyecto no válido');
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Timeout de seguridad
    const timeout = setTimeout(() => {
      setLoading(false);
      showToast('error', 'Tiempo de espera agotado al cargar el proyecto');
    }, 10000);

    try {
      console.log('Cargando proyecto:', projectId);
      const data = await projectsAPI.getById(projectId);
      clearTimeout(timeout);
      setProject(data);
      
      // Cargar feedbacks desde el backend
      try {
        const feedbackData: any = await feedbackAPI.getProjectFeedback(projectId);
        setFeedbacks(feedbackData.feedbacks || []);
      } catch (error) {
        console.error('Error al cargar feedbacks:', error);
      }
      
      // Cargar mensajes de chat desde el backend
      try {
        const chatData: any = await feedbackAPI.getChatMessages(projectId);
        setChatMessages(chatData.messages || []);
      } catch (error) {
        console.error('Error al cargar chat:', error);
      }
    } catch (error) {
      clearTimeout(timeout);
      console.error('Error al cargar proyecto:', error);
      showToast('error', 'Error al cargar los detalles del proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!projectId) {
      showToast('error', 'ID de proyecto no válido');
      return;
    }

    setSendingMessage(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!userData._id) {
        showToast('error', 'Usuario no autenticado');
        return;
      }

      console.log('Enviando mensaje:', { project_id: projectId, sender_id: userData._id });
      
      const response: any = await feedbackAPI.sendChatMessage({
        project_id: projectId,
        message: newMessage,
        sender_id: userData._id
      });
      
      if (response.success) {
        setChatMessages([...chatMessages, response.chat_message]);
        setNewMessage('');
        showToast('success', 'Mensaje enviado');
      }
    } catch (error: any) {
      console.error('Error al enviar mensaje:', error);
      showToast('error', error.message || 'Error al enviar mensaje');
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToAnchor = (anchor: string) => {
    // TODO: Implementar scroll al PDF en la sección específica
    showToast('info', `Navegando a: ${anchor}`);
  };

  const getFeedbackIcon = (type: FeedbackType) => {
    switch (type) {
      case 'correction':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'suggestion':
        return <Lightbulb className="w-5 h-5 text-yellow-600" />;
      case 'approval':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  const getFeedbackColor = (type: FeedbackType) => {
    switch (type) {
      case 'correction':
        return 'bg-red-50 border-red-200';
      case 'suggestion':
        return 'bg-yellow-50 border-yellow-200';
      case 'approval':
        return 'bg-green-50 border-green-200';
    }
  };

  const getFeedbackBadge = (type: FeedbackType) => {
    switch (type) {
      case 'correction':
        return <Badge variant="danger">Corrección</Badge>;
      case 'suggestion':
        return <Badge variant="warning">Sugerencia</Badge>;
      case 'approval':
        return <Badge variant="success">Aprobación</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-600">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">No se pudo cargar el proyecto</p>
          <Button onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const currentVersion = project.versions?.[project.metadata?.current_version - 1];
  const pdfFile = currentVersion?.files?.[0];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onBack}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
                <p className="text-sm text-slate-500 mt-1">{project.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={project.metadata?.status === 'approved' ? 'success' : 'warning'}>
                {project.metadata?.status === 'approved' ? 'Aprobado' : 'En Revisión'}
              </Badge>
              {pdfFile && (
                <Button
                  variant="outline"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => window.open(`/api/v1/projects/download/${pdfFile.file_id}`, '_blank')}
                >
                  Descargar PDF
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Principal - PDF y Feedback */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información del Proyecto */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Metodología</p>
                    <p className="font-medium text-slate-900">
                      {project.academic_info?.methodology || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Fecha de Entrega</p>
                    <p className="font-medium text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {formatDate(project.created_at)}
                    </p>
                  </div>
                  {project.academic_info?.keywords?.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-slate-500 mb-2">Palabras Clave</p>
                      <div className="flex flex-wrap gap-2">
                        {project.academic_info.keywords.map((keyword: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                          >
                            <Tag className="w-3 h-3" />
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Visor de PDF */}
            <Card className="h-[800px]">
              <CardContent className="p-0 h-full">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Documento del Proyecto
                  </h3>
                  {pdfFile && (
                    <p className="text-sm text-slate-500 mt-1">
                      {pdfFile.filename} • {(pdfFile.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
                {pdfFile ? (
                  <div className="h-[calc(100%-60px)]">
                    {showAnnotations && feedbacks.some(f => f.annotation_data) ? (
                      <AnnotationViewer
                        fileUrl={`${API_BASE_URL}/api/v1/projects/download/${pdfFile.file_id}`}
                        fileName={pdfFile.filename}
                        annotations={feedbacks}
                      />
                    ) : (
                      <PDFViewer
                        fileUrl={`${API_BASE_URL}/api/v1/projects/download/${pdfFile.file_id}`}
                        fileName={pdfFile.filename}
                        highlightedPages={feedbacks.map(f => f.page).filter((p): p is number => p !== undefined)}
                        annotations={feedbacks.map(f => ({
                          page: f.page || 1,
                          type: f.type,
                          x: 10,
                          y: 10,
                          comment: f.comment
                        }))}
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FileText className="w-12 h-12 text-slate-400" />
                    <p className="text-slate-500 ml-3">No hay PDF disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comentarios del Profesor */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Retroalimentación del Profesor
                </h3>
                
                {feedbacks.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Aún no hay comentarios del profesor</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Los comentarios aparecerán aquí cuando tu profesor evalúe el proyecto
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedbacks.map((feedback) => (
                      <div
                        key={feedback.id}
                        className={`border rounded-lg p-4 ${getFeedbackColor(feedback.type)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getFeedbackIcon(feedback.type)}
                            {getFeedbackBadge(feedback.type)}
                          </div>
                          {feedback.anchor && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => scrollToAnchor(feedback.anchor!)}
                              className="text-xs"
                            >
                              Ir a sección
                            </Button>
                          )}
                        </div>
                        <p className="text-slate-900 mb-2">{feedback.comment}</p>
                        {(feedback.page || feedback.section) && (
                          <p className="text-xs text-slate-500">
                            {feedback.page && `Página ${feedback.page}`}
                            {feedback.page && feedback.section && ' • '}
                            {feedback.section && `Sección: ${feedback.section}`}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{feedback.created_by_name}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-400">{formatDate(feedback.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Columna Lateral - Chat */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-0">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Chat con el Profesor
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Comunícate directamente con tu profesor
                  </p>
                </div>

                {/* Mensajes */}
                <div className="h-96 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No hay mensajes</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Inicia la conversación con tu profesor
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isOwnMessage = msg.sender_role === 'student';
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              isOwnMessage
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 text-slate-900'
                            }`}
                          >
                            <p className="text-sm font-medium mb-1">{msg.sender_name}</p>
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-xs mt-1 ${isOwnMessage ? 'text-white/70' : 'text-slate-500'}`}>
                              {formatDate(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input de Mensaje */}
                <div className="p-4 border-t border-slate-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      disabled={sendingMessage}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      leftIcon={<Send className="w-4 h-4" />}
                      size="sm"
                    >
                      Enviar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
