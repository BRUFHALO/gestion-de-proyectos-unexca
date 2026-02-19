import React, { useState, Component, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  GraduationCap,
  LogIn,
  Menu,
  X,
  Loader2
} from
'lucide-react';
import { ProjectCard } from '../components/features/ProjectCard';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MainLayout } from '../components/layout/MainLayout';
import { projectsAPI, API_BASE_URL } from '../services/api';
interface PublicLibraryProps {
  user: any;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  onLogin: () => void;
}
export function PublicLibrary({
  user,
  onLogout,
  onNavigate,
  onLogin
}: PublicLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCareer, setSelectedCareer] = useState('all');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar proyectos publicados desde el backend
  useEffect(() => {
    const fetchPublishedProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/v1/coordinator/published`);
        
        if (!response.ok) {
          throw new Error('Error al cargar los proyectos');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Mapeo de nombres de carrera del backend al estándar
          const careerMapping: { [key: string]: string } = {
            'ingenieria agroalimentaria': 'Ingeniería Agroalimentaria',
            'administracion': 'Administracion de Empresas',
            'informatica': 'Ingeniería en Informática',
            'turismo': 'Turismo',
            'distribucion': 'Distribucion y Logistica'
          };

          // Transformar los datos al formato esperado por el componente
          const transformedProjects = data.projects.map((project: any) => {
            console.log('Datos del proyecto:', project);
            console.log('Career original:', project.career);
            console.log('Career mapeada:', careerMapping[project.career.toLowerCase()]);
            
            return {
              id: project.id,
              title: project.title,
              authors: [project.studentName],
              career: careerMapping[project.career.toLowerCase()] || project.career,
              year: new Date().getFullYear().toString(),
              methodology: project.methodology || 'No especificada',
              abstract: project.description || 'Sin descripción disponible',
              methods: [], // Este dato podría venir del backend
              thumbnail: '/src/config/logoUnexca.jpg',
              file_id: project.file_id
            };
          });
          
          setProjects(transformedProjects);
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
  }, []); // Se ejecuta solo al montar el componente

  // Función para descargar el PDF de un proyecto
  const handleDownloadPDF = async (projectId: string, file_id: string | null, title: string) => {
    if (!file_id) {
      alert('No hay archivo disponible para descargar');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/projects/download/${file_id}`);
      
      if (!response.ok) {
        throw new Error('Error al descargar el archivo');
      }

      // Crear un blob desde la respuesta
      const blob = await response.blob();
      
      // Crear una URL temporal para el blob
      const url = window.URL.createObjectURL(blob);
      
      // Crear un elemento <a> temporal para la descarga
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      
      // Simular clic en el elemento
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error al descargar el PDF. Por favor, inténtalo de nuevo.');
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.authors.some((a: string) => a.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCareer =
    selectedCareer === 'all' || p.career === selectedCareer;
    return matchesSearch && matchesCareer;
  });
  // Si el usuario está autenticado, usar el MainLayout con sidebar
  if (user) {
    return (
      <MainLayout
        role={user.role}
        currentPage="library"
        onNavigate={onNavigate}
        onLogout={onLogout}
        user={user}
        title="Biblioteca Digital">

        <LibraryContent
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCareer={selectedCareer}
          setSelectedCareer={setSelectedCareer}
          filteredProjects={filteredProjects}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          loading={loading}
          error={error}
          onDownloadPDF={handleDownloadPDF} />

      </MainLayout>);

  }
  // Vista pública sin autenticación
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Público */}
      <header className="bg-primary text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-accent rounded-lg p-1.5">
                <GraduationCap className="w-7 h-7 text-primary-dark" />
              </div>
              <div>
                <h1 className="font-bold text-lg">UNEXCA</h1>
                <p className="text-xs text-slate-300 hidden sm:block">
                  Biblioteca Digital
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-slate-200">
                ¿Eres parte de UNEXCA?
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={onLogin}
                leftIcon={<LogIn className="w-4 h-4" />}>

                Iniciar Sesión
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-primary-light rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>

              {mobileMenuOpen ?
              <X className="w-6 h-6" /> :

              <Menu className="w-6 h-6" />
              }
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen &&
          <div className="md:hidden py-4 border-t border-primary-light">
              <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogin();
              }}
              leftIcon={<LogIn className="w-4 h-4" />}>

                Iniciar Sesión
              </Button>
            </div>
          }
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Biblioteca Digital UNEXCA
          </h2>
          <p className="text-lg text-slate-200 max-w-2xl mx-auto mb-8">
            Explora proyectos académicos de excelencia. Acceso libre a trabajos
            de grado, investigaciones y proyectos de nuestra comunidad
            universitaria.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
              📚 Repositorio Académico
            </span>
            <span className="px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
              🔬 Investigaciones
            </span>
            <span className="px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
              📄 Trabajos de Grado
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LibraryContent
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCareer={selectedCareer}
          setSelectedCareer={setSelectedCareer}
          filteredProjects={filteredProjects}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          loading={loading}
          error={error}
          onDownloadPDF={handleDownloadPDF} />

      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-6 h-6 text-accent" />
            <span className="font-bold text-white">UNEXCA</span>
          </div>
          <p className="text-sm">
            Universidad Nacional Experimental de la Gran Caracas
          </p>
          <p className="text-xs mt-2 text-slate-400">
            © 2024 Biblioteca Digital. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>);

}
// Componente interno para el contenido de la biblioteca
function LibraryContent({
  searchQuery,
  setSearchQuery,
  selectedCareer,
  setSelectedCareer,
  filteredProjects,
  selectedProject,
  setSelectedProject,
  loading,
  error,
  onDownloadPDF
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCareer: string;
  setSelectedCareer: (c: string) => void;
  filteredProjects: any[];
  selectedProject: any;
  setSelectedProject: (p: any) => void;
  loading?: boolean;
  error?: string | null;
  onDownloadPDF?: (projectId: string, file_id: string | null, title: string) => Promise<void>;
}) {
  return (
    <>
      {/* Sección de Filtros */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <Input
              placeholder="Buscar por título, autor o palabra clave..."
              icon={<Search className="w-5 h-5" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} />

          </div>
          <div className="md:col-span-4">
            <Select
              options={[
              {
                value: 'all',
                label: 'Todas las Carreras'
              },
              {
                value: 'Turismo',
                label: 'Turismo'
              },
              {
                value: 'Ingeniería Agroalimentaria',
                label: 'Ingeniería Agroalimentaria'
              },
              {
                value: 'Ingeniería en Informática',
                label: 'Ingeniería en Informática'
              },
              {
                value: 'Administracion de Empresas',
                label: 'Administracion de Empresas'
              },
              {
                value: 'Distribucion y Logistica',
                label: 'Distribucion y Logistica'
              }]
              }
              value={selectedCareer}
              onChange={(e) => setSelectedCareer(e.target.value)} />

          </div>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="mb-6">
        <p className="text-sm text-slate-600">
          Mostrando{' '}
          <span className="font-semibold text-slate-900">
            {filteredProjects.length}
          </span>{' '}
          proyectos
        </p>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-slate-600">Cargando proyectos...</span>
        </div>
      )}

      {/* Estado de error */}
      {error && (
        <div className="text-center py-20">
          <div className="bg-red-50 p-4 rounded-full inline-block mb-4">
            <X className="w-8 h-8 text-red-500" />
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

      {/* Grid de Proyectos */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) =>
          <ProjectCard
            key={project.id}
            {...project}
            onView={() => setSelectedProject(project)}
            onDownload={() => onDownloadPDF && onDownloadPDF(project.id, project.file_id, project.title)} />

          )}
        </div>
      )}

      {!loading && !error && filteredProjects.length === 0 &&
      <div className="text-center py-20">
          <div className="bg-slate-100 p-4 rounded-full inline-block mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">
            No se encontraron proyectos
          </h3>
          <p className="text-slate-500">
            Intenta ajustar tu búsqueda o los filtros.
          </p>
        </div>
      }

      {/* Modal de Detalles del Proyecto */}
      <Modal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title="Detalles del Proyecto"
        size="lg">

        {selectedProject &&
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <img
              src={selectedProject.thumbnail}
              alt={selectedProject.title}
              className="w-full md:w-1/3 h-48 object-cover rounded-lg" />

              <div className="flex-1">
                <Badge variant="info" className="mb-2">
                  {selectedProject.career}
                </Badge>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {selectedProject.title}
                </h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedProject.authors.map((author: string) =>
                <span
                  key={author}
                  className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">

                      {author}
                    </span>
                )}
                  <span className="text-sm text-slate-400 px-2 py-1">•</span>
                  <span className="text-sm text-slate-600 px-2 py-1">
                    {selectedProject.year}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {selectedProject.abstract}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">
                  Metodología
                </h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="font-medium text-primary">
                    {selectedProject.methodology}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">
                  Métodos y Herramientas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.methods.map((method: string) =>
                <Badge key={method} variant="outline">
                      {method}
                    </Badge>
                )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100">
              <Button
              onClick={() => onDownloadPDF?.(selectedProject.id, selectedProject.file_id, selectedProject.title)}
              leftIcon={<Download className="w-4 h-4" />}>

                Descargar PDF Completo
              </Button>
            </div>
          </div>
        }
      </Modal>
    </>);

}