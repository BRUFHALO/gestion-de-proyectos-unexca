import React, { useState } from 'react';
import { GraduationCap, User, Users, BookOpen, AlertCircle, Loader2, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authAPI } from '../services/api';

type Role = 'student' | 'teacher' | 'coordinator';

interface LoginPageProps {
  onLogin: (role: Role, userData: any) => void;
  onViewLibrary: () => void;
}

export function LoginPageCedula({ onLogin, onViewLibrary }: LoginPageProps) {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async () => {
    if (!cedula) {
      setError('Por favor ingresa tu cédula');
      return;
    }

    if (!password) {
      setError('Por favor ingresa tu contraseña');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.loginWithCedula(cedula, password);
      
      if (response.success) {
        const user = response.user;
        setSuccess(`¡Bienvenido ${user.name}! Redirigiendo...`);
        
        // Guardar usuario en localStorage
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userId', user._id);
        localStorage.setItem('userRole', user.role);
        
        // Redirigir después de un breve delay
        setTimeout(() => {
          onLogin(user.role, user);
        }, 1000);
      }
    } catch (err: any) {
      if (err.message.includes('404')) {
        setError('Cédula no encontrada en el sistema.');
      } else if (err.message.includes('401')) {
        setError('Contraseña incorrecta.');
      } else if (err.message.includes('403')) {
        setError('Usuario inactivo. Contacta al administrador.');
      } else {
        setError('Error al iniciar sesión. Intenta nuevamente.');
      }
      console.error('Error en login:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && cedula && password && !loading) {
      handleLogin();
    }
  };

  const fillExample = (role: 'student' | 'teacher' | 'coordinator') => {
    const examples = {
      student: { cedula: '27123456', password: '27123456' },
      teacher: { cedula: '15234567', password: 'Prof2025' },
      coordinator: { cedula: '12345678', password: 'Coord2025!' }
    };
    
    setCedula(examples[role].cedula);
    setPassword(examples[role].password);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GraduationCap className="w-16 h-16 text-white" />
            <h1 className="text-5xl font-bold text-white">UNEXCA</h1>
          </div>
          <p className="text-xl text-slate-200">
            Sistema de Gestión de Proyectos
          </p>
        </div>

        {/* Login Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
          <div className="p-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center">
              Iniciar Sesión
            </h2>
            <p className="text-slate-600 mb-6 text-center">
              Ingresa con tu cédula y contraseña
            </p>

            {/* Cedula Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cédula de Identidad
              </label>
              <Input
                type="text"
                placeholder="12345678"
                value={cedula}
                onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="w-full"
                icon={<User className="w-5 h-5" />}
              />
            </div>

            {/* Password Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contraseña
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="w-full"
                icon={<Lock className="w-5 h-5" />}
              />
              <p className="text-xs text-slate-500 mt-2">
                Estudiantes: tu contraseña es tu cédula
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-slide-in">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 animate-slide-in">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              disabled={!cedula || !password || loading}
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

          {/* Quick Access */}
          <div className="bg-slate-50 px-8 py-6 border-t border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-3 text-center">
              Acceso rápido de prueba:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => fillExample('student')}
                disabled={loading}
                className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-xs font-medium text-blue-900 transition-colors disabled:opacity-50"
              >
                <GraduationCap className="w-4 h-4 mx-auto mb-1" />
                Estudiante
              </button>
              <button
                onClick={() => fillExample('teacher')}
                disabled={loading}
                className="p-2 bg-green-100 hover:bg-green-200 rounded-lg text-xs font-medium text-green-900 transition-colors disabled:opacity-50"
              >
                <User className="w-4 h-4 mx-auto mb-1" />
                Docente
              </button>
              <button
                onClick={() => fillExample('coordinator')}
                disabled={loading}
                className="p-2 bg-purple-100 hover:bg-purple-200 rounded-lg text-xs font-medium text-purple-900 transition-colors disabled:opacity-50"
              >
                <Users className="w-4 h-4 mx-auto mb-1" />
                Coordinador
              </button>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="text-center mt-6 text-slate-200 text-sm">
          <p>© 2025 UNEXCA - Universidad Experimental de Caracas</p>
        </div>
      </div>
    </div>
  );
}
