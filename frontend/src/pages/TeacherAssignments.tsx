import { useState, useEffect } from 'react';
import { Search, Users, UserCheck, UserX, BookOpen, Calendar } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';

const API_BASE_URL = 'http://localhost:8000';

interface Student {
  _id: string;
  name: string;
  email: string;
  cedula: string;
  university_data?: {
    career_name?: string;
    career?: string;
  };
  assigned_teacher?: {
    teacher_id: string;
    teacher_name: string;
    assigned_at: string;
  };
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
  university_data?: {
    department?: string;
    career?: string;
  };
}

interface TeacherAssignmentsProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onLogout?: () => void;
  onNavigate?: (page: string) => void;
}

export function TeacherAssignments({ user, onLogout, onNavigate }: TeacherAssignmentsProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Cargar estudiantes y profesores
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar estudiantes con asignaciones
      const studentsResponse = await fetch(`${API_BASE_URL}/api/v1/users/students-with-assignments`);
      const studentsData = await studentsResponse.json();
      setStudents(studentsData);

      // Cargar profesores disponibles
      const teachersResponse = await fetch(`${API_BASE_URL}/api/v1/users/teachers-available`);
      const teachersData = await teachersResponse.json();
      setTeachers(teachersData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('error', 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAssignTeacher = async () => {
    if (!selectedStudent || !selectedTeacher) {
      showNotification('error', 'Seleccione un estudiante y un profesor');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/assign-teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: selectedStudent._id,
          teacher_id: selectedTeacher._id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        showNotification('success', result.message);
        setIsAssignModalOpen(false);
        setSelectedStudent(null);
        setSelectedTeacher(null);
        loadData(); // Recargar datos
      } else {
        const error = await response.json();
        showNotification('error', error.detail || 'Error al asignar profesor');
      }
    } catch (error) {
      console.error('Error assigning teacher:', error);
      showNotification('error', 'Error al asignar profesor');
    }
  };

  const handleUnassignTeacher = async (student: Student) => {
    if (!student.assigned_teacher) {
      showNotification('error', 'El estudiante no tiene profesor asignado');
      return;
    }

    if (!confirm(`¿Desasignar a ${student.name} del profesor ${student.assigned_teacher.teacher_name}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/unassign-teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: student._id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        showNotification('success', result.message);
        loadData(); // Recargar datos
      } else {
        const error = await response.json();
        showNotification('error', error.detail || 'Error al desasignar profesor');
      }
    } catch (error) {
      console.error('Error unassigning teacher:', error);
      showNotification('error', 'Error al desasignar profesor');
    }
  };

  // Filtrar estudiantes
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.cedula.includes(searchTerm)
  );

  // Estadísticas
  const totalStudents = students.length;
  const assignedStudents = students.filter(s => s.assigned_teacher).length;
  const unassignedStudents = totalStudents - assignedStudents;

  if (loading) {
    return (
      <MainLayout
        user={user || { id: '', name: '', email: '', role: 'coordinator' }}
        onLogout={onLogout || (() => {})}
        onNavigate={onNavigate || (() => {})}
        currentPage="teacher-assignments"
        role="coordinator"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando asignaciones...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      user={user || { id: '', name: '', email: '', role: 'coordinator' }}
      onLogout={onLogout || (() => {})}
      onNavigate={onNavigate || (() => {})}
      currentPage="teacher-assignments"
      role="coordinator"
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asignación de Profesores</h1>
          <p className="text-gray-600 mt-2">Gestiona las asignaciones de estudiantes a profesores</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Estudiantes</p>
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Asignados</p>
                <p className="text-2xl font-bold text-gray-900">{assignedStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <UserX className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sin Asignar</p>
                <p className="text-2xl font-bold text-gray-900">{unassignedStudents}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notificación */}
        {notification && (
          <div className={`p-4 rounded-lg ${
            notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Buscador y acciones */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar estudiantes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <UserCheck className="h-5 w-5" />
              Nueva Asignación
            </button>
          </div>
        </div>

        {/* Lista de Estudiantes */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carrera
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profesor Asignado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Asignación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                        <div className="text-xs text-gray-400">Cédula: {student.cedula}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {student.university_data?.career_name || student.university_data?.career || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.assigned_teacher ? (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                          <span className="text-sm text-gray-900">{student.assigned_teacher.teacher_name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                          <span className="text-sm text-gray-500">Sin asignar</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.assigned_teacher?.assigned_at ? (
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(student.assigned_teacher.assigned_at).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsAssignModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {student.assigned_teacher ? 'Reasignar' : 'Asignar'}
                        </button>
                        {student.assigned_teacher && (
                          <button
                            onClick={() => handleUnassignTeacher(student)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Desasignar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Asignación */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {selectedStudent?.assigned_teacher ? 'Reasignar Profesor' : 'Asignar Profesor'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estudiante
                  </label>
                  <select
                    value={selectedStudent?._id || ''}
                    onChange={(e) => {
                      const student = students.find(s => s._id === e.target.value);
                      setSelectedStudent(student || null);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar estudiante...</option>
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.name} ({student.cedula})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profesor
                  </label>
                  <select
                    value={selectedTeacher?._id || ''}
                    onChange={(e) => {
                      const teacher = teachers.find(t => t._id === e.target.value);
                      setSelectedTeacher(teacher || null);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar profesor...</option>
                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsAssignModalOpen(false);
                    setSelectedStudent(null);
                    setSelectedTeacher(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAssignTeacher}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedStudent?.assigned_teacher ? 'Reasignar' : 'Asignar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
