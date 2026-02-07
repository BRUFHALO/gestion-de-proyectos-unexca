import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  X
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

interface CoordinatorReportsProps {
  user: any;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

interface Report {
  id: number;
  title: string;
  teacher: string;
  date: string;
  type: string;
  status: 'Completado' | 'Pendiente' | 'En Revisión';
  projectsEvaluated: number;
  averageGrade: number;
}

export function CoordinatorReports({
  user,
  onLogout,
  onNavigate
}: CoordinatorReportsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [reportTypeFilter, setReportTypeFilter] = useState('all');

  // Datos de ejemplo de reportes
  const allReports: Report[] = [
    {
      id: 1,
      title: 'Reporte de Evaluaciones - Enero 2025',
      teacher: 'Prof. Martínez',
      date: '15 Ene, 2025',
      type: 'Evaluaciones',
      status: 'Completado',
      projectsEvaluated: 12,
      averageGrade: 87.5
    },
    {
      id: 2,
      title: 'Informe de Proyectos Aprobados',
      teacher: 'Prof. Wilson',
      date: '10 Ene, 2025',
      type: 'Aprobaciones',
      status: 'Completado',
      projectsEvaluated: 18,
      averageGrade: 92.3
    },
    {
      id: 3,
      title: 'Reporte Mensual de Actividades',
      teacher: 'Prof. Davis',
      date: '08 Ene, 2025',
      type: 'Actividades',
      status: 'En Revisión',
      projectsEvaluated: 5,
      averageGrade: 78.0
    },
    {
      id: 4,
      title: 'Evaluación de Proyectos de Grado',
      teacher: 'Prof. García',
      date: '05 Ene, 2025',
      type: 'Evaluaciones',
      status: 'Completado',
      projectsEvaluated: 8,
      averageGrade: 85.2
    },
    {
      id: 5,
      title: 'Reporte de Retroalimentación',
      teacher: 'Prof. Rodríguez',
      date: '03 Ene, 2025',
      type: 'Retroalimentación',
      status: 'Completado',
      projectsEvaluated: 14,
      averageGrade: 89.7
    },
    {
      id: 6,
      title: 'Informe de Proyectos Rechazados',
      teacher: 'Prof. Martínez',
      date: '28 Dic, 2024',
      type: 'Rechazos',
      status: 'Completado',
      projectsEvaluated: 3,
      averageGrade: 65.0
    },
    {
      id: 7,
      title: 'Reporte Trimestral - Q4 2024',
      teacher: 'Prof. Wilson',
      date: '20 Dic, 2024',
      type: 'Trimestral',
      status: 'Pendiente',
      projectsEvaluated: 0,
      averageGrade: 0
    },
    {
      id: 8,
      title: 'Evaluaciones de Diciembre',
      teacher: 'Prof. Davis',
      date: '15 Dic, 2024',
      type: 'Evaluaciones',
      status: 'Completado',
      projectsEvaluated: 10,
      averageGrade: 81.5
    }
  ];

  // Obtener lista única de profesores
  const teachers = useMemo(() => {
    const uniqueTeachers = [...new Set(allReports.map((r) => r.teacher))];
    return uniqueTeachers.sort();
  }, []);

  // Obtener tipos de reporte únicos
  const reportTypes = useMemo(() => {
    const uniqueTypes = [...new Set(allReports.map((r) => r.type))];
    return uniqueTypes.sort();
  }, []);

  // Filtrar reportes
  const filteredReports = useMemo(() => {
    return allReports.filter((report) => {
      const matchesSearch =
        searchQuery === '' ||
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.teacher.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTeacher =
        teacherFilter === 'all' || report.teacher === teacherFilter;

      const matchesType =
        reportTypeFilter === 'all' || report.type === reportTypeFilter;

      return matchesSearch && matchesTeacher && matchesType;
    });
  }, [searchQuery, teacherFilter, reportTypeFilter, allReports]);

  const clearFilters = () => {
    setSearchQuery('');
    setTeacherFilter('all');
    setReportTypeFilter('all');
  };

  const hasActiveFilters =
    searchQuery !== '' || teacherFilter !== 'all' || reportTypeFilter !== 'all';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completado':
        return <Badge variant="success">Completado</Badge>;
      case 'Pendiente':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'En Revisión':
        return <Badge variant="info">En Revisión</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <MainLayout
      role="coordinator"
      currentPage="coordinator-reports"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={user}
      title="Reportes de Docentes"
    >
      {/* Sección de Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-slate-900">Filtros de Búsqueda</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda general */}
          <div>
            <Input
              placeholder="Buscar por nombre de reporte o profesor..."
              icon={<Search className="w-5 h-5" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtro por profesor */}
          <div>
            <Select
              options={[
                { value: 'all', label: 'Todos los Profesores' },
                ...teachers.map((teacher) => ({
                  value: teacher,
                  label: teacher
                }))
              ]}
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
            />
          </div>

          {/* Filtro por tipo de reporte */}
          <div>
            <Select
              options={[
                { value: 'all', label: 'Todos los Tipos' },
                ...reportTypes.map((type) => ({
                  value: type,
                  label: type
                }))
              ]}
              value={reportTypeFilter}
              onChange={(e) => setReportTypeFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Badges de filtros activos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
            {searchQuery && (
              <Badge variant="info" className="flex items-center gap-1">
                Búsqueda: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-1 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {teacherFilter !== 'all' && (
              <Badge variant="info" className="flex items-center gap-1">
                Profesor: {teacherFilter}
                <button
                  onClick={() => setTeacherFilter('all')}
                  className="ml-1 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {reportTypeFilter !== 'all' && (
              <Badge variant="info" className="flex items-center gap-1">
                Tipo: {reportTypeFilter}
                <button
                  onClick={() => setReportTypeFilter('all')}
                  className="ml-1 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Contador de resultados */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-600">
            Mostrando{' '}
            <span className="font-semibold text-slate-900">
              {filteredReports.length}
            </span>{' '}
            de {allReports.length} reportes
          </p>
        </div>
      </div>

      {/* Lista de Reportes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Reportes de Docentes
          </h3>
          <Badge variant="info">{filteredReports.length} reportes</Badge>
        </div>

        {filteredReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Título del Reporte</th>
                  <th className="px-6 py-3 font-medium">Profesor</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium">Fecha</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Proyectos</th>
                  <th className="px-6 py-3 font-medium">Promedio</th>
                  <th className="px-6 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-900">
                          {report.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-4 h-4 text-slate-400" />
                        {report.teacher}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{report.type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {report.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-slate-900">
                        {report.projectsEvaluated}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {report.averageGrade > 0 ? (
                        <span className="font-bold text-green-600">
                          {report.averageGrade.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Eye className="w-4 h-4" />}
                        >
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Download className="w-4 h-4" />}
                        >
                          Descargar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="bg-slate-100 p-4 rounded-full inline-block mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No se encontraron reportes
            </h3>
            <p className="text-slate-500 mb-4">
              No hay reportes que coincidan con los filtros seleccionados.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {/* Resumen de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 mb-2">
            Total Reportes
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {filteredReports.length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 mb-2">Completados</p>
          <p className="text-3xl font-bold text-green-600">
            {filteredReports.filter((r) => r.status === 'Completado').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 mb-2">Pendientes</p>
          <p className="text-3xl font-bold text-yellow-600">
            {filteredReports.filter((r) => r.status === 'Pendiente').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 mb-2">
            Promedio General
          </p>
          <p className="text-3xl font-bold text-blue-600">
            {filteredReports.length > 0
              ? (
                  filteredReports.reduce((acc, r) => acc + r.averageGrade, 0) /
                  filteredReports.filter((r) => r.averageGrade > 0).length
                ).toFixed(1)
              : '0.0'}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
