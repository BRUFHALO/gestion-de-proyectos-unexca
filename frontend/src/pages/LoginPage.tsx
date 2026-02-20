import React, { useState } from 'react';
import {
  GraduationCap,
  ArrowRight,
  User,
  BookOpen,
  Shield,
  Library } from
'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
interface LoginPageProps {
  onLogin: (role: 'student' | 'teacher' | 'coordinator') => void;
  onViewLibrary: () => void;
}
export function LoginPage({ onLogin, onViewLibrary }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    'student' | 'teacher' | 'coordinator'>(
    'student');
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simular llamada API
    setTimeout(() => {
      setIsLoading(false);
      onLogin(selectedRole);
    }, 1000);
  };
  const roles = [
  {
    id: 'student',
    label: 'Estudiante',
    icon: <User className="w-5 h-5" />,
    desc: 'Accede a la biblioteca y envía proyectos'
  },
  {
    id: 'teacher',
    label: 'Docente',
    icon: <BookOpen className="w-5 h-5" />,
    desc: 'Evalúa y califica entregas'
  },
  {
    id: 'coordinator',
    label: 'Coordinador',
    icon: <Shield className="w-5 h-5" />,
    desc: 'Gestiona el sistema y aprobaciones'
  }] as
  const;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col lg:flex-row">
      {/* Lado Izquierdo - Marca */}
      <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden flex flex-col justify-center items-center p-12 text-white">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full transform translate-x-48 -translate-y-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/3 rounded-full transform -translate-x-32 translate-y-32" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-5 mix-blend-overlay"></div>

        <div className="relative z-10 max-w-lg text-center lg:text-left">
          <div className="inline-flex items-center justify-center p-4 bg-white/20 backdrop-blur-md rounded-2xl mb-8 shadow-2xl border border-white/10">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            Biblioteca Digital UNEXCA
          </h1>
          <p className="text-lg text-blue-100 mb-8 leading-relaxed">
            Plataforma integral para la gestión de proyectos académicos,
            evaluación y difusión del conocimiento.
          </p>
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm font-medium">
            <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              📚 Repositorio Académico
            </span>
            <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              🔬 Evaluación de Proyectos
            </span>
            <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              ⚡ Retroalimentación en Tiempo Real
            </span>
          </div>
        </div>
      </div>

      {/* Lado Derecho - Formulario de Login */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-white to-slate-50/80">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-800 bg-clip-text text-transparent">Bienvenido</h2>
            <p className="text-slate-600 mt-2 leading-relaxed">
              Inicia sesión para acceder a tu panel de control.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Selector de Rol (Función Demo) */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">
                Selecciona tu Rol (Demo)
              </label>
              <div className="grid grid-cols-1 gap-3">
                {roles.map((role) =>
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`
                      relative flex items-center p-4 cursor-pointer rounded-2xl border-2 transition-all duration-300 shadow-sm hover:shadow-md
                      ${selectedRole === role.id 
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg' 
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}
                    `}>
                    <div
                    className={`
                      p-3 rounded-xl mr-4 transition-all duration-300 shadow-sm
                      ${selectedRole === role.id 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg' 
                        : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600'}
                    `}>
                      {role.icon}
                    </div>
                    <div className="flex-1">
                      <p
                      className={`font-semibold transition-colors duration-300 ${
                        selectedRole === role.id ? 'text-blue-700' : 'text-slate-900'
                      }`}>
                        {role.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{role.desc}</p>
                    </div>
                    {selectedRole === role.id &&
                  <div className="absolute right-4 w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg ring-4 ring-blue-100 animate-pulse" />
                  }
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="nombre@unexca.edu.ve"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required />

              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required />

            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-slate-600 cursor-pointer hover:text-slate-700 transition-colors duration-200">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2 mr-2" />
                Recordarme
              </label>
              <a
                href="#"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-5 h-5" />}>
              Iniciar Sesión
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-white to-slate-50/80 text-slate-500 font-medium">o</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 shadow-sm hover:shadow-md transition-all duration-300"
            onClick={onViewLibrary}
            leftIcon={<Library className="w-5 h-5" />}>
            Explorar Biblioteca Pública
          </Button>

          <p className="text-center text-sm text-slate-600">
            ¿No tienes cuenta?{' '}
            <a href="#" className="text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200">
              Contacta a Administración
            </a>
          </p>
        </div>
      </div>
    </div>);

}