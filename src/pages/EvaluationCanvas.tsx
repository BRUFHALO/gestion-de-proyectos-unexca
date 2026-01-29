import React, { useState } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle,
  Save,
  MousePointer2,
  Type,
  Square,
  Circle,
  ArrowRight as ArrowIcon,
  Highlighter,
  MessageCircle,
  Eraser,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  StickyNote,
  Pencil,
  Send,
  Paperclip,
  X } from
'lucide-react';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
interface EvaluationCanvasProps {
  onBack: () => void;
}
export function EvaluationCanvas({ onBack }: EvaluationCanvasProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [grade, setGrade] = useState('');
  const [activeTool, setActiveTool] = useState('cursor');
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [zoom, setZoom] = useState(100);
  const [message, setMessage] = useState('');
  const totalPages = 12;
  // Datos del proyecto
  const project = {
    title: 'Taller No2 Elementos Avanzados de BD y Modelado de BD',
    student: 'Bruno Palacios',
    ci: '30150650',
    section: 'Sección A',
    subject: 'MODELADO DE BASE DE DATOS',
    teacher: 'Vladimir Peña',
    semester: 'Trayecto III, semestre II'
  };
  // Herramientas de anotación
  const tools = [
  {
    id: 'cursor',
    icon: <MousePointer2 className="w-5 h-5" />,
    label: 'Seleccionar'
  },
  {
    id: 'pencil',
    icon: <Pencil className="w-5 h-5" />,
    label: 'Lápiz'
  },
  {
    id: 'highlighter',
    icon: <Highlighter className="w-5 h-5" />,
    label: 'Resaltador'
  },
  {
    id: 'text',
    icon: <Type className="w-5 h-5" />,
    label: 'Texto'
  },
  {
    id: 'rect',
    icon: <Square className="w-5 h-5" />,
    label: 'Rectángulo'
  },
  {
    id: 'circle',
    icon: <Circle className="w-5 h-5" />,
    label: 'Círculo'
  },
  {
    id: 'arrow',
    icon: <ArrowIcon className="w-5 h-5" />,
    label: 'Flecha'
  },
  {
    id: 'comment',
    icon: <MessageCircle className="w-5 h-5" />,
    label: 'Comentario'
  },
  {
    id: 'sticker',
    icon: <StickyNote className="w-5 h-5" />,
    label: 'Nota'
  },
  {
    id: 'eraser',
    icon: <Eraser className="w-5 h-5" />,
    label: 'Borrador'
  }];

  const colors = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#000000'];

  // Mensajes del chat
  const [chatMessages, setChatMessages] = useState([
  {
    id: '1',
    sender: 'Bruno Palacios',
    text: 'Profesor, ya subí el taller corregido.',
    time: '10:30 AM',
    isMe: false
  },
  {
    id: '2',
    sender: 'Yo',
    text: 'Perfecto, lo revisaré ahora.',
    time: '10:35 AM',
    isMe: true
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
  // Generar miniaturas de páginas
  const pageThumbnails = Array.from(
    {
      length: totalPages
    },
    (_, i) => i + 1
  );
  return (
    <div className="h-screen flex flex-col bg-slate-800 overflow-hidden">
      {/* Barra Superior con Herramientas */}
      <header className="bg-slate-900 border-b border-slate-700 px-4 py-2 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-slate-300 hover:text-white hover:bg-slate-700">

            Volver
          </Button>
          <div className="h-6 w-px bg-slate-600" />
          <div>
            <h1 className="text-sm font-semibold text-white">
              {project.title}
            </h1>
            <p className="text-xs text-slate-400">
              {project.student} • C.I: {project.ci} • {project.section}
            </p>
          </div>
        </div>

        {/* Herramientas de Anotación */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-2 py-1 border border-slate-600">
          {tools.map((tool) =>
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`
                p-2 rounded-lg transition-all duration-200 relative group
                ${activeTool === tool.id ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}
              `}
            title={tool.label}>

              {tool.icon}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-slate-600">
                {tool.label}
              </span>
            </button>
          )}

          <div className="w-px h-6 bg-slate-600 mx-2" />

          {/* Colores */}
          <div className="flex items-center gap-1">
            {colors.map((color) =>
            <button
              key={color}
              onClick={() => setActiveColor(color)}
              className={`
                  w-5 h-5 rounded-full transition-transform hover:scale-110
                  ${activeColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''}
                `}
              style={{
                backgroundColor: color
              }} />

            )}
          </div>

          <div className="w-px h-6 bg-slate-600 mx-2" />

          <button
            className="p-2 text-slate-400 hover:bg-slate-700 hover:text-white rounded-lg"
            title="Deshacer">

            <Undo className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-slate-400 hover:bg-slate-700 hover:text-white rounded-lg"
            title="Rehacer">

            <Redo className="w-5 h-5" />
          </button>
        </div>

        {/* Acciones de Evaluación */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-600">
            <span className="text-sm font-medium text-slate-300">
              Calificación:
            </span>
            <input
              type="text"
              placeholder="0-100"
              className="w-14 bg-transparent border-b border-slate-500 focus:border-accent focus:outline-none text-center font-bold text-white"
              value={grade}
              onChange={(e) => setGrade(e.target.value)} />

          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Save className="w-4 h-4" />}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">

            Guardar
          </Button>
          <Button
            size="sm"
            leftIcon={<CheckCircle className="w-4 h-4" />}
            className="bg-green-600 hover:bg-green-700 text-white">

            Enviar Evaluación
          </Button>
        </div>
      </header>

      {/* Contenido Principal - 3 Columnas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel Izquierdo - Miniaturas de Páginas */}
        <div className="w-48 bg-slate-900 border-r border-slate-700 flex flex-col shrink-0">
          {/* Iconos superiores */}
          <div className="p-2 border-b border-slate-700 flex gap-2">
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded">
              <ImageIcon className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded">
              <StickyNote className="w-4 h-4" />
            </button>
          </div>

          {/* Lista de Miniaturas */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
            {pageThumbnails.map((pageNum) =>
            <div
              key={pageNum}
              className={`cursor-pointer transition-all ${currentPage === pageNum ? 'scale-105' : 'hover:scale-102'}`}
              onClick={() => setCurrentPage(pageNum)}>

                <div
                className={`
                    bg-white rounded-sm overflow-hidden shadow-lg
                    ${currentPage === pageNum ? 'ring-2 ring-blue-500' : 'ring-1 ring-slate-600'}
                  `}>

                  {/* Miniatura del documento */}
                  <div className="aspect-[8.5/11] bg-white p-2 text-[4px] leading-tight">
                    {pageNum === 1 ?
                  <div className="h-full flex flex-col items-center justify-center text-center">
                        <p className="font-bold text-[3px] mb-1">
                          República Bolivariana de Venezuela
                        </p>
                        <p className="text-[2.5px]">
                          Ministerio del Poder Popular para la Educación
                          Superior
                        </p>
                        <p className="text-[2.5px]">
                          Universidad Nacional Experimental de la Gran Caracas
                          "UNEXCA"
                        </p>
                        <p className="text-[2.5px] mt-2">{project.semester}</p>
                        <p className="text-[2.5px]">
                          Unidad Curricular: {project.subject}
                        </p>
                        <p className="font-bold text-[3.5px] mt-4">
                          {project.title}
                        </p>
                        <div className="mt-4 text-[2.5px]">
                          <p>Docente: {project.teacher}</p>
                          <p>Estudiante: {project.student}</p>
                          <p>C.I: {project.ci}</p>
                        </div>
                      </div> :

                  <div className="h-full">
                        <div className="h-1 bg-slate-200 w-3/4 mb-1"></div>
                        <div className="h-0.5 bg-slate-100 w-full mb-0.5"></div>
                        <div className="h-0.5 bg-slate-100 w-full mb-0.5"></div>
                        <div className="h-0.5 bg-slate-100 w-5/6 mb-1"></div>
                        <div className="h-0.5 bg-slate-100 w-full mb-0.5"></div>
                        <div className="h-0.5 bg-slate-100 w-full mb-0.5"></div>
                        <div className="h-0.5 bg-slate-100 w-4/5 mb-1"></div>
                        {pageNum % 2 === 0 &&
                    <div className="h-4 bg-slate-50 border border-slate-200 mt-1"></div>
                    }
                      </div>
                  }
                  </div>
                </div>
                <p
                className={`text-center text-xs mt-1 ${currentPage === pageNum ? 'text-blue-400 font-medium' : 'text-slate-500'}`}>

                  {pageNum}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel Central - Documento PDF */}
        <div className="flex-1 flex flex-col bg-slate-700 min-w-0">
          {/* Controles de Zoom */}
          <div className="flex items-center justify-center gap-4 py-2 bg-slate-800 border-b border-slate-600">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded">

              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-300 w-16 text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded">

              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-slate-500 mx-4">|</span>
            <span className="text-sm text-slate-400">
              Página {currentPage} de {totalPages}
            </span>
          </div>

          {/* Área del Documento */}
          <div className="flex-1 overflow-auto p-8 flex justify-center">
            <div
              className="bg-white shadow-2xl transition-all duration-200"
              style={{
                width: `${8.5 * (zoom / 100) * 96}px`,
                minHeight: `${11 * (zoom / 100) * 96}px`
              }}>

              {/* Contenido del Documento */}
              <div
                className="p-16 h-full"
                style={{
                  fontSize: `${14 * (zoom / 100)}px`
                }}>

                {currentPage === 1 ?
                // Portada
                <div className="h-full flex flex-col items-center text-center">
                    <p className="font-bold text-sm mb-1">
                      República Bolivariana de Venezuela
                    </p>
                    <p className="text-sm">
                      Ministerio del Poder Popular para la Educación Superior
                    </p>
                    <p className="text-sm">
                      Universidad Nacional Experimental de la Gran Caracas
                      "UNEXCA"
                    </p>
                    <p className="text-sm mt-2">{project.semester}</p>
                    <p className="text-sm">
                      Unidad Curricular: {project.subject}
                    </p>

                    <h1 className="text-xl font-bold mt-16 mb-16 max-w-md">
                      {project.title}
                    </h1>

                    <div className="mt-auto mb-16 w-full flex justify-between px-8">
                      <div className="text-left">
                        <p>
                          <span className="font-semibold">Docente:</span>{' '}
                          {project.teacher}
                        </p>
                      </div>
                      <div className="text-left">
                        <p>
                          <span className="font-semibold">Estudiante:</span>{' '}
                          {project.student}
                        </p>
                        <p>C.I: {project.ci}</p>
                      </div>
                    </div>

                    <p className="mt-auto font-semibold">
                      Caracas enero del 2026
                    </p>
                  </div> :

                // Páginas de contenido
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">
                      {currentPage === 2 ?
                    'Introducción' :
                    currentPage === 3 ?
                    'Marco Teórico' :
                    currentPage === 4 ?
                    'Desarrollo' :
                    `Sección ${currentPage - 1}`}
                    </h2>

                    <p className="text-slate-700 leading-relaxed text-justify">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                      ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>

                    <p className="text-slate-700 leading-relaxed text-justify">
                      Duis aute irure dolor in reprehenderit in voluptate velit
                      esse cillum dolore eu fugiat nulla pariatur. Excepteur
                      sint occaecat cupidatat non proident, sunt in culpa qui
                      officia deserunt mollit anim id est laborum.
                    </p>

                    {currentPage % 2 === 0 &&
                  <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded">
                        <p className="text-sm text-slate-600 font-mono">
                          SELECT * FROM tabla WHERE condicion = 'valor';
                        </p>
                      </div>
                  }

                    <p className="text-slate-700 leading-relaxed text-justify">
                      Sed ut perspiciatis unde omnis iste natus error sit
                      voluptatem accusantium doloremque laudantium, totam rem
                      aperiam, eaque ipsa quae ab illo inventore veritatis et
                      quasi architecto beatae vitae dicta sunt explicabo.
                    </p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Chat */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
          {/* Header del Chat */}
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <Avatar fallback={project.student} size="sm" />
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  {project.student}
                </h3>
                <span className="flex items-center text-xs text-green-600">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                  En línea
                </span>
              </div>
            </div>
          </div>

          {/* Mensajes */}
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

          {/* Input del Chat */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2">

              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-2">

                <Paperclip className="w-5 h-5" />
              </button>
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

                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>);

}