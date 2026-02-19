import React, { useState } from 'react';
import { GraduationCap, User, Users, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authAPI } from '../services/api';

type Role = 'student' | 'teacher' | 'coordinator';

interface LoginPageProps {
  onLogin: (role: Role) => void;
  onViewLibrary: () => void;
}

export function LoginPageWithAPI({ onLogin, onViewLibrary }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roles = [
    {
      id: 'student' as Role,
      label: 'Estudiante',
      icon: <GraduationCap className="w-12 h-12" />,
      description: 'Accede para subir y revisar tus proyectos',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      exampleEmail: 'maria.rodriguez@unexca.edu.ve'
    },
    {
      id: 'teacher' as Role,
      label: 'Docente',
      icon: <User className="w-12 h-12" />,
      description: 'Evalúa y da feedback a los proyectos',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      exampleEmail: 'martinez@unexca.edu.ve'
    },
    {
      id: 'coordinator' as Role,
      label: 'Coordinador',
      icon: <Users className="w-12 h-12" />,
      description: 'Gestiona docentes y supervisa proyectos',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      exampleEmail: 'coordinador@unexca.edu.ve'
    }
  ];

  const handleLogin = async () => {
    if (!email) {
      setError('Por favor ingresa tu email');
      return;
    }

    if (!selectedRole) {
      setError('Por favor selecciona un rol');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.login(email, selectedRole);
      
      if (response.success) {
        setSuccess('¡Login exitoso! Redirigiendo...');
        
        // Guardar usuario en localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Redirigir después de un breve delay
        setTimeout(() => {
          onLogin(response.user.role);
        }, 1000);
      }
    } catch (err: any) {
      if (err.message.includes('404')) {
        setError('Usuario no encontrado. Verifica tu email.');
      } else if (err.message.includes('403')) {
        setError('Este usuario no tiene el rol seleccionado o está inactivo.');
      } else {
        setError('Error al iniciar sesión. Intenta nuevamente.');
      }
      console.error('Error en login:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setError('');
    setSuccess('');
    
    // Auto-llenar email de ejemplo
    const roleData = roles.find(r => r.id === role);
    if (roleData) {
      setEmail(roleData.exampleEmail);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email && selectedRole && !loading) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GraduationCap className="w-16 h-16 text-white" />
            <h1 className="text-5xl font-bold text-white">UNEXCA</h1>
          </div>
          <p className="text-xl text-slate-200">
            Sistema de Gestión de Proyectos Académicos
          </p>
        </div>

        {/* Login Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
          <div className="p-8 md:p-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center">
              Iniciar Sesión
            </h2>
            <p className="text-slate-600 mb-8 text-center">
              Selecciona tu rol e ingresa tu email institucional
            </p>

            {/* Role Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  disabled={loading}
                  className={`
                    relative p-6 rounded-xl border-2 transition-all duration-300
                    ${selectedRole === role.id
                      ? 'border-primary bg-primary/5 shadow-lg scale-105'
                      : 'border-slate-200 hover:border-primary/50 hover:shadow-md'
                    }
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className={`
                    ${role.color} ${selectedRole === role.id ? '' : 'bg-slate-100'}
                    w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4
                    transition-colors duration-300
                  `}>
                    <div className={selectedRole === role.id ? 'text-white' : 'text-slate-600'}>
                      {role.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {role.label}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {role.description}
                  </p>
                  {selectedRole === role.id && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Email Input */}
            {selectedRole && (
              <div className="animate-slide-in mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Institucional
                </label>
                <Input
                  type="email"
                  placeholder="tu.email@unexca.edu.ve"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Email de ejemplo: {roles.find(r => r.id === selectedRole)?.exampleEmail}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-slide-in">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 animate-slide-in">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              disabled={!email || !selectedRole || loading}
              className="w-full mb-4"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Validando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>

            {/* Library Link */}
            <button
              onClick={onViewLibrary}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-primary hover:text-primary-dark transition-colors disabled:opacity-50"
            >
              <BookOpen className="w-5 h-5" />
              <span>Explorar Biblioteca Pública</span>
            </button>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-8 py-6 border-t border-slate-200">
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-3">
                <strong>Usuarios de prueba disponibles:</strong>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {roles.map((role) => (
                  <div key={role.id} className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-900 mb-1">{role.label}</p>
                    <p className="text-slate-600">{role.exampleEmail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="text-center mt-8 text-slate-200 text-sm">
          <p>© 2025 UNEXCA - Universidad Experimental de Caracas</p>
        </div>
      </div>
    </div>
  );
}
