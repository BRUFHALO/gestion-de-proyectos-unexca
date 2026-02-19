import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { SimpleTeacherCoordinatorChat } from '../components/chat/SimpleTeacherCoordinatorChat';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { MessageSquare, Users } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

interface SimpleCoordinatorChatProps {
  user: any;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
  role: string;
  pendingEvaluations?: number;
  lastActive?: string;
}

export function SimpleCoordinatorChat({
  user,
  onLogout,
  onNavigate
}: SimpleCoordinatorChatProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar lista de profesores
  const loadTeachers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/users?role=teacher&is_active=true`);
      
      if (response.ok) {
        const data = await response.json();
        setTeachers(data || []);
        
        // Seleccionar el primer profesor por defecto
        if (data && data.length > 0) {
          setSelectedTeacher(data[0]);
        }
      }
    } catch (error) {
      console.error('Error cargando profesores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  return (
    <MainLayout
      role="coordinator"
      currentPage="simple-coordinator-chat"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={user}
      title="Chat con Profesores">

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
        {/* Panel de Profesores */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Profesores
            </h2>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-slate-500">Cargando...</p>
              </div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-4">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No hay profesores disponibles</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teachers.map((teacher) => (
                  <button
                    key={teacher._id}
                    onClick={() => setSelectedTeacher(teacher)}
                    className={`w-full p-3 rounded-lg border transition-colors text-left ${
                      selectedTeacher?._id === teacher._id
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar 
                        fallback={teacher.name} 
                        size="sm"
                        className={selectedTeacher?._id === teacher._id ? 'bg-white text-primary' : ''}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${
                          selectedTeacher?._id === teacher._id ? 'text-white' : 'text-slate-900'
                        }`}>
                          {teacher.name}
                        </p>
                        <p className={`text-xs truncate ${
                          selectedTeacher?._id === teacher._id ? 'text-primary-light' : 'text-slate-500'
                        }`}>
                          {teacher.email}
                        </p>
                        {teacher.pendingEvaluations !== undefined && (
                          <p className={`text-xs mt-1 ${
                            selectedTeacher?._id === teacher._id ? 'text-primary-light' : 'text-slate-400'
                          }`}>
                            {teacher.pendingEvaluations} evaluaciones pendientes
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel de Chat */}
        <div className="lg:col-span-3">
          {selectedTeacher ? (
            <SimpleTeacherCoordinatorChat
              currentUser={{
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email
              }}
              otherUser={{
                id: selectedTeacher._id,
                name: selectedTeacher.name,
                role: 'teacher',
                email: selectedTeacher.email
              }}
              height="h-full"
              showHeader={true}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Selecciona un profesor
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Elige un profesor de la lista para comenzar a chatear
                </p>
                {teachers.length === 0 && !loading && (
                  <Button variant="outline" onClick={loadTeachers}>
                    Recargar
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
