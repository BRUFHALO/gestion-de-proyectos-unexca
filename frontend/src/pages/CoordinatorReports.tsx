import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  X,
  Archive
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

interface Document {
  message_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  timestamp: string;
  message: string;
}

const API_BASE_URL = 'http://localhost:8000';

export function CoordinatorReports({
  user,
  onLogout,
  onNavigate
}: CoordinatorReportsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [downloading, setDownloading] = useState(false);

  // Cargar documentos del coordinador
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/simple-chat/coordinator-documents/${user.id}`);
      
      if (!response.ok) {
        throw new Error('Error cargando documentos');
      }
      
      const data = await response.json();
      
      // Filtrar solo documentos (no imágenes)
      const documentFiles = data.documents.filter((doc: Document) => {
        const fileType = doc.file_type.toLowerCase();
        return !fileType.startsWith('image/');
      });
      
      setDocuments(documentFiles);
    } catch (error) {
      console.error('Error cargando documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener lista única de profesores
  const teachers = [...new Set(documents.map(doc => doc.sender_name))].sort();

  // Filtrar documentos
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchQuery === '' || 
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.sender_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTeacher = teacherFilter === 'all' || doc.sender_name === teacherFilter;

    return matchesSearch && matchesTeacher;
  });

  // Descargar documento
  const downloadDocument = async (fileUrl: string, fileName: string) => {
    try {
      // Extraer el filename del URL para usar el endpoint de descarga
      const filename = fileUrl.split('/').pop() || fileName;
      const downloadUrl = `${API_BASE_URL}/api/v1/simple-chat/download/${filename}`;
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/octet-stream, application/pdf, image/*, */*',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error descargando documento:', error);
      alert('No se pudo descargar el documento');
    }
  };

  // Descargar todos los documentos
  const downloadAllDocuments = async () => {
    setDownloading(true);
    
    for (const doc of filteredDocuments) {
      try {
        await downloadDocument(doc.file_url, doc.file_name);
        // Pequeña pausa entre descargas
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error descargando ${doc.file_name}:`, error);
      }
    }
    
    setDownloading(false);
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Obtener icono según tipo de archivo
  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.startsWith('text/')) return '📄';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    return '📎';
  };

  // Formatear fecha
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTeacherFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || teacherFilter !== 'all';

  return (
    <MainLayout
      role="coordinator"
      currentPage="coordinator-reports"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={user}
      title="Reportes de Documentos"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Archive className="w-8 h-8 text-primary" />
              Reportes de Documentos
            </h1>
            <p className="text-slate-600 mt-1">
              Todos los documentos enviados por los profesores
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="info" className="text-sm">
              {filteredDocuments.length} documentos
            </Badge>
            {filteredDocuments.length > 0 && (
              <Button
                onClick={downloadAllDocuments}
                disabled={downloading}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Descargando...' : 'Descargar Todo'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-slate-900">Filtros</h3>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              placeholder="Buscar por nombre de documento o profesor..."
              icon={<Search className="w-5 h-5" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
        </div>
      </div>

      {/* Lista de Documentos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando documentos...</p>
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Documento</th>
                  <th className="px-6 py-3 font-medium">Profesor</th>
                  <th className="px-6 py-3 font-medium">Tamaño</th>
                  <th className="px-6 py-3 font-medium">Fecha</th>
                  <th className="px-6 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.message_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getFileIcon(doc.file_type)}</span>
                        <div>
                          <p className="font-medium text-slate-900 truncate max-w-xs">
                            {doc.file_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {doc.file_type}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-4 h-4 text-slate-400" />
                        {doc.sender_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600">
                        {formatFileSize(doc.file_size)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDate(doc.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadDocument(doc.file_url, doc.file_name)}
                          className="flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
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
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No se encontraron documentos
            </h3>
            <p className="text-slate-500 mb-4">
              {hasActiveFilters 
                ? 'No hay documentos que coincidan con los filtros seleccionados.'
                : 'No hay documentos enviados por los profesores aún.'
              }
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 mb-2">
            Total de Documentos
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {filteredDocuments.length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 mb-2">
            Profesores Participantes
          </p>
          <p className="text-3xl font-bold text-blue-600">
            {teachers.length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 mb-2">
            Tamaño Total
          </p>
          <p className="text-3xl font-bold text-green-600">
            {formatFileSize(filteredDocuments.reduce((acc, doc) => acc + doc.file_size, 0))}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
