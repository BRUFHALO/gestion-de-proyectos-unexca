import React, { useMemo, useState, useEffect } from 'react';
import {
  FileText,
  CheckSquare,
  Clock,
  ArrowRight,
  Search,
  Filter,
  X,
  Eye,
  MessageSquare,
  MessageCircle } from
'lucide-react';
import { projectsAPI, API_BASE_URL } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
interface TeacherDashboardProps {
  user: any;
  onLogout: () => void;
  onNavigate: (page: string, data?: any) => void;
}
export function TeacherDashboard({
  user,
  onLogout,
  onNavigate
}: TeacherDashboardProps) {
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [teacherStats, setTeacherStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const { showToast } = useToast();

  // Cargar datos del usuario desde localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  // Cargar estadísticas del docente
  const loadTeacherStats = async () => {
    if (!userData?._id) return;
    
    try {
      setStatsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/users/teachers-stats`);
      if (response.ok) {
        const allTeachersStats = await response.json();
        // Encontrar las estadísticas del docente actual
        const currentTeacherStats = allTeachersStats.find((stats: any) => stats.id === userData._id);
        setTeacherStats(currentTeacherStats || null);
      } else {
        console.error('Error cargando estadísticas del docente:', response.status);
      }
    } catch (error) {
      console.error('Error cargando estadísticas del docente:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Cargar estadísticas cuando los datos del usuario estén disponibles
  useEffect(() => {
    if (userData) {
      loadTeacherStats();
    }
  }, [userData]);

  // Cargar proyectos asignados al profesor
  useEffect(() => {
    const fetchAssignedProjects = async () => {
      if (!userData?._id) return;
      
      setLoading(true);
      try {
        const projects = await projectsAPI.getAll({ assigned_to: userData._id });
        
        // Cargar información de evaluación para cada proyecto
        const projectsWithEvaluation = await Promise.all(
          projects.map(async (project) => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/v1/projects/${project._id}/evaluation/grade`);
              if (response.ok) {
                const evaluationData = await response.json();
                console.log(`Evaluation data for project ${project._id}:`, evaluationData);
                return { ...project, evaluation: evaluationData };
              } else {
                console.log(`No evaluation data for project ${project._id}, status: ${response.status}`);
              }
            } catch (error) {
              console.error(`Error loading evaluation for project ${project._id}:`, error);
            }
            return project;
          })
        );
        
        console.log('Projects with evaluation:', projectsWithEvaluation);
        console.log('Sample project structure:', projectsWithEvaluation[0]);
        if (projectsWithEvaluation.length > 0) {
          console.log('Estados de proyectos:');
          projectsWithEvaluation.forEach((project: any, index) => {
            console.log(`Proyecto ${index + 1}:`, {
              title: project.title,
              status: project.metadata?.status,
              evaluation_status: project.evaluation?.status
            });
          });
        }
        setAssignedProjects(projectsWithEvaluation);
      } catch (error) {
        console.error('Error al cargar proyectos:', error);
        showToast('error', 'Error al cargar proyectos asignados');
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      fetchAssignedProjects();
    }
  }, [userData, showToast]);
  // Calcular estadísticas desde proyectos reales (fallback si no hay stats del API)
  const approvedCount = assignedProjects.filter(p => p.evaluation?.status === 'aprobado').length;
  const reprobatedCount = assignedProjects.filter(p => p.evaluation?.status === 'reprobado').length;
  const toEvaluateCount = assignedProjects.filter(p => 
    p.evaluation?.status === 'en_revision' || 
    (!p.evaluation?.status && (p.metadata?.status === 'submitted' || p.metadata?.status === 'in_review'))
  ).length;

  // Usar estadísticas del API si están disponibles, si no usar cálculo local
  const stats = [
  {
    label: 'Por Evaluar',
    value: (teacherStats?.pending_evaluations ?? toEvaluateCount).toString(),
    icon: <Clock className="w-6 h-6 text-orange-600" />,
    bg: 'bg-orange-100'
  },
  {
    label: 'Aprobados',
    value: (teacherStats?.completed_evaluations ?? approvedCount).toString(),
    icon: <CheckSquare className="w-6 h-6 text-green-600" />,
    bg: 'bg-green-100'
  },
  {
    label: 'Reprobados',
    value: reprobatedCount.toString(),
    icon: <FileText className="w-6 h-6 text-red-600" />,
    bg: 'bg-red-100'
  },
  {
    label: 'Total Asignados',
    value: assignedProjects.length.toString(),
    icon: <FileText className="w-6 h-6 text-blue-600" />,
    bg: 'bg-blue-100'
  }];

  // Filtrar proyectos
  const filteredProjects = useMemo(() => {
    console.log('Filtrando proyectos con dateFilter:', dateFilter);
    console.log('Total proyectos antes de filtrar:', assignedProjects.length);
    
    const filtered = assignedProjects.filter((project) => {
      const matchesSearch =
      searchQuery === '' ||
      project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.authors?.[0]?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSection =
      selectedSection === 'all' || 
      (selectedSection === 'submitted' && (project.metadata?.status === 'submitted')) ||
      (selectedSection === 'in_review' && (project.metadata?.status === 'en_revision' || project.evaluation?.status === 'en_revision')) ||
      (selectedSection === 'approved' && (project.metadata?.status === 'aprobado' || project.evaluation?.status === 'aprobado')) ||
      (selectedSection === 'published' && (project.metadata?.status === 'published' || project.evaluation?.status === 'published'));

    // Logs para depurar filtros
    if (selectedSection === 'submitted') {
      console.log('Filtrando pendientes - Proyecto:', {
        title: project.title,
        metadata_status: project.metadata?.status,
        evaluation_status: project.evaluation?.status,
        matchesSection
      });
    }
    if (selectedSection === 'approved') {
      console.log('Filtrando aprobados - Proyecto:', {
        title: project.title,
        metadata_status: project.metadata?.status,
        evaluation_status: project.evaluation?.status,
        matchesSection
      });
    }
    if (selectedSection === 'in_review') {
      console.log('Filtrando en revisión - Proyecto:', {
        title: project.title,
        metadata_status: project.metadata?.status,
        evaluation_status: project.evaluation?.status,
        matchesSection
      });
    }

      // Filtro por fecha de asignación o creación
      const dateToFilter = project.evaluation?.assigned_at ? 
        new Date(project.evaluation.assigned_at) : 
        new Date(project.created_at);
      const now = new Date();
      let matchesDate = true;

      if (dateFilter !== 'all') {
        const diffTime = now.getTime() - dateToFilter.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case 'today':
            matchesDate = diffDays === 0;
            break;
          case 'week':
            matchesDate = diffDays <= 7;
            break;
          case 'month':
            matchesDate = diffDays <= 30;
            break;
        }
      }

      const result = matchesSearch && matchesSection && matchesDate;
      if (!result && dateFilter !== 'all') {
        console.log('Proyecto filtrado:', {
          title: project.title,
          dateToFilter: dateToFilter.toISOString(),
          matchesDate,
          dateFilter
        });
      }
      
      return result;
    });
    
    console.log('Total proyectos después de filtrar:', filtered.length);
    return filtered;
  }, [assignedProjects, searchQuery, selectedSection, dateFilter]);

  const handleEvaluateProject = (projectId: string) => {
    onNavigate('teacher-feedback', { projectId });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'in_review':
        return <Badge variant="info">En Revisión</Badge>;
      case 'approved':
        return <Badge variant="success">Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="danger">Requiere Corrección</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };
  // Limpiar filtros
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSection('all');
    setDateFilter('all');
  };
  const hasActiveFilters = searchQuery !== '' || selectedSection !== 'all' || dateFilter !== 'all';
  return (
    <MainLayout
      role="teacher"
      currentPage="teacher-dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={user}
      title="Panel de Evaluación">

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Estadísticas principales */}
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm">
            <CardContent className="flex items-center p-6">
              <div className={`p-4 rounded-full ${stat.bg} mr-4`}>
                {statsLoading ? (
                  <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  stat.icon
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {statsLoading ? '...' : stat.value}
                </h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sección de Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-slate-900">Filtros de Búsqueda</h3>
          {hasActiveFilters &&
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">

              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          }
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por nombre del proyecto */}
          <div>
            <Input
              placeholder="Buscar por nombre del proyecto o estudiante..."
              icon={<Search className="w-5 h-5" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} />

          </div>

          {/* Filtro por estado */}
          <div>
            <Select
              options={[
              {
                value: 'all',
                label: 'Todos los Estados'
              },
              {
                value: 'submitted',
                label: 'Pendientes'
              },
              {
                value: 'in_review',
                label: 'En revisión'
              },
              {
                value: 'approved',
                label: 'Aprobado'
              },
              {
                value: 'published',
                label: 'Publicados'
              }]
              }
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)} />

          </div>

          {/* Filtro por fecha de asignación */}
          <div>
            <Select
              options={[
              {
                value: 'all',
                label: 'Cualquier fecha'
              },
              {
                value: 'today',
                label: 'Asignados hoy'
              },
              {
                value: 'week',
                label: 'Última semana'
              },
              {
                value: 'month',
                label: 'Último mes'
              }]
              }
              value={dateFilter}
              onChange={(e) => {
                console.log('Cambiando dateFilter a:', e.target.value);
                setDateFilter(e.target.value);
              }} />

          </div>

          {/* Contador de resultados */}
          <div className="flex items-center">
            <p className="text-sm text-slate-600">
              Mostrando{' '}
              <span className="font-semibold text-slate-900">
                {filteredProjects.length}
              </span>{' '}
              de{' '}
              <span className="font-semibold text-slate-900">
                {assignedProjects.length}
              </span>{' '}
              proyectos
            </p>
          </div>
        </div>

        {/* Badges de filtros activos */}
        {hasActiveFilters &&
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
            {searchQuery &&
          <Badge variant="info" className="flex items-center gap-1">
                Búsqueda: "{searchQuery}"
                <button
              onClick={() => setSearchQuery('')}
              className="ml-1 hover:text-blue-800">

                  <X className="w-3 h-3" />
                </button>
              </Badge>
          }
            {selectedSection !== 'all' &&
          <Badge variant="info" className="flex items-center gap-1">
                {selectedSection === 'submitted' ? 'Pendientes' :
                 selectedSection === 'in_review' ? 'En revisión' :
                 selectedSection === 'approved' ? 'Aprobado' :
                 selectedSection === 'published' ? 'Publicados' : selectedSection}
                <button
              onClick={() => setSelectedSection('all')}
              className="ml-1 hover:text-blue-800">

                  <X className="w-3 h-3" />
                </button>
              </Badge>
          }
            {dateFilter !== 'all' &&
          <Badge variant="info" className="flex items-center gap-1">
                {dateFilter === 'today' ? 'Asignados hoy' : 
                 dateFilter === 'week' ? 'Última semana' :
                 dateFilter === 'month' ? 'Último mes' : dateFilter}
                <button
              onClick={() => setDateFilter('all')}
              className="ml-1 hover:text-blue-800">

                  <X className="w-3 h-3" />
                </button>
              </Badge>
          }
          </div>
        }
      </div>

      {/* Cola de Evaluación */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Proyectos Asignados</h3>
          <Badge variant="warning">
            {filteredProjects.filter((p) => p.metadata?.status === 'submitted' || p.metadata?.status === 'in_review').length}{' '}
            pendientes
          </Badge>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-spin" />
            <p className="text-slate-600">Cargando proyectos...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
        <div className="divide-y divide-slate-100">
            {filteredProjects.map((item) =>
          <div
            key={item._id}
            className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">

                <div className="flex items-center gap-4">
                  <Avatar fallback={item.authors?.[0]?.name || 'E'} />
                  <div>
                    <h4 className="font-medium text-slate-900">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                      <span>{item.authors?.[0]?.name || 'Estudiante'}</span>
                      <span>•</span>
                      <span className="font-medium text-primary">
                        {item.academic_info?.methodology || 'Sin metodología'}
                      </span>
                      <span>•</span>
                      <span>
                        {item.evaluation?.assigned_at 
                          ? `Asignado: ${formatDateTime(item.evaluation.assigned_at)}`
                          : `Creado: ${formatDateTime(item.created_at)}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusBadge(item.metadata?.status || 'submitted')}
                  <Button
                    size="sm"
                    onClick={() => handleEvaluateProject(item._id)}
                    leftIcon={<Eye className="w-4 h-4" />}>
                    Evaluar
                  </Button>
                </div>
              </div>
            )}
          </div>) :

        <div className="p-12 text-center">
            <div className="bg-slate-100 p-4 rounded-full inline-block mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No se encontraron proyectos
            </h3>
            <p className="text-slate-500 mb-4">
              No hay proyectos que coincidan con los filtros seleccionados.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        }
      </div>

    </MainLayout>
  );
}