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
  MessageSquare } from
'lucide-react';
import { projectsAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ChatPanel } from '../components/ChatPanel';
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const { showToast } = useToast();

  // Cargar datos del usuario desde localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  // Cargar proyectos asignados al profesor
  useEffect(() => {
    const fetchAssignedProjects = async () => {
      if (!userData?._id) return;
      
      setLoading(true);
      try {
        const projects = await projectsAPI.getAll({ assigned_to: userData._id });
        setAssignedProjects(projects);
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
  // Calcular estadísticas desde proyectos reales
  const stats = [
  {
    label: 'Por Evaluar',
    value: assignedProjects.filter(p => p.metadata?.status === 'submitted' || p.metadata?.status === 'in_review').length.toString(),
    icon: <Clock className="w-6 h-6 text-orange-600" />,
    bg: 'bg-orange-100'
  },
  {
    label: 'Evaluados',
    value: assignedProjects.filter(p => p.metadata?.status === 'approved' || p.metadata?.status === 'rejected').length.toString(),
    icon: <CheckSquare className="w-6 h-6 text-green-600" />,
    bg: 'bg-green-100'
  },
  {
    label: 'Total Asignados',
    value: assignedProjects.length.toString(),
    icon: <FileText className="w-6 h-6 text-blue-600" />,
    bg: 'bg-blue-100'
  }];

  // Filtrar proyectos
  const filteredProjects = useMemo(() => {
    return assignedProjects.filter((project) => {
      const matchesSearch =
      searchQuery === '' ||
      project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.authors?.[0]?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSection =
      selectedSection === 'all' || 
      (selectedSection === 'submitted' && (project.metadata?.status === 'submitted' || project.metadata?.status === 'in_review')) ||
      (selectedSection === 'approved' && project.metadata?.status === 'approved') ||
      (selectedSection === 'rejected' && project.metadata?.status === 'rejected');
      
      return matchesSearch && matchesSection;
    });
  }, [assignedProjects, searchQuery, selectedSection]);

  const handleEvaluateProject = (projectId: string) => {
    onNavigate('teacher-feedback', { projectId });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana(s)`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
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
  };
  const hasActiveFilters = searchQuery !== '' || selectedSection !== 'all';
  return (
    <MainLayout
      role="teacher"
      currentPage="teacher-dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={user}
      title="Panel de Evaluación">

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) =>
        <Card key={stat.label} className="border-none shadow-sm">
            <CardContent className="flex items-center p-6">
              <div className={`p-4 rounded-full ${stat.bg} mr-4`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </h3>
              </div>
            </CardContent>
          </Card>
        )}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                value: 'approved',
                label: 'Aprobados'
              },
              {
                value: 'rejected',
                label: 'Requieren Corrección'
              }]
              }
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)} />

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
                {selectedSection}
                <button
              onClick={() => setSelectedSection('all')}
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
                      <span>{formatDate(item.created_at)}</span>
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

    </MainLayout>);

}