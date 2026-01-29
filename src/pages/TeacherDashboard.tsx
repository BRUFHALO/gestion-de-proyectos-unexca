import React, { useMemo, useState } from 'react';
import {
  FileText,
  CheckSquare,
  Clock,
  ArrowRight,
  Search,
  Filter,
  X } from
'lucide-react';
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
  onNavigate: (page: string) => void;
}
export function TeacherDashboard({
  user,
  onLogout,
  onNavigate
}: TeacherDashboardProps) {
  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  // Datos de ejemplo
  const stats = [
  {
    label: 'Por Evaluar',
    value: '8',
    icon: <Clock className="w-6 h-6 text-orange-600" />,
    bg: 'bg-orange-100'
  },
  {
    label: 'Evaluados',
    value: '12',
    icon: <CheckSquare className="w-6 h-6 text-green-600" />,
    bg: 'bg-green-100'
  },
  {
    label: 'Total Asignados',
    value: '20',
    icon: <FileText className="w-6 h-6 text-blue-600" />,
    bg: 'bg-blue-100'
  }];

  // Lista completa de proyectos
  const allProjects = [
  {
    id: 1,
    title: 'Machine Learning en Salud',
    student: 'Juan Pérez',
    section: 'Sección A',
    submitted: 'Hace 2 horas',
    status: 'Pendiente'
  },
  {
    id: 2,
    title: 'Sistemas de Energía Renovable',
    student: 'Sara García',
    section: 'Sección B',
    submitted: 'Hace 1 día',
    status: 'En Progreso'
  },
  {
    id: 3,
    title: 'Seguridad en E-Commerce',
    student: 'Miguel Rodríguez',
    section: 'Sección A',
    submitted: 'Hace 2 días',
    status: 'Pendiente'
  },
  {
    id: 4,
    title: 'Aplicación de IoT en Agricultura',
    student: 'Ana Martínez',
    section: 'Sección C',
    submitted: 'Hace 3 días',
    status: 'Pendiente'
  },
  {
    id: 5,
    title: 'Blockchain para Cadena de Suministro',
    student: 'Carlos López',
    section: 'Sección B',
    submitted: 'Hace 4 días',
    status: 'Pendiente'
  },
  {
    id: 6,
    title: 'Sistema de Gestión Académica',
    student: 'María Fernández',
    section: 'Sección A',
    submitted: 'Hace 5 días',
    status: 'En Progreso'
  },
  {
    id: 7,
    title: 'Análisis de Datos con Python',
    student: 'Roberto Díaz',
    section: 'Sección C',
    submitted: 'Hace 1 semana',
    status: 'Pendiente'
  },
  {
    id: 8,
    title: 'Desarrollo de API REST',
    student: 'Laura Sánchez',
    section: 'Sección B',
    submitted: 'Hace 1 semana',
    status: 'Pendiente'
  }];

  // Obtener secciones únicas para el filtro
  const sections = useMemo(() => {
    const uniqueSections = [...new Set(allProjects.map((p) => p.section))];
    return uniqueSections.sort();
  }, []);
  // Filtrar proyectos
  const filteredProjects = useMemo(() => {
    return allProjects.filter((project) => {
      const matchesSearch =
      searchQuery === '' ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.student.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSection =
      selectedSection === 'all' || project.section === selectedSection;
      return matchesSearch && matchesSection;
    });
  }, [searchQuery, selectedSection]);
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

          {/* Filtro por sección */}
          <div>
            <Select
              options={[
              {
                value: 'all',
                label: 'Todas las Secciones'
              },
              ...sections.map((section) => ({
                value: section,
                label: section
              }))]
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
              de {allProjects.length} proyectos
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
          <h3 className="font-semibold text-slate-900">Cola de Evaluación</h3>
          <Badge variant="warning">
            {filteredProjects.filter((p) => p.status === 'Pendiente').length}{' '}
            pendientes
          </Badge>
        </div>

        {filteredProjects.length > 0 ?
        <div className="divide-y divide-slate-100">
            {filteredProjects.map((item) =>
          <div
            key={item.id}
            className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">

                <div className="flex items-center gap-4">
                  <Avatar fallback={item.student} />
                  <div>
                    <h4 className="font-medium text-slate-900">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                      <span>{item.student}</span>
                      <span>•</span>
                      <span className="font-medium text-primary">
                        {item.section}
                      </span>
                      <span>•</span>
                      <span>{item.submitted}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                variant={item.status === 'Pendiente' ? 'warning' : 'info'}>

                    {item.status}
                  </Badge>
                  <Button
                size="sm"
                onClick={() => onNavigate('evaluation-canvas')}
                rightIcon={<ArrowRight className="w-4 h-4" />}>

                    Evaluar
                  </Button>
                </div>
              </div>
          )}
          </div> :

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