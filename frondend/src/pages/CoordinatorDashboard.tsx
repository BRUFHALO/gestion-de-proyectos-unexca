import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  BookCheck,
  MoreVertical,
  MessageSquare,
  X,
  Send,
  Paperclip,
  Search,
  Filter } from
'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

const API_BASE_URL = 'http://localhost:8005';
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

interface ApprovedProject {
  id: string;
  title: string;
  studentName: string;
  teacherName: string;
  career: string;
  approvedDate: string;
  publishedDate?: string;
  evaluation: {
    grade: number;
    comments: number;
  };
}
export function CoordinatorDashboard({
  user,
  onLogout,
  onNavigate
}: CoordinatorDashboardProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [approvedProjects, setApprovedProjects] = useState<ApprovedProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ApprovedProject | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [publishedProjects, setPublishedProjects] = useState<ApprovedProject[]>([]);
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

  // Función para recargar todos los datos de proyectos
  const reloadProjectData = async () => {
    try {
      console.log('Recargando datos de proyectos...');
      
      // Cargar proyectos aprobados
      const approvedResponse = await fetch(`${API_BASE_URL}/api/v1/coordinator/approved`);
      if (approvedResponse.ok) {
        const approvedData = await approvedResponse.json();
        console.log('Proyectos aprobados recibidos:', approvedData.projects);
        console.log('Número de proyectos aprobados:', approvedData.projects?.length || 0);
        setApprovedProjects(approvedData.projects || []);
      } else {
        console.error('Error loading approved projects');
      }

      // Cargar proyectos publicados
      const publishedResponse = await fetch(`${API_BASE_URL}/api/v1/coordinator/published`);
      if (publishedResponse.ok) {
        const publishedData = await publishedResponse.json();
        console.log('Proyectos publicados recibidos:', publishedData.projects);
        console.log('Número de proyectos publicados:', publishedData.projects?.length || 0);
        setPublishedProjects(publishedData.projects || []);
      } else {
        console.error('Error loading published projects');
      }
    } catch (error) {
      console.error('Error recargando datos de proyectos:', error);
    }
  };

  // Cargar proyectos aprobados y publicados desde la API
  useEffect(() => {
    reloadProjectData();
  }, []);

  // Logging para depurar cambios en el estado
  useEffect(() => {
    console.log('Estado actual - approvedProjects:', approvedProjects);
    console.log('Estado actual - publishedProjects:', publishedProjects);
  }, [approvedProjects, publishedProjects]);

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

  // Funciones para manejar proyectos aprobados
  const handleRejectProject = async (projectId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/coordinator/${projectId}/reject`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        // Recargar todos los datos para asegurar consistencia
        await reloadProjectData();
        console.log('Proyecto rechazado:', projectId);
      } else {
        console.error('Error rechazando proyecto');
      }
    } catch (error) {
      console.error('Error rechazando proyecto:', error);
    }
  };

  const handlePublishProject = async (projectId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/coordinator/${projectId}/publish`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        // Recargar todos los datos para asegurar consistencia
        await reloadProjectData();
        console.log('Proyecto publicado en biblioteca digital:', projectId);
      } else {
        console.error('Error publicando proyecto');
      }
    } catch (error) {
      console.error('Error publicando proyecto:', error);
    }
  };

  const handleViewProject = (project: ApprovedProject) => {
    setSelectedProject(project);
    setIsProjectModalOpen(true);
  };

  // Filtrar docentes por búsqueda
  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const matchesSearch =
        teacherSearchQuery === '' ||
        teacher.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
        teacher.career.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(teacherSearchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [teacherSearchQuery, teachers]);

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

          {/* Filtro de Búsqueda de Docentes */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-slate-900">Buscar Docente</h3>
            </div>
            <Input
              placeholder="Buscar por nombre, carrera o email..."
              icon={<Search className="w-5 h-5" />}
              value={teacherSearchQuery}
              onChange={(e) => setTeacherSearchQuery(e.target.value)}
            />
            {teacherSearchQuery && (
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Mostrando <span className="font-semibold">{filteredTeachers.length}</span> de {teachers.length} docentes
                </p>
                <button
                  onClick={() => setTeacherSearchQuery('')}
                  className="text-xs text-primary hover:text-primary-dark flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Limpiar
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) =>
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
              )
              ) : (
                <div className="p-8 text-center">
                  <div className="bg-slate-100 p-4 rounded-full inline-block mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No se encontraron docentes
                  </h3>
                  <p className="text-slate-500 mb-4">
                    No hay docentes que coincidan con tu búsqueda.
                  </p>
                  <Button variant="outline" onClick={() => setTeacherSearchQuery('')}>
                    Limpiar búsqueda
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proyectos Aprobados por Profesores */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookCheck className="w-5 h-5 text-primary" />
              Proyectos Aprobados por Profesores
            </h2>
            <Badge variant="info">{approvedProjects.length} Pendientes</Badge>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {approvedProjects.length > 0 ? (
                approvedProjects.map((project) => (
                  <div key={project.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>Aprobado: {project.approvedDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProject(project)}
                          className="text-slate-600 border-slate-300"
                        >
                          Ver Detalles
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectProject(project.id)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Rechazar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handlePublishProject(project.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Publicar en Biblioteca
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="bg-slate-100 p-4 rounded-full inline-block mb-4">
                    <BookCheck className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No hay proyectos aprobados pendientes
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Los proyectos aprobados por profesores aparecerán aquí para tu revisión
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Biblioteca Digital */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookCheck className="w-5 h-5 text-green-600" />
                Biblioteca Digital
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="success">{publishedProjects.length} Publicados</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reloadProjectData}
                  className="text-slate-600 border-slate-300"
                >
                  Recargar
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {publishedProjects.length > 0 ? (
                  publishedProjects.map((project) => (
                    <div key={project.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <img 
                            src="/src/config/logoUnexca.jpg" 
                            alt="UNEXCA" 
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 mb-1">
                              {project.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span>Estudiante: {project.studentName}</span>
                              <span>Profesor: {project.teacherName}</span>
                              <span>Publicado: {project.publishedDate}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="success">Calificación: {project.evaluation.grade}/20</Badge>
                              <span className="text-xs text-slate-400">
                                {project.evaluation.comments} comentarios
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProject(project)}
                            className="text-slate-600 border-slate-300"
                          >
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <div className="bg-green-50 p-4 rounded-full inline-block mb-4">
                      <BookCheck className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      No hay proyectos publicados
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Los proyectos aprobados por el coordinador aparecerán aquí
                    </p>
                    <p className="text-xs text-slate-400">
                      Los estudiantes y profesores pueden acceder a estos proyectos como referencia
                    </p>
                  </div>
                )}
              </div>
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

      {/* Modal de Detalles del Proyecto */}
      <Modal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)} 
        title="Detalles del Proyecto Aprobado"
        size="lg"
      >
        {selectedProject && (
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Información General</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Título del Proyecto</p>
                  <p className="font-medium text-slate-900">{selectedProject.title}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Estudiante</p>
                  <p className="font-medium text-slate-900">{selectedProject.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Profesor Evaluador</p>
                  <p className="font-medium text-slate-900">{selectedProject.teacherName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Carrera</p>
                  <p className="font-medium text-slate-900">{selectedProject.career}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Evaluación</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Calificación Final</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="text-lg px-3 py-1">
                      {selectedProject.evaluation.grade}/20
                    </Badge>
                    <span className="text-sm text-slate-600">
                      ({selectedProject.evaluation.grade >= 12 ? 'Aprobado' : 'Reprobado'})
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Comentarios Realizados</p>
                  <p className="font-medium text-slate-900">{selectedProject.evaluation.comments} comentarios</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Fecha de Aprobación</h3>
              <p className="font-medium text-slate-900">{selectedProject.approvedDate}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setIsProjectModalOpen(false)}
              >
                Cerrar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleRejectProject(selectedProject.id);
                  setIsProjectModalOpen(false);
                }}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Rechazar Proyecto
              </Button>
              <Button
                onClick={() => {
                  handlePublishProject(selectedProject.id);
                  setIsProjectModalOpen(false);
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Publicar en Biblioteca Digital
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>);

}