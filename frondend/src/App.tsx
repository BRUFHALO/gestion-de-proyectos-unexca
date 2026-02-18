import React, { useState, useEffect } from 'react';
import { LoginPageCedula } from './pages/LoginPageCedula';
import { PublicLibrary } from './pages/PublicLibrary';
import { ApprovedProjects } from './pages/ApprovedProjects';
import { StudentDashboard } from './pages/StudentDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherCoordinatorChat } from './pages/TeacherCoordinatorChat';
import { CoordinatorDashboard } from './pages/CoordinatorDashboard';
import { CoordinatorReports } from './pages/CoordinatorReports';
import { UserManagement } from './pages/UserManagement';
import { TeacherAssignments } from './pages/TeacherAssignments';
import { EvaluationCanvas } from './pages/EvaluationCanvas';
import { StudentFeedbackView } from './pages/StudentFeedbackView';
import { ProjectDetailView } from './pages/ProjectDetailView';
import { TeacherFeedbackPanel } from './pages/TeacherFeedbackPanel';
import { StudentPDFViewer } from './components/StudentPDFViewer';
type Role = 'student' | 'teacher' | 'coordinator';
export function App() {
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null>(null);
  // La biblioteca es la página inicial por defecto (acceso público)
  const [currentPage, setCurrentPage] = useState<string>('library');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  // Restaurar sesión desde localStorage al montar el componente
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('userRole');
    
    if (storedUser && storedRole) {
      try {
        const userData = JSON.parse(storedUser);
        setUser({
          id: userData.id || userData._id || 'user-' + Date.now(),
          name: userData.name,
          email: userData.email,
          role: userData.role
        });
        
        // Redirigir al dashboard correspondiente
        if (userData.role === 'student') {
          setCurrentPage('student-dashboard');
        } else if (userData.role === 'teacher') {
          setCurrentPage('teacher-dashboard');
        } else if (userData.role === 'coordinator') {
          setCurrentPage('coordinator-dashboard');
        }
      } catch (error) {
        console.error('Error al restaurar sesión:', error);
        localStorage.clear();
      }
    }
  }, []);
  const handleLogin = (role: Role, userData: any) => {
    // Usar datos reales del usuario autenticado desde la API
    setUser({
      id: userData.id || userData._id || 'user-' + Date.now(),
      name: userData.name,
      email: userData.email,
      role: userData.role
    });
    // Redirigir al dashboard correspondiente
    if (role === 'student') setCurrentPage('student-dashboard');
    else if (role === 'teacher') setCurrentPage('teacher-dashboard');
    else if (role === 'coordinator') setCurrentPage('coordinator-dashboard');
  };
  const handleLogout = () => {
    // Limpiar localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    
    setUser(null);
    setCurrentPage('library'); // Volver a la biblioteca pública
    setSelectedProjectId(null);
  };
  const handleNavigate = (page: string, data?: any) => {
    // Si intenta acceder a un dashboard sin estar autenticado, ir al login
    if (!user && page !== 'library' && page !== 'login') {
      setCurrentPage('login');
      return;
    }
    // Manejar navegación con datos adicionales
    if ((page === 'student-feedback' || page === 'project-detail' || page === 'teacher-feedback' || page === 'student-pdf-viewer') && data?.projectId) {
      console.log('Navegando a', page, 'con projectId:', data.projectId);
      setSelectedProjectId(data.projectId);
    }
    setCurrentPage(page);
  };
  const renderPage = () => {
    // La biblioteca siempre es accesible (con o sin usuario)
    if (currentPage === 'library') {
      return (
        <PublicLibrary
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          onLogin={() => setCurrentPage('login')} />);


    }
    // Página de login
    if (currentPage === 'login' || !user && currentPage !== 'library') {
      return (
        <LoginPageCedula
          onLogin={handleLogin}
          onViewLibrary={() => setCurrentPage('library')} />);


    }
    // Páginas que requieren autenticación
    if (!user) {
      return (
        <LoginPageCedula
          onLogin={handleLogin}
          onViewLibrary={() => setCurrentPage('library')} />);


    }
    switch (currentPage) {
      case 'student-dashboard':
        return (
          <StudentDashboard
            user={user}
            onLogout={handleLogout}
            onNavigate={handleNavigate} />);


      case 'student-feedback':
        return (
          <StudentFeedbackView
            projectId={selectedProjectId || '1'}
            onBack={() => setCurrentPage('student-dashboard')} />);

      
      case 'project-detail':
        return (
          <ProjectDetailView
            projectId={selectedProjectId?.toString() || ''}
            onBack={() => setCurrentPage('student-dashboard')} />);

      
      case 'student-pdf-viewer':
        return (
          <StudentPDFViewer
            projectId={selectedProjectId?.toString() || ''}
            onBack={() => setCurrentPage('student-dashboard')} />);


      case 'teacher-dashboard':
        return (
          <TeacherDashboard
            user={user}
            onLogout={handleLogout}
            onNavigate={handleNavigate} />);

      
      case 'teacher-feedback':
        return (
          <TeacherFeedbackPanel
            projectId={selectedProjectId?.toString() || ''}
            onBack={() => setCurrentPage('teacher-dashboard')} />);


      case 'teacher-coordinator-chat':
        return (
          <TeacherCoordinatorChat
            user={user}
            onLogout={handleLogout}
            onNavigate={handleNavigate} />);


      case 'coordinator-dashboard':
        return (
          <CoordinatorDashboard
            user={user}
            onLogout={handleLogout}
            onNavigate={handleNavigate} />);

      
      case 'approved-projects':
        return (
          <ApprovedProjects
            user={user}
            onLogout={handleLogout}
            onNavigate={handleNavigate} />);


      case 'coordinator-reports':
        return (
          <CoordinatorReports
            user={user}
            onLogout={handleLogout}
            onNavigate={handleNavigate} />);

      
      case 'user-management':
        return <UserManagement user={user} onLogout={handleLogout} onNavigate={handleNavigate} />;
      case 'teacher-assignments':
          return <TeacherAssignments user={user} onLogout={handleLogout} onNavigate={handleNavigate} />;

      
      case 'evaluation-canvas':
        return (
          <EvaluationCanvas
            onBack={() => setCurrentPage('teacher-dashboard')} />);


      default:
        return (
          <PublicLibrary
            user={user}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onLogin={() => setCurrentPage('login')} />);


    }
  };
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {renderPage()}
    </div>);

}