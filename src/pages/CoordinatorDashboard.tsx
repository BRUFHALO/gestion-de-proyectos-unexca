import React, { useState } from 'react';
import {
  Users,
  BookCheck,
  MoreVertical,
  MessageSquare,
  X,
  Send,
  Paperclip } from
'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
interface CoordinatorDashboardProps {
  user: any;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}
interface Teacher {
  id: number;
  name: string;
  load: number;
  capacity: number;
  career: string;
  email: string;
  pendingEvaluations: number;
  lastActive: string;
}
interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
}
export function CoordinatorDashboard({
  user,
  onLogout,
  onNavigate
}: CoordinatorDashboardProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<
    Record<number, ChatMessage[]>>(
    {
      1: [
      {
        id: '1',
        sender: 'Dra. Carmen López',
        text: 'Prof. Martínez, ¿cómo va el proceso de evaluación de los proyectos de Ingeniería?',
        time: 'Ayer, 10:30 AM',
        isMe: true
      },
      {
        id: '2',
        sender: 'Prof. Martínez',
        text: 'Buenos días Dra. López. Ya tengo 8 proyectos evaluados, me faltan 4 por revisar.',
        time: 'Ayer, 11:15 AM',
        isMe: false
      },
      {
        id: '3',
        sender: 'Dra. Carmen López',
        text: 'Perfecto, recuerde que la fecha límite es el viernes.',
        time: 'Ayer, 11:20 AM',
        isMe: true
      }],

      2: [
      {
        id: '1',
        sender: 'Dra. Carmen López',
        text: 'Prof. Wilson, necesito un reporte del avance de evaluaciones.',
        time: 'Hace 2 días',
        isMe: true
      },
      {
        id: '2',
        sender: 'Prof. Wilson',
        text: 'Claro, le envío el reporte esta tarde.',
        time: 'Hace 2 días',
        isMe: false
      }],

      3: [
      {
        id: '1',
        sender: 'Dra. Carmen López',
        text: 'Bienvenido Prof. Davis, cualquier duda con el sistema me avisa.',
        time: 'Hace 1 semana',
        isMe: true
      }]

    });
  const teachers: Teacher[] = [
  {
    id: 1,
    name: 'Prof. Martínez',
    load: 12,
    capacity: 20,
    career: 'Ing. Informática',
    email: 'martinez@unexca.edu.ve',
    pendingEvaluations: 4,
    lastActive: 'Hace 5 min'
  },
  {
    id: 2,
    name: 'Prof. Wilson',
    load: 18,
    capacity: 20,
    career: 'Administración',
    email: 'wilson@unexca.edu.ve',
    pendingEvaluations: 2,
    lastActive: 'Hace 1 hora'
  },
  {
    id: 3,
    name: 'Prof. Davis',
    load: 5,
    capacity: 15,
    career: 'Educación',
    email: 'davis@unexca.edu.ve',
    pendingEvaluations: 10,
    lastActive: 'Hace 3 horas'
  },
  {
    id: 4,
    name: 'Prof. García',
    load: 8,
    capacity: 15,
    career: 'Ing. Informática',
    email: 'garcia@unexca.edu.ve',
    pendingEvaluations: 7,
    lastActive: 'Hace 30 min'
  },
  {
    id: 5,
    name: 'Prof. Rodríguez',
    load: 14,
    capacity: 18,
    career: 'Contaduría',
    email: 'rodriguez@unexca.edu.ve',
    pendingEvaluations: 4,
    lastActive: 'En línea'
  }];

  const pendingPublication = [
  {
    id: 1,
    title: 'Control Avanzado de Robótica',
    author: 'Equipo Alfa',
    grade: '100%',
    teacher: 'Prof. Martínez'
  },
  {
    id: 2,
    title: 'Estudio de Microeconomía 2024',
    author: 'Equipo Beta',
    grade: '100%',
    teacher: 'Prof. Wilson'
  },
  {
    id: 3,
    title: 'Sistema de Gestión Educativa',
    author: 'María Fernández',
    grade: '98%',
    teacher: 'Prof. Davis'
  }];

  const openChat = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsChatOpen(true);
  };
  const closeChat = () => {
    setIsChatOpen(false);
    setSelectedTeacher(null);
    setMessage('');
  };
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedTeacher) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: user.name,
      text: message,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isMe: true
    };
    setChatMessages((prev) => ({
      ...prev,
      [selectedTeacher.id]: [...(prev[selectedTeacher.id] || []), newMessage]
    }));
    setMessage('');
  };
  const getLoadColor = (load: number, capacity: number) => {
    const percentage = load / capacity * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  const getLoadTextColor = (load: number, capacity: number) => {
    const percentage = load / capacity * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };
  return (
    <MainLayout
      role="coordinator"
      currentPage="coordinator-dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={user}
      title="Panel de Gestión">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Asignaciones de Docentes */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Docentes Asignados
            </h2>
            <Button variant="outline" size="sm">
              Gestionar Todo
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {teachers.map((teacher) =>
              <div
                key={teacher.id}
                className="p-4 hover:bg-slate-50 transition-colors">

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar fallback={teacher.name} size="md" />
                        {teacher.lastActive === 'En línea' &&
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      }
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {teacher.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {teacher.career}
                        </p>
                        <p className="text-xs text-slate-400">
                          {teacher.lastActive}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openChat(teacher)}
                      leftIcon={<MessageSquare className="w-4 h-4" />}
                      className="text-primary border-primary/30 hover:bg-primary/5">

                        Chat
                      </Button>
                      <button className="text-slate-400 hover:text-slate-600 p-1">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        Carga de Trabajo
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                          className={`h-full rounded-full transition-all ${getLoadColor(teacher.load, teacher.capacity)}`}
                          style={{
                            width: `${teacher.load / teacher.capacity * 100}%`
                          }} />

                        </div>
                        <span
                        className={`text-xs font-semibold ${getLoadTextColor(teacher.load, teacher.capacity)}`}>

                          {teacher.load}/{teacher.capacity}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        Pendientes
                      </p>
                      <Badge
                      variant={
                      teacher.pendingEvaluations > 5 ? 'warning' : 'success'
                      }>

                        {teacher.pendingEvaluations} por evaluar
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cola de Publicación */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookCheck className="w-5 h-5 text-primary" />
              Cola de Publicación
            </h2>
            <Badge variant="info">{pendingPublication.length} Pendientes</Badge>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {pendingPublication.map((item) =>
              <div key={item.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-slate-900">
                        {item.title}
                      </h4>
                      <p className="text-sm text-slate-500">
                        por {item.author}
                      </p>
                    </div>
                    <Badge variant="success">{item.grade}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-slate-400">
                      Evaluado por {item.teacher}
                    </span>
                    <div className="flex gap-2">
                      <Button
                      size="sm"
                      variant="outline"
                      className="text-xs py-1 h-8">

                        Rechazar
                      </Button>
                      <Button size="sm" className="text-xs py-1 h-8">
                        Publicar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resumen de Estado */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">
              Resumen de Evaluaciones
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">47</p>
                <p className="text-xs text-green-700">Completadas</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">27</p>
                <p className="text-xs text-yellow-700">En Proceso</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">8</p>
                <p className="text-xs text-red-700">Atrasadas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Chat con Docente */}
      <Modal isOpen={isChatOpen} onClose={closeChat} title="" size="lg">
        {selectedTeacher &&
        <div className="flex flex-col h-[500px] -m-6">
            {/* Header del Chat */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar fallback={selectedTeacher.name} size="md" />
                  {selectedTeacher.lastActive === 'En línea' &&
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                }
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {selectedTeacher.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedTeacher.career} • {selectedTeacher.email}
                  </p>
                  <span
                  className={`text-xs ${selectedTeacher.lastActive === 'En línea' ? 'text-green-600' : 'text-slate-400'}`}>

                    {selectedTeacher.lastActive}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <Badge
                variant={
                selectedTeacher.pendingEvaluations > 5 ?
                'warning' :
                'success'
                }>

                  {selectedTeacher.pendingEvaluations} pendientes
                </Badge>
                <p className="text-xs text-slate-500 mt-1">
                  Carga: {selectedTeacher.load}/{selectedTeacher.capacity}
                </p>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {(chatMessages[selectedTeacher.id] || []).length === 0 ?
            <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No hay mensajes aún</p>
                  <p className="text-sm text-slate-400">
                    Inicia una conversación con {selectedTeacher.name}
                  </p>
                </div> :

            (chatMessages[selectedTeacher.id] || []).map((msg) =>
            <div
              key={msg.id}
              className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>

                    <div
                className={`
                        max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm
                        ${msg.isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}
                      `}>

                      <p>{msg.text}</p>
                      <p
                  className={`text-[10px] mt-1 text-right ${msg.isMe ? 'text-primary-light/80' : 'text-slate-400'}`}>

                        {msg.time}
                      </p>
                    </div>
                  </div>
            )
            }
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
                placeholder="Escribe un mensaje para hacer seguimiento..."
                className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" />

                <Button
                type="submit"
                size="sm"
                className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
                disabled={!message.trim()}>

                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Use este chat para hacer seguimiento del proceso de evaluación
              </p>
            </div>
          </div>
        }
      </Modal>
    </MainLayout>);

}