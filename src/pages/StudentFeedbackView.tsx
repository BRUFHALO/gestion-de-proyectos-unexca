import React, { useState } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  User } from
'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
interface Comment {
  id: string;
  page: number;
  type: 'correction' | 'suggestion' | 'approval';
  text: string;
  author: string;
  date: string;
  resolved?: boolean;
}
interface StudentFeedbackViewProps {
  projectId: number;
  onBack: () => void;
}
export function StudentFeedbackView({
  projectId,
  onBack
}: StudentFeedbackViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [message, setMessage] = useState('');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const totalPages = 42;
  // Datos de ejemplo del proyecto
  const project = {
    id: projectId,
    title: 'IA en Planificación Urbana',
    status: 'Aprobado',
    grade: 95,
    submittedDate: '12 Oct, 2024',
    evaluatedDate: '18 Oct, 2024',
    teacher: 'Prof. Martínez',
    methodology: 'Scrum',
    career: 'Ingeniería en Informática'
  };
  // Comentarios y correcciones del docente
  const comments: Comment[] = [
  {
    id: '1',
    page: 3,
    type: 'correction',
    text: 'La introducción necesita más contexto sobre el problema que se está resolviendo. Agregar estadísticas relevantes.',
    author: 'Prof. Martínez',
    date: '15 Oct, 2024',
    resolved: true
  },
  {
    id: '2',
    page: 8,
    type: 'suggestion',
    text: 'Considera agregar un diagrama de flujo para explicar mejor el proceso de implementación.',
    author: 'Prof. Martínez',
    date: '15 Oct, 2024',
    resolved: true
  },
  {
    id: '3',
    page: 12,
    type: 'correction',
    text: 'Las citas bibliográficas deben seguir el formato APA 7ma edición. Revisar todas las referencias.',
    author: 'Prof. Martínez',
    date: '16 Oct, 2024',
    resolved: true
  },
  {
    id: '4',
    page: 15,
    type: 'approval',
    text: 'Excelente análisis de los resultados. La metodología está bien aplicada.',
    author: 'Prof. Martínez',
    date: '17 Oct, 2024'
  },
  {
    id: '5',
    page: 20,
    type: 'suggestion',
    text: 'Podrías expandir las conclusiones con recomendaciones para trabajos futuros.',
    author: 'Prof. Martínez',
    date: '17 Oct, 2024',
    resolved: false
  }];

  // Mensajes del chat
  const [chatMessages, setChatMessages] = useState([
  {
    id: '1',
    sender: 'Prof. Martínez',
    text: 'He revisado tu proyecto. En general está muy bien, pero hay algunas correcciones que debes hacer.',
    time: '15 Oct, 10:30 AM',
    isMe: false
  },
  {
    id: '2',
    sender: 'Yo',
    text: 'Gracias profesor. Ya vi los comentarios, trabajaré en las correcciones.',
    time: '15 Oct, 11:45 AM',
    isMe: true
  },
  {
    id: '3',
    sender: 'Prof. Martínez',
    text: 'Perfecto. Recuerda que las citas deben estar en formato APA.',
    time: '15 Oct, 12:00 PM',
    isMe: false
  },
  {
    id: '4',
    sender: 'Yo',
    text: 'Entendido. Ya corregí las citas y agregué el diagrama de flujo que sugirió.',
    time: '16 Oct, 09:15 AM',
    isMe: true
  },
  {
    id: '5',
    sender: 'Prof. Martínez',
    text: '¡Excelente trabajo! El proyecto ha sido aprobado con 95 puntos.',
    time: '18 Oct, 02:30 PM',
    isMe: false
  }]
  );
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setChatMessages([
    ...chatMessages,
    {
      id: Date.now().toString(),
      sender: 'Yo',
      text: message,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isMe: true
    }]
    );
    setMessage('');
  };
  const getCommentIcon = (type: string) => {
    switch (type) {
      case 'correction':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'suggestion':
        return <MessageCircle className="w-4 h-4 text-yellow-500" />;
      case 'approval':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-slate-400" />;
    }
  };
  const getCommentBadge = (type: string) => {
    switch (type) {
      case 'correction':
        return <Badge variant="danger">Corrección</Badge>;
      case 'suggestion':
        return <Badge variant="warning">Sugerencia</Badge>;
      case 'approval':
        return <Badge variant="success">Aprobación</Badge>;
      default:
        return <Badge variant="default">Comentario</Badge>;
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aprobado':
        return (
          <Badge variant="success" className="text-sm px-3 py-1">
            Aprobado
          </Badge>);

      case 'Pendiente':
        return (
          <Badge variant="warning" className="text-sm px-3 py-1">
            En Revisión
          </Badge>);

      case 'Rechazado':
        return (
          <Badge variant="danger" className="text-sm px-3 py-1">
            Requiere Corrección
          </Badge>);

      default:
        return (
          <Badge variant="default" className="text-sm px-3 py-1">
            {status}
          </Badge>);

    }
  };
  const goToPage = (page: number) => {
    setCurrentPage(page);
    setActiveCommentId(null);
  };
  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}>

            Volver
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-slate-900">
                {project.title}
              </h1>
              {getStatusBadge(project.status)}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {project.teacher}
              </span>
              <span>•</span>
              <span>Entregado: {project.submittedDate}</span>
              <span>•</span>
              <span>Evaluado: {project.evaluatedDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {project.grade &&
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <span className="text-sm font-medium text-green-700">
                Calificación:
              </span>
              <span className="text-xl font-bold text-green-600">
                {project.grade}/100
              </span>
            </div>
          }
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}>

            Descargar PDF
          </Button>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Comments & Corrections */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Comentarios del Docente
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {comments.length} comentarios en total
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {comments.map((comment) =>
            <div
              key={comment.id}
              className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${activeCommentId === comment.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-slate-50'}`}
              onClick={() => {
                setActiveCommentId(comment.id);
                goToPage(comment.page);
              }}>

                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getCommentIcon(comment.type)}
                    {getCommentBadge(comment.type)}
                  </div>
                  <span className="text-xs text-slate-400">
                    Pág. {comment.page}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed mb-2">
                  {comment.text}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{comment.date}</span>
                  {comment.resolved !== undefined &&
                <span
                  className={`text-xs font-medium ${comment.resolved ? 'text-green-600' : 'text-yellow-600'}`}>

                      {comment.resolved ? '✓ Resuelto' : '○ Pendiente'}
                    </span>
                }
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-white rounded-lg border border-slate-100">
                <div className="text-lg font-bold text-red-600">
                  {comments.filter((c) => c.type === 'correction').length}
                </div>
                <div className="text-xs text-slate-500">Correcciones</div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-100">
                <div className="text-lg font-bold text-yellow-600">
                  {comments.filter((c) => c.type === 'suggestion').length}
                </div>
                <div className="text-xs text-slate-500">Sugerencias</div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-100">
                <div className="text-lg font-bold text-green-600">
                  {comments.filter((c) => c.type === 'approval').length}
                </div>
                <div className="text-xs text-slate-500">Aprobaciones</div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - PDF Viewer with Annotations */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* PDF Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30">

                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-600">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30">

                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Page indicators with comments */}
            <div className="flex items-center gap-1">
              {comments.filter((c) => c.page === currentPage).length > 0 &&
              <Badge variant="info" className="text-xs">
                  {comments.filter((c) => c.page === currentPage).length}{' '}
                  comentarios en esta página
                </Badge>
              }
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-1.5 rounded hover:bg-slate-100">

                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-600 w-12 text-center">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="p-1.5 rounded hover:bg-slate-100">

                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PDF Content */}
          <div className="flex-1 overflow-auto p-6 bg-slate-100/50">
            <div className="flex justify-center">
              <div
                className="bg-white shadow-lg relative"
                style={{
                  width: `${8.5 * (zoom / 100)}in`,
                  minHeight: `${11 * (zoom / 100)}in`
                }}>

                {/* Mock PDF Content with Annotations */}
                <div
                  className="p-12 h-full flex flex-col"
                  style={{
                    fontSize: `${zoom / 100}rem`
                  }}>

                  <div className="w-full h-16 border-b-2 border-primary mb-8 flex items-end pb-2 justify-between">
                    <span className="text-xs text-slate-400">
                      Biblioteca Digital UNEXCA
                    </span>
                    <span className="text-xs text-slate-400">
                      Página {currentPage}
                    </span>
                  </div>

                  <h1 className="text-3xl font-bold text-slate-900 mb-6">
                    {project.title}
                  </h1>

                  <div className="space-y-4 text-slate-700 text-justify leading-relaxed">
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                      ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>

                    {/* Show annotation markers for current page */}
                    {comments.
                    filter((c) => c.page === currentPage).
                    map((comment, index) =>
                    <div
                      key={comment.id}
                      className={`my-4 p-4 rounded-lg border-l-4 ${comment.type === 'correction' ? 'bg-red-50 border-red-400' : comment.type === 'suggestion' ? 'bg-yellow-50 border-yellow-400' : 'bg-green-50 border-green-400'} ${activeCommentId === comment.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}>

                          <div className="flex items-center gap-2 mb-2">
                            {getCommentIcon(comment.type)}
                            <span className="text-sm font-semibold text-slate-700">
                              {comment.author}
                            </span>
                            {getCommentBadge(comment.type)}
                          </div>
                          <p className="text-sm text-slate-600">
                            {comment.text}
                          </p>
                        </div>
                    )}

                    <p>
                      Duis aute irure dolor in reprehenderit in voluptate velit
                      esse cillum dolore eu fugiat nulla pariatur. Excepteur
                      sint occaecat cupidatat non proident, sunt in culpa qui
                      officia deserunt mollit anim id est laborum.
                    </p>

                    <div className="my-8 p-6 bg-slate-50 border-l-4 border-accent rounded-r-lg italic">
                      "La integración de herramientas digitales en entornos
                      académicos ha demostrado un aumento significativo en el
                      compromiso estudiantil y la calidad de los resultados de
                      investigación."
                    </div>

                    <p>
                      Sed ut perspiciatis unde omnis iste natus error sit
                      voluptatem accusantium doloremque laudantium, totam rem
                      aperiam, eaque ipsa quae ab illo inventore veritatis et
                      quasi architecto beatae vitae dicta sunt explicabo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <Avatar fallback={project.teacher} size="sm" />
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  {project.teacher}
                </h3>
                <span className="flex items-center text-xs text-green-600">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                  En línea
                </span>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {chatMessages.map((msg) =>
            <div
              key={msg.id}
              className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>

                <div
                className={`
                    max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm
                    ${msg.isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}
                  `}>

                  <p>{msg.text}</p>
                  <p
                  className={`text-[10px] mt-1 text-right ${msg.isMe ? 'text-primary-light/80' : 'text-slate-400'}`}>

                    {msg.time}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2">

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" />

              <Button
                type="submit"
                size="sm"
                className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
                disabled={!message.trim()}>

                <MessageSquare className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>);

}