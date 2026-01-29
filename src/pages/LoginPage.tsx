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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Lado Izquierdo - Marca */}
      <div className="lg:w-1/2 bg-primary relative overflow-hidden flex flex-col justify-center items-center p-12 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary-dark/90"></div>

        <div className="relative z-10 max-w-lg text-center lg:text-left">
          <div className="inline-flex items-center justify-center p-3 bg-accent rounded-xl mb-8 shadow-lg">
            <GraduationCap className="w-10 h-10 text-primary-dark" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Biblioteca Digital UNEXCA
          </h1>
          <p className="text-lg text-slate-200 mb-8 leading-relaxed">
            Plataforma integral para la gestión de proyectos académicos,
            evaluación y difusión del conocimiento.
          </p>
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm font-medium text-accent">
            <span className="px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/10">
              Repositorio Académico
            </span>
            <span className="px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/10">
              Evaluación de Proyectos
            </span>
            <span className="px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/10">
              Retroalimentación en Tiempo Real
            </span>
          </div>
        </div>
      </div>

      {/* Lado Derecho - Formulario de Login */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-900">Bienvenido</h2>
            <p className="text-slate-500 mt-2">
              Inicia sesión para acceder a tu panel de control.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Selector de Rol (Función Demo) */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">
                Selecciona tu Rol (Demo)
              </label>
              <div className="grid grid-cols-1 gap-3">
                {roles.map((role) =>
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`
                      relative flex items-center p-4 cursor-pointer rounded-xl border-2 transition-all
                      ${selectedRole === role.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                    `}>

                    <div
                    className={`
                      p-2 rounded-lg mr-4 transition-colors
                      ${selectedRole === role.id ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}
                    `}>

                      {role.icon}
                    </div>
                    <div className="flex-1">
                      <p
                      className={`font-semibold ${selectedRole === role.id ? 'text-primary' : 'text-slate-900'}`}>

                        {role.label}
                      </p>
                      <p className="text-xs text-slate-500">{role.desc}</p>
                    </div>
                    {selectedRole === role.id &&
                  <div className="absolute right-4 w-3 h-3 bg-primary rounded-full ring-4 ring-primary/20" />
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
              <label className="flex items-center text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary mr-2" />

                Recordarme
              </label>
              <a
                href="#"
                className="text-primary hover:text-primary-dark font-medium">

                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full"
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
              <span className="px-2 bg-slate-50 text-slate-500">o</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={onViewLibrary}
            leftIcon={<Library className="w-5 h-5" />}>

            Explorar Biblioteca Pública
          </Button>

          <p className="text-center text-sm text-slate-500">
            ¿No tienes cuenta?{' '}
            <a href="#" className="text-primary font-medium hover:underline">
              Contacta a Administración
            </a>
          </p>
        </div>
      </div>
    </div>);

}