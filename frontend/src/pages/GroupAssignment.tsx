import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Users, UserPlus, Trash2, Search, AlertCircle } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { MainLayout } from '../components/layout/MainLayout';

interface Student {
  _id: string;
  name: string;
  email: string;
  cedula: string;
  section?: string;
}

interface GroupResponsible {
  _id: string;
  student: Student;
  assignedAt: string;
  assignedBy: string;
}

export default function GroupAssignment({ user, onLogout, onNavigate }: { 
  user: any;
  onLogout: () => void;
  onNavigate: (page: string, params?: any) => void;
}) {
  const { showToast } = useToast();
  const [responsibles, setResponsibles] = useState<GroupResponsible[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCedula, setNewCedula] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchingStudent, setSearchingStudent] = useState(false);

  // Cargar responsables existentes
  useEffect(() => {
    loadResponsibles();
  }, []);

  const loadResponsibles = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = 'http://localhost:8000';
      
      // Cargar responsables existentes del docente
      const response = await fetch(`${API_BASE_URL}/api/v1/group-responsibles/teacher/${user._id}`);
      if (response.ok) {
        const data = await response.json();
        setResponsibles(data);
      } else {
        setResponsibles([]); // Si no hay datos, iniciar vacío
      }
    } catch (error) {
      console.error('Error al cargar responsables:', error);
      showToast('error', 'Error al cargar los responsables');
      setResponsibles([]); // En caso de error, iniciar vacío
    } finally {
      setLoading(false);
    }
  };

  const searchStudentByCedula = async (cedula: string) => {
    try {
      setSearchingStudent(true);
      const API_BASE_URL = 'http://localhost:8000';
      
      // Buscar estudiante por cédula en la BD
      const response = await fetch(`${API_BASE_URL}/api/v1/users/by-cedula/${cedula}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          showToast('error', 'No se encontró un estudiante con esa cédula');
        } else {
          showToast('error', 'Error al buscar el estudiante');
        }
        return null;
      }

      const student = await response.json();
      return student;
    } catch (error) {
      console.error('Error al buscar estudiante:', error);
      showToast('error', 'Error al buscar el estudiante');
      return null;
    } finally {
      setSearchingStudent(false);
    }
  };

  const assignResponsible = async () => {
    if (!newCedula.trim()) {
      showToast('error', 'Por favor ingrese un número de cédula');
      return;
    }

    // Verificar si ya está asignado
    const alreadyAssigned = responsibles.some(r => r.student.cedula === newCedula);
    if (alreadyAssigned) {
      showToast('error', 'Este estudiante ya está asignado como responsable');
      return;
    }

    // Buscar estudiante en la BD
    const student = await searchStudentByCedula(newCedula);
    if (!student) {
      return; // El mensaje de error ya se mostró en searchStudentByCedula
    }

    try {
      setLoading(true);
      const API_BASE_URL = 'http://localhost:8000';
      
      // Crear nuevo responsable en el backend
      const response = await fetch(`${API_BASE_URL}/api/v1/group-responsibles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student._id,
          teacherId: user._id,
          assignedBy: user.name || 'Docente'
        })
      });

      if (!response.ok) {
        throw new Error('Error al asignar responsable');
      }

      const newResponsible = await response.json();
      setResponsibles([...responsibles, newResponsible]);
      setNewCedula('');
      showToast('success', `${student.name} ha sido asignado como responsable de grupo`);

    } catch (error) {
      console.error('Error al asignar responsable:', error);
      showToast('error', 'Error al asignar el responsable');
    } finally {
      setLoading(false);
    }
  };

  const removeResponsible = async (responsibleId: string) => {
    const responsible = responsibles.find(r => r._id === responsibleId);
    if (!responsible) return;

    try {
      const API_BASE_URL = 'http://localhost:8000';
      
      // Eliminar responsable del backend
      const response = await fetch(`${API_BASE_URL}/api/v1/group-responsibles/${responsibleId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar responsable');
      }

      setResponsibles(responsibles.filter(r => r._id !== responsibleId));
      showToast('info', `${responsible.student.name} ya no es responsable de grupo`);

    } catch (error) {
      console.error('Error al eliminar responsable:', error);
      showToast('error', 'Error al eliminar el responsable');
    }
  };

  const filteredResponsibles = responsibles.filter(responsible =>
    responsible.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    responsible.student.cedula.includes(searchTerm)
  );

  return (
    <MainLayout
      role="teacher"
      currentPage="group-assignment"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={user}
      title="Asignación de Responsables de Grupo"
    >
      <div className="p-6">
        <div className="mb-6">
          <p className="text-slate-600">
            Agrega estudiantes que podrán enviar proyectos en nombre de su grupo. 
            Solo los estudiantes asignados como responsables podrán crear y enviar proyectos.
          </p>
        </div>

        {/* Agregar nuevo responsable */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Agregar Nuevo Responsable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Número de cédula del estudiante"
                  value={newCedula}
                  onChange={(e) => setNewCedula(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && assignResponsible()}
                  disabled={loading || searchingStudent}
                />
              </div>
              <Button 
                onClick={assignResponsible} 
                disabled={loading || searchingStudent || !newCedula.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {searchingStudent ? 'Buscando...' : loading ? 'Agregando...' : 'Agregar Responsable'}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Ingresa el número de cédula y el sistema buscará automáticamente los datos del estudiante
            </p>
          </CardContent>
        </Card>

        {/* Lista de responsables */}
        {responsibles.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Responsables de Grupo ({responsibles.length})
                </CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar responsables..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResponsibles.map((responsible) => {
                  console.log('Datos del responsable:', responsible);
                  return (
                  <Card key={responsible._id} className="border-slate-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-slate-900">{responsible.student.name || 'Sin nombre'}</h3>
                          <p className="text-sm text-slate-600">Responsable de Grupo</p>
                        </div>
                        <Badge variant="success">
                          Activo
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-green-900">Información del Estudiante:</p>
                              <p className="text-sm text-green-800">Cédula: {responsible.student.cedula}</p>
                              <p className="text-sm text-green-800">Email: {responsible.student.email}</p>
                              {responsible.student.section && (
                                <p className="text-sm text-green-800">Sección: {responsible.student.section}</p>
                              )}
                              <p className="text-xs text-green-600 mt-1">
                                Asignado: {new Date(responsible.assignedAt).toLocaleDateString('es-ES')}
                              </p>
                              <p className="text-xs text-green-600">
                                Por: {responsible.assignedBy}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeResponsible(responsible._id)}
                              className="text-red-600 hover:text-red-800"
                              disabled={loading}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                          <p className="font-medium">Permisos:</p>
                          <p>• Puede crear proyectos en nombre de su grupo</p>
                          <p>• Puede editar proyectos de su grupo</p>
                          <p>• Puede enviar proyectos para evaluación</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {responsibles.length === 0 && !loading && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <p className="text-blue-800">
                  No hay responsables asignados. Usa el formulario superior para agregar estudiantes que podrán enviar proyectos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-slate-600">Cargando responsables...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
