import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { MainLayout } from '../components/layout/MainLayout';

interface ApprovedProjectsProps {
  user: any;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

interface Project {
  id: string;
  title: string;
  studentName: string;
  teacherName: string;
  career: string;
  publishedDate: string;
  evaluation: {
    grade: number;
    comments: number;
  };
  file_id?: string;
}

export function ApprovedProjects({
  user,
  onLogout,
  onNavigate
}: ApprovedProjectsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCareer, setSelectedCareer] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Cargar proyectos publicados
  useEffect(() => {
    const fetchPublishedProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/v1/coordinator/published');
        
        if (!response.ok) {
          throw new Error('Error al cargar los proyectos');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setProjects(data.projects);
        } else {
          setError('No se pudieron cargar los proyectos');
        }
      } catch (err) {
        console.error('Error fetching published projects:', err);
        setError('Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchPublishedProjects();
  }, []);

  // Función para descargar PDF
  const handleDownloadPDF = async (projectId: string, file_id: string | null, title: string) => {
    if (!file_id) {
      alert('No hay archivo disponible para descargar');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/projects/download/${file_id}`);
      
      if (!response.ok) {
        throw new Error('Error al descargar el archivo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error al descargar el PDF. Por favor, inténtalo de nuevo.');
    }
  };

  // Función para eliminar proyecto de la biblioteca pública
  const handleDeleteProject = async (project: Project) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/coordinator/${project.id}/unpublish`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar el proyecto');
      }
      
      // Actualizar la lista de proyectos
      setProjects(projects.filter(p => p.id !== project.id));
      setDeleteModalOpen(false);
      setProjectToDelete(null);
      
      // Mostrar mensaje de éxito
      alert('Proyecto eliminado de la biblioteca pública exitosamente');
      
    } catch (error) {
      console.error('Error eliminando proyecto:', error);
      alert('Error al eliminar el proyecto. Por favor, inténtalo de nuevo.');
    }
  };

  // Filtrar proyectos
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCareer = selectedCareer === 'all' || project.career === selectedCareer;
    
    return matchesSearch && matchesCareer;
  });

  return (
    <MainLayout
      role={user.role}
      currentPage="approved-projects"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={user}
      title="Proyectos Aprobados">
      
      <div className="space-y-6">
        {/* Header con contador y botón de recargar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Proyectos Aprobados</h1>
            <p className="text-slate-600 mt-1">
              Gestiona los proyectos publicados en la biblioteca digital
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="info" className="px-3 py-1">
              {projects.length} Publicados
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              leftIcon={<RefreshCw className="w-4 h-4" />}>
              Recargar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8">
              <Input
                placeholder="Buscar por título, estudiante o profesor..."
                icon={<Search className="w-5 h-5" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="md:col-span-4">
              <Select
                options={[
                  { value: 'all', label: 'Todas las Carreras' },
                  { value: 'Turismo', label: 'Turismo' },
                  { value: 'Ingeniería Agroalimentaria', label: 'Ingeniería Agroalimentaria' },
                  { value: 'Administración de Empresas', label: 'Administración de Empresas' },
                  { value: 'Ingeniería Informática', label: 'Ingeniería Informática' },
                  { value: 'Distribución Logística', label: 'Distribución Logística' }
                ]}
                value={selectedCareer}
                onChange={(e) => setSelectedCareer(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-slate-600">Cargando proyectos...</span>
          </div>
        )}

        {/* Estado de error */}
        {error && (
          <div className="text-center py-20">
            <div className="bg-red-50 p-4 rounded-full inline-block mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Error al cargar proyectos
            </h3>
            <p className="text-slate-500 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* Lista de proyectos */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-20">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No se encontraron proyectos
                </h3>
                <p className="text-slate-500">
                  No hay proyectos que coincidan con tu búsqueda.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Proyecto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Estudiante
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Profesor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Carrera
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Calificación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {project.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              ID: {project.id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {project.studentName}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {project.teacherName}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-xs">
                            {project.career}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">
                              {project.evaluation.grade}/20
                            </span>
                            {project.evaluation.comments > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {project.evaluation.comments} comentarios
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {project.publishedDate}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedProject(project)}
                              leftIcon={<Eye className="w-4 h-4" />}
                              title="Ver detalles"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPDF(project.id, project.file_id || null, project.title)}
                              leftIcon={<Download className="w-4 h-4" />}
                              title="Descargar PDF"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setProjectToDelete(project);
                                setDeleteModalOpen(true);
                              }}
                              leftIcon={<Trash2 className="w-4 h-4 text-red-500" />}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar de biblioteca"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal de detalles */}
        <Modal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title="Detalles del Proyecto"
          size="lg">
          {selectedProject && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {selectedProject.title}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Estudiante:</span>
                    <p className="font-medium text-slate-900">{selectedProject.studentName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Profesor:</span>
                    <p className="font-medium text-slate-900">{selectedProject.teacherName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Carrera:</span>
                    <p className="font-medium text-slate-900">{selectedProject.career}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Publicado:</span>
                    <p className="font-medium text-slate-900">{selectedProject.publishedDate}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProject(null)}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => handleDownloadPDF(selectedProject.id, selectedProject.file_id || null, selectedProject.title)}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Descargar PDF
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal de confirmación de eliminación */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setProjectToDelete(null);
          }}
          title="Confirmar Eliminación"
          size="md">
          {projectToDelete && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
                <span className="font-medium">Esta acción eliminará el proyecto de la biblioteca pública</span>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">{projectToDelete.title}</h4>
                <p className="text-sm text-slate-600">
                  Estudiante: {projectToDelete.studentName}<br />
                  Carrera: {projectToDelete.career}
                </p>
              </div>
              
              <p className="text-sm text-slate-600">
                El proyecto ya no estará disponible para el público en general, pero permanecerá en el sistema.
              </p>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setProjectToDelete(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteProject(projectToDelete)}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Eliminar de Biblioteca
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
}
