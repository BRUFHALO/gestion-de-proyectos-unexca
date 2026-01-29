import React, { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { PublicLibrary } from './pages/PublicLibrary';
import { StudentDashboard } from './pages/StudentDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherCoordinatorChat } from './pages/TeacherCoordinatorChat';
import { CoordinatorDashboard } from './pages/CoordinatorDashboard';
import { EvaluationCanvas } from './pages/EvaluationCanvas';
import { StudentFeedbackView } from './pages/StudentFeedbackView';
type Role = 'student' | 'teacher' | 'coordinator';
export function App() {
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: Role;
  } | null>(null);
  // La biblioteca es la página inicial por defecto (acceso público)
  const [currentPage, setCurrentPage] = useState<string>('library');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );
  const handleLogin = (role: Role) => {
    const mockUsers = {
      student: {
        name: 'Alejandro Ruiz',
        email: 'alex@unexca.edu.ve',
        role: 'student' as Role
      },
      teacher: {
        name: 'Prof. Martínez',
        email: 'martinez@unexca.edu.ve',
        role: 'teacher' as Role
      },
      coordinator: {
        name: 'Dra. Carmen López',
        email: 'carmen@unexca.edu.ve',
        role: 'coordinator' as Role
      }
    };
    setUser(mockUsers[role]);
    // Redirigir al dashboard correspondiente
    if (role === 'student') setCurrentPage('student-dashboard');else
    if (role === 'teacher') setCurrentPage('teacher-dashboard');else
    if (role === 'coordinator') setCurrentPage('coordinator-dashboard');
  };
  const handleLogout = () => {
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
    if (page === 'student-feedback' && data?.projectId) {
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
        <LoginPage
          onLogin={handleLogin}
          onViewLibrary={() => setCurrentPage('library')} />);


    }
    // Páginas que requieren autenticación
    if (!user) {
      return (
        <LoginPage
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
            projectId={selectedProjectId || 1}
            onBack={() => setCurrentPage('student-dashboard')} />);


      case 'teacher-dashboard':
        return (
          <TeacherDashboard
            user={user}
            onLogout={handleLogout}
            onNavigate={handleNavigate} />);


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