import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Search,
  X,
  Save
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

const API_BASE_URL = 'http://localhost:8000';

interface User {
  id: string;
  name: string;
  email: string;
  cedula: string;
  role: 'student' | 'teacher' | 'coordinator';
  pnf: string;
  isActive: boolean;
  createdAt: string;
}

interface UserManagementProps {
  user: any;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

const PNF_OPTIONS = [
  { value: 'turismo', label: 'Turismo' },
  { value: 'ingenieria agroalimentaria', label: 'Ingeniería Agroalimentaria' },
  { value: 'administracion de empresas', label: 'Administración de Empresas' },
  { value: 'ingenieria informatica', label: 'Ingeniería Informática' },
  { value: 'distribucion logistica', label: 'Distribución Logística' }
];

const ROLE_OPTIONS = [
  { value: 'student', label: 'Estudiante' },
  { value: 'teacher', label: 'Docente' },
  { value: 'coordinator', label: 'Coordinador' }
];

export function UserManagement({ user, onLogout, onNavigate }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cedula: '',
    role: 'student' as 'student' | 'teacher' | 'coordinator',
    pnf: 'informatica'
  });

  // Cargar usuarios desde la API
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/users?limit=50`);
      
      if (response.ok) {
        const usersData = await response.json();
        const transformedUsers: User[] = usersData.map((user: any) => ({
          id: user._id || user.id,
          name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          email: user.email,
          cedula: user.cedula || user.username || '',
          role: user.role || 'student',
          pnf: user.university_data?.career_name || user.university_data?.career || user.pnf || 'informatica',
          isActive: user.is_active !== false,
          createdAt: user.created_at || new Date().toISOString()
        }));
        setUsers(transformedUsers);
      } else {
        const errorText = await response.text();
        console.error('Error loading users:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.cedula.includes(searchQuery) ||
      user.pnf.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Generar usuario y contraseña desde cédula
  const generateCredentials = (cedula: string) => {
    const username = cedula;
    const password = cedula;
    return { username, password };
  };

  // Crear usuario
  const handleCreateUser = async () => {
    try {
      const { username, password } = generateCredentials(formData.cedula);
      
      const userData = {
        first_name: formData.name.split(' ')[0],
        last_name: formData.name.split(' ').slice(1).join(' '),
        username: username,
        email: `${username}@unexca.edu.ve`,
        password: password,
        role: formData.role,
        cedula: formData.cedula,
        university_data: {
          career_name: formData.pnf
        }
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        await loadUsers();
        setIsCreateModalOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        console.error('Error creating user:', error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  // Actualizar usuario
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const userData = {
        first_name: formData.name.split(' ')[0],
        last_name: formData.name.split(' ').slice(1).join(' '),
        email: selectedUser.email,
        role: formData.role,
        university_data: {
          career_name: formData.pnf
        }
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        await loadUsers();
        setIsEditModalOpen(false);
        resetForm();
      } else {
        console.error('Error updating user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${selectedUser.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadUsers();
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
      } else {
        console.error('Error deleting user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: '',
      cedula: '',
      role: 'student',
      pnf: 'informatica'
    });
    setSelectedUser(null);
  };

  // Abrir modal de edición
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      cedula: user.cedula,
      role: user.role,
      pnf: user.pnf
    });
    setIsEditModalOpen(true);
  };

  // Obtener color del rol
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'coordinator': return 'bg-purple-100 text-purple-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener etiqueta del rol
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'coordinator': return 'Coordinador';
      case 'teacher': return 'Docente';
      case 'student': return 'Estudiante';
      default: return role;
    }
  };

  return (
    <MainLayout
      role="coordinator"
      currentPage="user-management"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={user}
      title="Gestión de Usuarios">
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
            <p className="text-slate-600 mt-1">Administra estudiantes, docentes y coordinadores del sistema</p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="bg-primary hover:bg-primary-dark">
            Nuevo Usuario
          </Button>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, email, cédula o PNF..."
                icon={<Search className="w-5 h-5" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
                leftIcon={<X className="w-4 h-4" />}>
                Limpiar
              </Button>
            )}
          </div>
          
          {searchQuery && (
            <div className="mt-3">
              <p className="text-sm text-slate-600">
                Mostrando <span className="font-semibold">{filteredUsers.length}</span> de {users.length} usuarios
              </p>
            </div>
          )}
        </div>

        {/* Lista de Usuarios */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-slate-600 mt-2">Cargando usuarios...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Cédula
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      PNF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{user.name}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {user.cedula}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {PNF_OPTIONS.find(p => p.value === user.pnf)?.label || user.pnf}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={user.isActive ? 'success' : 'outline'}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(user)}
                            leftIcon={<Edit className="w-3 h-3" />}>
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            leftIcon={<Trash2 className="w-3 h-3" />}>
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="bg-slate-100 p-4 rounded-full inline-block mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
              </h3>
              <p className="text-slate-500 mb-4">
                {searchQuery 
                  ? 'No hay usuarios que coincidan con tu búsqueda.'
                  : 'Comienza agregando nuevos usuarios al sistema.'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  Agregar Primer Usuario
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Usuario */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Usuario"
        size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre Completo
            </label>
            <Input
              placeholder="Ej: Juan Pérez"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cédula
            </label>
            <Input
              placeholder="Ej: 12345678"
              value={formData.cedula}
              onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
            />
            {formData.cedula && (
              <p className="text-xs text-slate-500 mt-1">
                Usuario y contraseña: <span className="font-mono bg-slate-100 px-1 rounded">{formData.cedula}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Rol
            </label>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              options={ROLE_OPTIONS}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              PNF (Carrera)
            </label>
            <Select
              value={formData.pnf}
              onChange={(e) => setFormData({ ...formData, pnf: e.target.value })}
              options={PNF_OPTIONS}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={!formData.name || !formData.cedula}
              leftIcon={<Save className="w-4 h-4" />}>
              Crear Usuario
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Editar Usuario */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Usuario"
        size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre Completo
            </label>
            <Input
              placeholder="Ej: Juan Pérez"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cédula
            </label>
            <Input
              placeholder="Ej: 12345678"
              value={formData.cedula}
              disabled
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500 mt-1">
              La cédula no puede ser modificada
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Rol
            </label>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              options={ROLE_OPTIONS}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              PNF (Carrera)
            </label>
            <Select
              value={formData.pnf}
              onChange={(e) => setFormData({ ...formData, pnf: e.target.value })}
              options={PNF_OPTIONS}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={!formData.name}
              leftIcon={<Save className="w-4 h-4" />}>
              Actualizar Usuario
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar Usuario */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Eliminar Usuario"
        size="sm">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              ¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUser?.name}</strong>?
            </p>
            <p className="text-red-600 text-sm mt-1">
              Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
              leftIcon={<Trash2 className="w-4 h-4" />}>
              Eliminar Usuario
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
