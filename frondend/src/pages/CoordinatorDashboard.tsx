import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  BookCheck,
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  X
} from
'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ChatComponent } from '../components/chat/ChatComponent';

const API_BASE_URL = 'http://localhost:8000';
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
  loadPercentage?: number;
  completedEvaluations?: number;
  totalProjects?: number;
  department?: string;
  category?: string;
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
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [approvedProjects, setApprovedProjects] = useState<ApprovedProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ApprovedProject | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [publishedProjects, setPublishedProjects] = useState<ApprovedProject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [evaluationStats, setEvaluationStats] = useState<{
    completed: number;
    in_process: number;
    overdue: number;
    total_projects: number;
    rejected: number;
    avg_grade: number;
    completion_rate: number;
    last_updated: string;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Cargar profesores// Función para cargar profesores con estadísticas reales
  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      
      // Obtener estadísticas reales de profesores
      const response = await fetch(`${API_BASE_URL}/api/v1/users/teachers-stats`);
      
      if (response.ok) {
        const teachersData = await response.json();
        
        // Transformar datos al formato Teacher
        const formattedTeachers: Teacher[] = teachersData.map((teacher: any) => ({
          id: teacher.id,
          name: teacher.name,
          load: teacher.load,  // Carga real de proyectos asignados
          capacity: teacher.capacity,  // Capacidad máxima
          career: teacher.career,
          email: teacher.email,
          pendingEvaluations: teacher.pending_evaluations,  // Evaluaciones pendientes reales
          lastActive: teacher.last_active,  // Última actividad real
          loadPercentage: teacher.load_percentage,  // Porcentaje de carga
          completedEvaluations: teacher.completed_evaluations,  // Evaluaciones completadas
          totalProjects: teacher.total_projects,  // Total de proyectos
          department: teacher.department,  // Departamento
          category: teacher.category  // Categoría
        }));
        
        setTeachers(formattedTeachers);
      }
    } catch (error) {
      console.error('Error cargando profesores:', error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Función para cargar estadísticas de evaluaciones
  const loadEvaluationStats = async () => {
    try {
      setLoadingStats(true);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/projects/evaluation-stats`);
      
      if (response.ok) {
        const stats = await response.json();
        setEvaluationStats(stats);
      } else {
        console.error('Error loading evaluation stats');
      }
    } catch (error) {
      console.error('Error cargando estadísticas de evaluaciones:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadTeachers();
    loadEvaluationStats();
  }, []);

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

  // Función para abrir chat y cargar conversación
  const openChatWithTeacher = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    
    // Obtener chatId del profesor
    try {
      const response = await fetch(`http://localhost:8000/api/v1/chat/chat-id/${teacher.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('ChatId del profesor:', data);
        
        if (data.conversation_id) {
          setConversationId(data.conversation_id);
        } else {
          setConversationId(undefined);
        }
      }
    } catch (error) {
      console.error('Error obteniendo chatId:', error);
    }
    
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setSelectedTeacher(null);
    setConversationId(undefined);
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
            {/* Estado de carga de profesores */}
            {loadingTeachers && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center gap-2 text-primary">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Cargando estadísticas de profesores...</span>
                </div>
              </div>
            )}
            
            {/* Lista de profesores */}
            {!loadingTeachers && (
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
                        {teacher.department && (
                          <p className="text-xs text-slate-400">
                            {teacher.department}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openChatWithTeacher(teacher)}
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
                      {teacher.loadPercentage && (
                        <p className="text-xs text-slate-400 mt-1">
                          {teacher.loadPercentage}% de capacidad
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        Evaluaciones
                      </p>
                      <div className="space-y-1">
                        <Badge
                        variant={
                        teacher.pendingEvaluations > 5 ? 'warning' : 'success'
                        }>
                          {teacher.pendingEvaluations} pendientes
                        </Badge>
                        {teacher.completedEvaluations !== undefined && (
                          <p className="text-xs text-slate-400">
                            {teacher.completedEvaluations} completadas
                          </p>
                        )}
                      </div>
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
            )}
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

          {/* Resumen de Estado */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">
              Resumen de Evaluaciones
            </h3>
            
            {/* Estado de carga */}
            {loadingStats && (
              <div className="flex justify-center py-4">
                <div className="inline-flex items-center gap-2 text-primary">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Cargando estadísticas...</span>
                </div>
              </div>
            )}
            
            {/* Estadísticas reales */}
            {!loadingStats && evaluationStats && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{evaluationStats.completed}</p>
                  <p className="text-xs text-green-700">Completadas</p>
                  <p className="text-xs text-green-600 mt-1">{evaluationStats.completion_rate}%</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{evaluationStats.in_process}</p>
                  <p className="text-xs text-yellow-700">En Proceso</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{evaluationStats.overdue}</p>
                  <p className="text-xs text-red-700">Atrasadas</p>
                </div>
              </div>
            )}
            
            {/* Estadísticas adicionales */}
            {!loadingStats && evaluationStats && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total de Proyectos:</span>
                    <span className="font-medium text-slate-900">{evaluationStats.total_projects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Rechazados:</span>
                    <span className="font-medium text-slate-900">{evaluationStats.rejected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Calificación Promedio:</span>
                    <span className="font-medium text-slate-900">{evaluationStats.avg_grade}/20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Última Actualización:</span>
                    <span className="font-medium text-slate-900 text-xs">
                      {new Date(evaluationStats.last_updated).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Chat con Docente */}
      <ChatComponent
        isOpen={isChatOpen}
        onClose={closeChat}
        currentUser={user}
        otherUser={selectedTeacher ? {
          id: selectedTeacher.id.toString(),
          name: selectedTeacher.name,
          role: 'teacher',
          email: selectedTeacher.email,
          lastActive: selectedTeacher.lastActive,
          pendingEvaluations: selectedTeacher.pendingEvaluations
        } : undefined}
        conversationId={conversationId}
      />

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