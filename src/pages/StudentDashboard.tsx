import React, { useState } from 'react';
import { Upload, Clock, CheckCircle, FileText, Plus, Eye } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
  onNavigate: (page: string, data?: any) => void;
}
export function StudentDashboard({
  user,
  onLogout,
  onNavigate
}: StudentDashboardProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  // Datos de ejemplo
  const stats = [
  {
    label: 'Enviados',
    value: '3',
    icon: <FileText className="w-6 h-6 text-blue-600" />,
    bg: 'bg-blue-100'
  },
  {
    label: 'En Revisión',
    value: '1',
    icon: <Clock className="w-6 h-6 text-yellow-600" />,
    bg: 'bg-yellow-100'
  },
  {
    label: 'Aprobados',
    value: '2',
    icon: <CheckCircle className="w-6 h-6 text-green-600" />,
    bg: 'bg-green-100'
  }];

  const myProjects = [
  {
    id: 1,
    title: 'IA en Planificación Urbana',
    status: 'Aprobado',
    date: '12 Oct, 2024',
    feedback: 'Excelente trabajo en la metodología.',
    hasComments: true,
    commentsCount: 5,
    grade: 95
  },
  {
    id: 2,
    title: 'Blockchain para Cadena de Suministro',
    status: 'Pendiente',
    date: '05 Nov, 2024',
    feedback: null,
    hasComments: false,
    commentsCount: 0,
    grade: null
  },
  {
    id: 3,
    title: 'Framework de Seguridad IoT',
    status: 'Rechazado',
    date: '20 Sep, 2024',
    feedback: 'Necesita citas más recientes.',
    hasComments: true,
    commentsCount: 8,
    grade: null
  }];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aprobado':
        return <Badge variant="success">Aprobado</Badge>;
      case 'Pendiente':
        return <Badge variant="warning">En Revisión</Badge>;
      case 'Rechazado':
        return <Badge variant="danger">Requiere Corrección</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };
  const handleViewDetails = (projectId: number) => {
    onNavigate('student-feedback', {
      projectId
    });
  };
  return (
    <MainLayout
      role="student"
      currentPage="student-dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={user}
      title="Mi Panel"
      actions={
      <Button
        onClick={() => setIsUploadModalOpen(true)}
        leftIcon={<Plus className="w-4 h-4" />}>

          Nueva Entrega
        </Button>
      }>

      {/* Grid de Estadísticas */}
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

      {/* Lista de Proyectos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900">Entregas Recientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Título del Proyecto</th>
                <th className="px-6 py-3 font-medium">Fecha de Entrega</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Calificación</th>
                <th className="px-6 py-3 font-medium">Comentarios</th>
                <th className="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myProjects.map((project) =>
              <tr
                key={project.id}
                className="hover:bg-slate-50 transition-colors">

                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {project.title}
                      </p>
                      {project.feedback &&
                    <p className="text-xs text-slate-500 mt-1 truncate max-w-xs">
                          "{project.feedback}"
                        </p>
                    }
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{project.date}</td>
                  <td className="px-6 py-4">
                    {getStatusBadge(project.status)}
                  </td>
                  <td className="px-6 py-4">
                    {project.grade ?
                  <span className="font-bold text-green-600">
                        {project.grade}/100
                      </span> :

                  <span className="text-slate-400">—</span>
                  }
                  </td>
                  <td className="px-6 py-4">
                    {project.hasComments ?
                  <Badge variant="info" className="text-xs">
                        {project.commentsCount} comentarios
                      </Badge> :

                  <span className="text-slate-400 text-xs">
                        Sin comentarios
                      </span>
                  }
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(project.id)}
                    leftIcon={<Eye className="w-4 h-4" />}>

                      Ver Detalles
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Subida */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Enviar Nuevo Proyecto">

        <form className="space-y-4">
          <Input
            label="Título del Proyecto"
            placeholder="Ingresa el título del proyecto" />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Metodología"
              placeholder="Ej: Scrum, Investigación-Acción" />

            <Input
              label="Carrera"
              placeholder="Ej: Ingeniería en Informática" />

          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer">
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-900">
              Haz clic para subir PDF
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Solo archivos PDF, máximo 10MB
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsUploadModalOpen(false)}
              className="mr-2">

              Cancelar
            </Button>
            <Button type="submit">Enviar Proyecto</Button>
          </div>
        </form>
      </Modal>
    </MainLayout>);

}