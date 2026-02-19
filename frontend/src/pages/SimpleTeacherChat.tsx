import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { SimpleTeacherCoordinatorChat } from '../components/chat/SimpleTeacherCoordinatorChat';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { MessageSquare, Users } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

interface SimpleTeacherChatProps {
  user: any;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

interface Coordinator {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export function SimpleTeacherChat({
  user,
  onLogout,
  onNavigate
}: SimpleTeacherChatProps) {
  const [selectedCoordinator, setSelectedCoordinator] = useState<Coordinator | null>(null);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar lista de coordinadores
  const loadCoordinators = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/users?role=coordinator&is_active=true`);
      
      if (response.ok) {
        const data = await response.json();
        setCoordinators(data || []);
        
        // Seleccionar el primer coordinador por defecto
        if (data && data.length > 0) {
          setSelectedCoordinator(data[0]);
        }
      }
    } catch (error) {
      console.error('Error cargando coordinadores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoordinators();
  }, []);

  return (
    <MainLayout
      role="teacher"
      currentPage="simple-teacher-chat"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={user}
      title="Chat con Coordinadores">

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
        {/* Panel de Coordinadores */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Coordinadores
            </h2>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-slate-500">Cargando...</p>
              </div>
            ) : coordinators.length === 0 ? (
              <div className="text-center py-4">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No hay coordinadores disponibles</p>
              </div>
            ) : (
              <div className="space-y-2">
                {coordinators.map((coordinator) => (
                  <button
                    key={coordinator._id}
                    onClick={() => setSelectedCoordinator(coordinator)}
                    className={`w-full p-3 rounded-lg border transition-colors text-left ${
                      selectedCoordinator?._id === coordinator._id
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar 
                        fallback={coordinator.name} 
                        size="sm"
                        className={selectedCoordinator?._id === coordinator._id ? 'bg-white text-primary' : ''}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${
                          selectedCoordinator?._id === coordinator._id ? 'text-white' : 'text-slate-900'
                        }`}>
                          {coordinator.name}
                        </p>
                        <p className={`text-xs truncate ${
                          selectedCoordinator?._id === coordinator._id ? 'text-primary-light' : 'text-slate-500'
                        }`}>
                          {coordinator.email}
                        </p>
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
          {selectedCoordinator ? (
            <SimpleTeacherCoordinatorChat
              currentUser={{
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email
              }}
              otherUser={{
                id: selectedCoordinator._id,
                name: selectedCoordinator.name,
                role: 'coordinator',
                email: selectedCoordinator.email
              }}
              height="h-full"
              showHeader={true}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Selecciona un coordinador
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Elige un coordinador de la lista para comenzar a chatear
                </p>
                {coordinators.length === 0 && !loading && (
                  <Button variant="outline" onClick={loadCoordinators}>
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
