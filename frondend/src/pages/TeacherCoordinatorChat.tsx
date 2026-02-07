import React, { useState, useRef } from 'react';
import {
  Send,
  Paperclip,
  FileText,
  Download,
  X,
  Upload,
  File,
  Image as ImageIcon,
  CheckCircle,
  Clock } from
'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
interface TeacherCoordinatorChatProps {
  user: any;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}
interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  date: string;
  isMe: boolean;
  attachments?: {
    name: string;
    type: 'pdf' | 'image' | 'doc';
    size: string;
    url?: string;
  }[];
}
interface ReportStatus {
  id: number;
  name: string;
  date: string;
  status: 'enviado' | 'recibido' | 'revisado';
}
export function TeacherCoordinatorChat({
  user,
  onLogout,
  onNavigate
}: TeacherCoordinatorChatProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coordinator = {
    name: 'Dra. Carmen López',
    role: 'Coordinadora Académica',
    email: 'carmen@unexca.edu.ve',
    status: 'En línea'
  };
  const [messages, setMessages] = useState<ChatMessage[]>([
  {
    id: '1',
    sender: 'Dra. Carmen López',
    text: 'Buenos días Prof. Martínez, ¿cómo va el proceso de evaluación de los proyectos de este semestre?',
    time: '10:30 AM',
    date: 'Ayer',
    isMe: false
  },
  {
    id: '2',
    sender: user.name,
    text: 'Buenos días Dra. López. Ya tengo 8 proyectos evaluados de los 12 asignados. Le adjunto el reporte de avance.',
    time: '11:15 AM',
    date: 'Ayer',
    isMe: true,
    attachments: [
    {
      name: 'Reporte_Avance_Semana3.pdf',
      type: 'pdf',
      size: '245 KB'
    }]

  },
  {
    id: '3',
    sender: 'Dra. Carmen López',
    text: 'Excelente, recibido. Recuerde que la fecha límite para completar todas las evaluaciones es el viernes.',
    time: '11:20 AM',
    date: 'Ayer',
    isMe: false
  },
  {
    id: '4',
    sender: user.name,
    text: 'Entendido, estaré enviando el reporte final antes del viernes.',
    time: '11:25 AM',
    date: 'Ayer',
    isMe: true
  },
  {
    id: '5',
    sender: 'Dra. Carmen López',
    text: '¿Hay algún proyecto que presente dificultades o requiera atención especial?',
    time: '09:00 AM',
    date: 'Hoy',
    isMe: false
  }]
  );
  // Reportes enviados
  const reportHistory: ReportStatus[] = [
  {
    id: 1,
    name: 'Reporte_Avance_Semana1.pdf',
    date: '10 Ene, 2025',
    status: 'revisado'
  },
  {
    id: 2,
    name: 'Reporte_Avance_Semana2.pdf',
    date: '17 Ene, 2025',
    status: 'revisado'
  },
  {
    id: 3,
    name: 'Reporte_Avance_Semana3.pdf',
    date: '24 Ene, 2025',
    status: 'recibido'
  }];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments((prev) => [...prev, ...Array.from(files)]);
    }
  };
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && attachments.length === 0) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: user.name,
      text: message,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      date: 'Hoy',
      isMe: true,
      attachments:
      attachments.length > 0 ?
      attachments.map((file) => ({
        name: file.name,
        type: file.name.endsWith('.pdf') ?
        'pdf' :
        file.name.match(/\.(jpg|jpeg|png|gif)$/i) ?
        'image' :
        'doc',
        size: `${(file.size / 1024).toFixed(0)} KB`
      })) :
      undefined
    };
    setMessages((prev) => [...prev, newMessage]);
    setMessage('');
    setAttachments([]);
  };
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <File className="w-5 h-5 text-slate-500" />;
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enviado':
        return <Badge variant="warning">Enviado</Badge>;
      case 'recibido':
        return <Badge variant="info">Recibido</Badge>;
      case 'revisado':
        return <Badge variant="success">Revisado</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };
  // Agrupar mensajes por fecha
  const groupedMessages = messages.reduce(
    (groups: Record<string, ChatMessage[]>, msg) => {
      if (!groups[msg.date]) {
        groups[msg.date] = [];
      }
      groups[msg.date].push(msg);
      return groups;
    },
    {}
  );
  return (
    <MainLayout
      role="teacher"
      currentPage="teacher-coordinator-chat"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={user}
      title="Chat con Coordinador">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
        {/* Panel de Chat Principal */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          {/* Header del Chat */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar fallback={coordinator.name} size="md" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {coordinator.name}
                </h3>
                <p className="text-xs text-slate-500">{coordinator.role}</p>
                <span className="text-xs text-green-600">
                  {coordinator.status}
                </span>
              </div>
            </div>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
            {Object.entries(groupedMessages).map(([date, msgs]) =>
            <div key={date}>
                {/* Separador de fecha */}
                <div className="flex items-center justify-center mb-4">
                  <span className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full">
                    {date}
                  </span>
                </div>

                {/* Mensajes del día */}
                <div className="space-y-4">
                  {msgs.map((msg) =>
                <div
                  key={msg.id}
                  className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>

                      <div
                    className={`max-w-[75%] ${msg.isMe ? 'order-2' : 'order-1'}`}>

                        <div
                      className={`
                            rounded-2xl px-4 py-3 text-sm shadow-sm
                            ${msg.isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}
                          `}>

                          <p className="leading-relaxed">{msg.text}</p>

                          {/* Archivos adjuntos */}
                          {msg.attachments && msg.attachments.length > 0 &&
                      <div className="mt-3 space-y-2">
                              {msg.attachments.map((file, idx) =>
                        <div
                          key={idx}
                          className={`
                                    flex items-center gap-2 p-2 rounded-lg cursor-pointer
                                    ${msg.isMe ? 'bg-primary-dark/30 hover:bg-primary-dark/50' : 'bg-slate-100 hover:bg-slate-200'}
                                  `}>

                                  {getFileIcon(file.type)}
                                  <div className="flex-1 min-w-0">
                                    <p
                              className={`text-xs font-medium truncate ${msg.isMe ? 'text-white' : 'text-slate-700'}`}>

                                      {file.name}
                                    </p>
                                    <p
                              className={`text-[10px] ${msg.isMe ? 'text-primary-light/70' : 'text-slate-400'}`}>

                                      {file.size}
                                    </p>
                                  </div>
                                  <Download
                            className={`w-4 h-4 ${msg.isMe ? 'text-white/70' : 'text-slate-400'}`} />

                                </div>
                        )}
                            </div>
                      }
                        </div>
                        <p
                      className={`text-[10px] mt-1 ${msg.isMe ? 'text-right' : 'text-left'} text-slate-400`}>

                          {msg.time}
                        </p>
                      </div>
                    </div>
                )}
                </div>
              </div>
            )}
          </div>

          {/* Archivos adjuntos pendientes */}
          {attachments.length > 0 &&
          <div className="px-4 py-2 bg-slate-100 border-t border-slate-200">
              <p className="text-xs text-slate-500 mb-2">Archivos adjuntos:</p>
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) =>
              <div
                key={index}
                className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">

                    {getFileIcon(file.name.endsWith('.pdf') ? 'pdf' : 'doc')}
                    <span className="text-xs text-slate-700 max-w-[150px] truncate">
                      {file.name}
                    </span>
                    <button
                  onClick={() => removeAttachment(index)}
                  className="text-slate-400 hover:text-red-500">

                      <X className="w-4 h-4" />
                    </button>
                  </div>
              )}
              </div>
            </div>
          }

          {/* Input del Chat */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2">

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-slate-400 hover:text-primary p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Adjuntar archivo">

                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje o adjunta un reporte..."
                className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" />

              <Button
                type="submit"
                size="sm"
                className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
                disabled={!message.trim() && attachments.length === 0}>

                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Panel Lateral - Historial de Reportes */}
        <div className="space-y-6">
          {/* Subir Reporte Rápido */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Subir Reporte de Avance
            </h3>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 hover:border-primary/50 transition-colors cursor-pointer">

              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">
                Arrastra o haz clic para subir
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PDF, DOC, XLS (máx. 10MB)
              </p>
            </div>
          </Card>

          {/* Historial de Reportes */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Historial de Reportes
            </h3>
            <div className="space-y-3">
              {reportHistory.map((report) =>
              <div
                key={report.id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">

                  <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {report.name}
                    </p>
                    <p className="text-xs text-slate-500">{report.date}</p>
                  </div>
                  {getStatusBadge(report.status)}
                </div>
              )}
            </div>
          </Card>

          {/* Información de Contacto */}
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h3 className="font-semibold text-slate-900 mb-3">
              Información de Contacto
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-slate-600">
                <span className="font-medium">Coordinadora:</span>{' '}
                {coordinator.name}
              </p>
              <p className="text-slate-600">
                <span className="font-medium">Email:</span> {coordinator.email}
              </p>
              <p className="text-slate-600">
                <span className="font-medium">Horario:</span> Lun-Vie 8:00 AM -
                5:00 PM
              </p>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>);

}