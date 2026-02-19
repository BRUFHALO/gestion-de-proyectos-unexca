import React, { useState } from 'react';
import { SimpleTeacherCoordinatorChat } from '../components/chat/SimpleTeacherCoordinatorChat';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface ChatTestPageProps {
  user: any;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export function ChatTestPage({
  user,
  onLogout,
  onNavigate
}: ChatTestPageProps) {
  const [currentUser, setCurrentUser] = useState({
    id: '697f0423ea766bc70c53a5d3', // ID de la coordinadora
    name: 'Dra. Carmen López',
    role: 'coordinator',
    email: 'carmen@unexca.edu.ve'
  });

  const [otherUser, setOtherUser] = useState({
    id: '697f0423ea766bc70c53a5d4', // ID del profesor Carlos
    name: 'Prof. Carlos Martínez',
    role: 'teacher',
    email: 'carlos@unexca.edu.ve'
  });

  const [isCoordinator, setIsCoordinator] = useState(true);

  const switchRole = () => {
    if (isCoordinator) {
      // Cambiar a profesor Carlos
      setCurrentUser({
        id: '697f0423ea766bc70c53a5d4',
        name: 'Prof. Carlos Martínez',
        role: 'teacher',
        email: 'carlos@unexca.edu.ve'
      });
      setOtherUser({
        id: '697f0423ea766bc70c53a5d3',
        name: 'Dra. Carmen López',
        role: 'coordinator',
        email: 'carmen@unexca.edu.ve'
      });
    } else {
      // Cambiar a coordinadora
      setCurrentUser({
        id: '697f0423ea766bc70c53a5d3',
        name: 'Dra. Carmen López',
        role: 'coordinator',
        email: 'carmen@unexca.edu.ve'
      });
      setOtherUser({
        id: '697f0423ea766bc70c53a5d4',
        name: 'Prof. Carlos Martínez',
        role: 'teacher',
        email: 'carlos@unexca.edu.ve'
      });
    }
    setIsCoordinator(!isCoordinator);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                🧪 Página de Prueba - Chat Simple
              </h1>
              <p className="text-slate-600">
                Esta es una página de prueba para el nuevo sistema de chat entre docentes y coordinadores
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={switchRole} variant="outline">
                Cambiar a {isCoordinator ? 'Profesor Carlos' : 'Coordinadora'}
              </Button>
              <Button onClick={() => onNavigate('coordinator-dashboard')}>
                Volver al Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">
              📱 Usuario Actual (Tú)
            </h3>
            <div className="space-y-2">
              <p><strong>ID:</strong> {currentUser.id}</p>
              <p><strong>Nombre:</strong> {currentUser.name}</p>
              <p><strong>Rol:</strong> {currentUser.role}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">
              👤 Usuario Receptor
            </h3>
            <div className="space-y-2">
              <p><strong>ID:</strong> {otherUser.id}</p>
              <p><strong>Nombre:</strong> {otherUser.name}</p>
              <p><strong>Rol:</strong> {otherUser.role}</p>
              <p><strong>Email:</strong> {otherUser.email}</p>
            </div>
          </Card>
        </div>

        {/* Chat */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            💬 Chat de Prueba
          </h3>
          <SimpleTeacherCoordinatorChat
            currentUser={currentUser}
            otherUser={otherUser}
            height="h-[600px]"
            showHeader={true}
            className="border border-slate-200"
          />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-xl p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            📋 Instrucciones de Prueba
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Abre esta página en dos ventanas del navegador</li>
            <li>En una ventana, mantén el rol actual (Coordinadora)</li>
            <li>En la otra ventana, haz clic en "Cambiar a Profesor Carlos"</li>
            <li>Envía mensajes desde una ventana y verifícalos en la otra</li>
            <li>Los mensajes deberían aparecer en tiempo real</li>
            <li>Verifica que el estado de conexión se muestre correctamente</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
