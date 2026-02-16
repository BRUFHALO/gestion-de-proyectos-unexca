import React, { useState, useEffect } from 'react';
import { Upload, Clock, CheckCircle, FileText, Plus, Eye, User, BookOpen, AlertCircle, MessageSquare } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { projectsAPI, API_BASE_URL } from '../services/api';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ChatPanel } from '../components/ChatPanel';
import { NotificationsDropdown } from '../components/NotificationsDropdown';
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
  const [userData, setUserData] = useState<any>(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    methodology: '',
    keywords: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { showToast } = useToast();

  // Cargar datos completos del usuario desde localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  // Cargar proyectos del estudiante desde la API
  useEffect(() => {
    const fetchProjects = async () => {
      if (!userData?._id) return;
      
      setLoadingProjects(true);
      try {
        const projects = await projectsAPI.getAll({ created_by: userData._id });
        
        // Cargar información de evaluación para cada proyecto
        const projectsWithEvaluation = await Promise.all(
          projects.map(async (project) => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/v1/projects/${project._id}/evaluation/grade`);
              if (response.ok) {
                const evaluationData = await response.json();
                return { ...project, evaluation: evaluationData };
              }
            } catch (error) {
              console.error(`Error loading evaluation for project ${project._id}:`, error);
            }
            return project;
          })
        );
        
        setMyProjects(projectsWithEvaluation);
      } catch (error) {
        console.error('Error al cargar proyectos:', error);
        showToast('error', 'Error al cargar tus proyectos');
      } finally {
        setLoadingProjects(false);
      }
    };

    if (userData) {
      fetchProjects();
    }
  }, [userData, showToast]);
  // Calcular estadísticas desde proyectos reales
  const stats = [
  {
    label: 'Enviados',
    value: myProjects.length.toString(),
    icon: <FileText className="w-6 h-6 text-blue-600" />,
    bg: 'bg-blue-100'
  },
  {
    label: 'En Revisión',
    value: myProjects.filter(p => p.metadata?.status === 'submitted' || p.metadata?.status === 'in_review').length.toString(),
    icon: <Clock className="w-6 h-6 text-yellow-600" />,
    bg: 'bg-yellow-100'
  },
  {
    label: 'Aprobados',
    value: myProjects.filter(p => p.metadata?.status === 'approved').length.toString(),
    icon: <CheckCircle className="w-6 h-6 text-green-600" />,
    bg: 'bg-green-100'
  }];


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Aprobado</Badge>;
      case 'submitted':
        return <Badge variant="info">Enviado</Badge>;
      case 'in_review':
        return <Badge variant="warning">En Revisión</Badge>;
      case 'rejected':
        return <Badge variant="danger">Requiere Corrección</Badge>;
      case 'published':
        return <Badge variant="success">Publicado</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const handleViewDetails = (projectId: string) => {
    onNavigate('student-pdf-viewer', {
      projectId
    });
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        setUploadError('Solo se permiten archivos PDF');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setUploadError('El archivo no debe superar 20MB');
        return;
      }
      setSelectedFile(file);
      setUploadError('');
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Debes seleccionar un archivo PDF');
      return;
    }
    if (!uploadData.title) {
      setUploadError('El título es obligatorio');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      // Preparar FormData
      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('methodology', uploadData.methodology);
      formData.append('keywords', uploadData.keywords);
      formData.append('student_id', userData._id);
      formData.append('file', selectedFile);

      // Importar API
      const { projectsAPI } = await import('../services/api');
      
      // Subir proyecto
      const response = await projectsAPI.uploadProject(formData);
      
      // Éxito
      setIsUploadModalOpen(false);
      setUploadData({ title: '', description: '', methodology: '', keywords: '' });
      setSelectedFile(null);
      
      // Mostrar toast de éxito
      showToast('success', `Proyecto "${uploadData.title}" enviado exitosamente. Ha sido asignado a tu profesor para evaluación.`);
      
      // Recargar lista de proyectos
      const projects = await projectsAPI.getAll({ created_by: userData._id });
      setMyProjects(projects);
    } catch (error: any) {
      setUploadError(error.message || 'Error al subir el proyecto');
      console.error('Error al subir proyecto:', error);
    } finally {
      setUploading(false);
    }
  };

  const trayectoRomano = (num: number) => {
    const romanos = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
    return romanos[num] || num.toString();
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
        <div className="flex items-center gap-3">
          {userData?._id && <NotificationsDropdown userId={userData._id} userRole="student" />}
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Entrega
          </Button>
        </div>
      }>

      {/* Información Académica y Profesor Asignado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Información Académica */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-primary to-primary-dark text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-white/80 mb-1">Información Académica</p>
                <h3 className="text-2xl font-bold">
                  Trayecto {userData?.university_data?.current_trayect ? trayectoRomano(userData.university_data.current_trayect) : '—'}
                </h3>
                <p className="text-lg font-semibold text-white/90">
                  Semestre {userData?.university_data?.current_semester ? trayectoRomano(userData.university_data.current_semester) : '—'}
                </p>
              </div>
              <BookOpen className="w-10 h-10 text-white/60" />
            </div>
            <div className="border-t border-white/20 pt-4 mt-4">
              <p className="text-sm text-white/80 mb-1">Carrera</p>
              <p className="font-medium">{userData?.university_data?.career || 'No especificada'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Profesor Asignado */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Profesor Asignado</p>
                <h3 className="text-xl font-bold text-slate-900">
                  {userData?.assigned_teacher?.teacher_name || 'No asignado'}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <User className="w-6 h-6 text-green-600" />
              </div>
            </div>
            {userData?.assigned_teacher && (
              <div className="space-y-3">
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-500 mb-1">Materia</p>
                  <p className="font-medium text-slate-900">
                    {userData.assigned_teacher.subject_name || 'No especificada'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Código: {userData.assigned_teacher.subject_code || '—'}
                  </p>
                </div>
              </div>
            )}
            {!userData?.assigned_teacher && (
              <div className="text-center py-4">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Aún no tienes profesor asignado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
          {loadingProjects && (
            <span className="text-sm text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 animate-spin" />
              Cargando...
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          {loadingProjects ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-slate-500">Cargando proyectos...</p>
              </div>
            </div>
          ) : myProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No tienes proyectos enviados</p>
              <p className="text-sm text-slate-400 mt-1">Haz clic en "Nueva Entrega" para subir tu primer proyecto</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Título del Proyecto</th>
                  <th className="px-6 py-3 font-medium">Fecha de Entrega</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Metodología</th>
                  <th className="px-6 py-3 font-medium">Evaluaciones</th>
                  <th className="px-6 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myProjects.map((project) =>
                <tr
                  key={project._id}
                  className="hover:bg-slate-50 transition-colors">

                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {project.title}
                        </p>
                        {project.description &&
                      <p className="text-xs text-slate-500 mt-1 truncate max-w-xs">
                            {project.description}
                          </p>
                      }
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(project.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(project.metadata?.status || 'submitted')}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {project.academic_info?.methodology || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {project.evaluation?.status ? (
                        <Badge 
                          variant={
                            project.evaluation.status === 'aprobado' ? 'success' :
                            project.evaluation.status === 'reprobado' ? 'danger' : 'warning'
                          } 
                          className="text-xs"
                        >
                          {project.evaluation.status === 'en_revision' ? '🔄 En Revisión' :
                           project.evaluation.status === 'aprobado' ? '✅ Aprobado' :
                           project.evaluation.status === 'reprobado' ? '❌ Reprobado' : '📝 Sin evaluar'}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-xs">
                          Sin evaluar
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(project._id)}
                      leftIcon={<Eye className="w-4 h-4" />}>

                        Ver Detalles
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Subida */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadError('');
          setSelectedFile(null);
        }}
        title="Enviar Nuevo Proyecto">

        <form onSubmit={handleSubmitProject} className="space-y-4">
          <Input
            label="Título del Proyecto *"
            placeholder="Ingresa el título del proyecto"
            value={uploadData.title}
            onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descripción
            </label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Breve descripción del proyecto"
              value={uploadData.description}
              onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Metodología"
              placeholder="Ej: Scrum, Investigación-Acción"
              value={uploadData.methodology}
              onChange={(e) => setUploadData({ ...uploadData, methodology: e.target.value })}
            />

            <Input
              label="Palabras Clave"
              placeholder="Separadas por comas"
              value={uploadData.keywords}
              onChange={(e) => setUploadData({ ...uploadData, keywords: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Archivo PDF *
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-4" />
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">
                      ✓ {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Haz clic para subir documento PDF
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Solo archivos PDF, máximo 20MB
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{uploadError}</p>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-xs text-slate-600 mb-2">📋 Información de envío:</p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>• Profesor: {userData?.assigned_teacher?.teacher_name || 'No asignado'}</li>
              <li>• Materia: {userData?.assigned_teacher?.subject_name || 'No especificada'}</li>
              <li>• Trayecto: {userData?.university_data?.current_trayect ? trayectoRomano(userData.university_data.current_trayect) : '—'} - Semestre: {userData?.university_data?.current_semester ? trayectoRomano(userData.university_data.current_semester) : '—'}</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsUploadModalOpen(false);
                setUploadError('');
                setSelectedFile(null);
              }}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Enviando...' : 'Enviar Proyecto'}
            </Button>
          </div>
        </form>
      </Modal>

    </MainLayout>);

}