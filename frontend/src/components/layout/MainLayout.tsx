import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
interface MainLayoutProps {
  children: React.ReactNode;
  role: 'student' | 'teacher' | 'coordinator';
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  user: {
    name: string;
    email: string;
  };
  title?: string;
  actions?: React.ReactNode;
}
export function MainLayout({
  children,
  role,
  currentPage,
  onNavigate,
  onLogout,
  user,
  title,
  actions
}: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        role={role}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNavigate={onNavigate}
        currentPage={currentPage}
        onLogout={onLogout}
        user={user} />


      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>

        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden">

              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-800 truncate">
              {title || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {actions}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
    </div>);

}