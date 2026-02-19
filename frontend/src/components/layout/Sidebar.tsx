import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileCheck,
  FileText,
  MessageSquare,
  UserCog,
  UserCheck,
  GraduationCap,
  Menu,
  LogOut
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
interface SidebarProps {
  role: 'student' | 'teacher' | 'coordinator';
  isOpen: boolean;
  toggleSidebar: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  onLogout: () => void;
  user: {
    name: string;
    email: string;
  };
}
export function Sidebar({
  role,
  isOpen,
  toggleSidebar,
  onNavigate,
  currentPage,
  onLogout,
  user
}: SidebarProps) {
  const getMenuItems = () => {
    const common = [
    {
      id: 'library',
      label: 'Biblioteca Pública',
      icon: <BookOpen className="w-5 h-5" />
    }];

    const roleSpecific = {
      student: [
      {
        id: 'student-dashboard',
        label: 'Mi Panel',
        icon: <LayoutDashboard className="w-5 h-5" />
      }],

      teacher: [
      {
        id: 'teacher-dashboard',
        label: 'Panel de Evaluación',
        icon: <FileCheck className="w-5 h-5" />
      },
      {
        id: 'teacher-coordinator-chat',
        label: 'Chat con Coordinador',
        icon: <MessageSquare className="w-5 h-5" />,
        badge: 2 // Mensajes no leídos
      }],

      coordinator: [
      {
        id: 'coordinator-dashboard',
        label: 'Gestión',
        icon: <Users className="w-5 h-5" />
      },
      {
        id: 'teacher-assignments',
        label: 'Asignación de Profesores',
        icon: <UserCheck className="w-5 h-5" />
      },
      {
        id: 'user-management',
        label: 'Gestión de Usuarios',
        icon: <UserCog className="w-5 h-5" />
      },
      {
        id: 'approved-projects',
        label: 'Proyectos Publicados',
        icon: <FileCheck className="w-5 h-5" />
      },
      {
        id: 'coordinator-reports',
        label: 'Reportes',
        icon: <FileText className="w-5 h-5" />
      }]

    };
    return [...roleSpecific[role], ...common];
  };
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      student: 'Estudiante',
      teacher: 'Docente',
      coordinator: 'Coordinador'
    };
    return labels[role] || role;
  };
  const menuItems = getMenuItems();
  return (
    <>
      {/* Overlay Móvil */}
      <div
        className={`fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar} />


      {/* Contenedor del Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-primary text-white transition-all duration-300 ease-in-out flex flex-col shadow-2xl
          ${isOpen ? 'w-64' : 'w-20'}
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>

        {/* Encabezado */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-primary-light/30">
          <div
            className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${!isOpen && 'lg:justify-center w-full'}`}>

            <div className="bg-accent rounded-lg p-1.5 flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-primary-dark" />
            </div>
            <span
              className={`font-bold text-lg tracking-wide whitespace-nowrap ${!isOpen && 'lg:hidden'}`}>

              UNEXCA
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-white/80 hover:text-white">

            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item: any) =>
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative
                ${currentPage === item.id ? 'bg-accent text-primary-dark font-semibold shadow-md' : 'text-slate-300 hover:bg-primary-light/50 hover:text-white'}
                ${!isOpen && 'lg:justify-center'}
              `}
            title={!isOpen ? item.label : undefined}>

              <span className="flex-shrink-0 relative">
                {item.icon}
                {/* Badge de notificación para sidebar colapsado */}
                {item.badge && !isOpen &&
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
              }
              </span>
              <span
              className={`whitespace-nowrap transition-all duration-300 flex-1 ${!isOpen && 'lg:hidden'}`}>

                {item.label}
              </span>

              {/* Badge de notificación para sidebar expandido */}
              {item.badge && isOpen &&
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
            }

              {/* Tooltip para estado colapsado */}
              {!isOpen &&
            <div className="hidden lg:group-hover:block absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
                  {item.label}
                  {item.badge &&
              <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
              }
                </div>
            }
            </button>
          )}
        </nav>

        {/* Pie de Perfil de Usuario */}
        <div className="p-4 border-t border-primary-light/30 bg-primary-dark/20">
          <div
            className={`flex items-center gap-3 ${!isOpen && 'lg:justify-center'}`}>

            <Avatar
              fallback={user.name}
              size="sm"
              className="ring-2 ring-accent/50" />

            <div
              className={`flex-1 overflow-hidden transition-all duration-300 ${!isOpen && 'lg:hidden'}`}>

              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-slate-400">{getRoleLabel(role)}</p>
            </div>
            <button
              onClick={onLogout}
              className={`text-slate-400 hover:text-white transition-colors ${!isOpen && 'lg:hidden'}`}
              title="Cerrar Sesión">

              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
    </>);

}