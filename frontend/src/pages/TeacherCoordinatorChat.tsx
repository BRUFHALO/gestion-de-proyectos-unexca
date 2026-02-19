import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  FileText,
  Upload,
  Clock,
  Check,
  CheckCheck,
  MessageSquare } from
'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { API_BASE_URL } from '../services/api';
interface TeacherCoordinatorChatProps {
  user: any;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

interface Message {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  receiver_id: string;
  receiver_name: string;
  message: string;
  timestamp: string;
  read: boolean;
  delivered?: boolean;
}

interface ReportStatus {
  id: number;
  name: string;
  date: string;
  status: 'enviado' | 'recibido' | 'revisado';
}

export function TeacherCoordinatorChat({
  user,
  onLogout,
  onNavigate
}: TeacherCoordinatorChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [coordinator, setCoordinator] = useState<{ id: string; name: string; email: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [loadingCoordinator, setLoadingCoordinator] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Mantener ref sincronizada con el estado para uso en callbacks
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Paso 1: Obtener el coordinador real desde la BD
  const loadCoordinator = async () => {
    try {
      setLoadingCoordinator(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/users?role=coordinator&is_active=true`);
      if (response.ok) {
        const coordinators = await response.json();
        if (coordinators && coordinators.length > 0) {
          const coord = coordinators[0];
          const coordId = coord._id || coord.id;
          const coordName = coord.name || `${coord.first_name || ''} ${coord.last_name || ''}`.trim();
          setCoordinator({ id: coordId, name: coordName, email: coord.email || '' });
          // Paso 2: Buscar conversación existente con ese coordinador
          await loadConversationForCoordinator(coordId);
        }
      }
    } catch (error) {
      console.error('Error cargando coordinador:', error);
    } finally {
      setLoadingCoordinator(false);
    }
  };

  // Paso 2: Buscar conversación existente usando el chat-id del coordinador
  const loadConversationForCoordinator = async (coordId: string) => {
    try {
      const chatIdResponse = await fetch(`${API_BASE_URL}/api/v1/chat/chat-id/${coordId}`);
      if (chatIdResponse.ok) {
        const chatIdData = await chatIdResponse.json();
        if (chatIdData.conversation_id) {
          setConversationId(chatIdData.conversation_id);
          await loadMessages(chatIdData.conversation_id);
        }
      }
    } catch (error) {
      console.error('Error buscando conversación con coordinador:', error);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/messages/${convId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const markAsRead = async (convId: string) => {
    try {
      await fetch(
        `${API_BASE_URL}/api/v1/chat/mark-as-read/${convId}?user_role=teacher`,
        { method: 'PUT' }
      );
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !coordinator) return;

    setSending(true);
    try {
      // Obtener el chatId del coordinador (receptor)
      const chatIdResponse = await fetch(`${API_BASE_URL}/api/v1/chat/chat-id/${coordinator.id}`);
      if (!chatIdResponse.ok) throw new Error('No se pudo obtener el chatId del coordinador');
      const chatIdData = await chatIdResponse.json();

      if (!chatIdData.chat_id) throw new Error('chatId del coordinador no disponible');

      // Enviar mensaje usando send-by-chat-id (mismo flujo que ChatComponent)
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/send-by-chat-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_chat_id: chatIdData.chat_id,
          sender_id: user.id,
          sender_name: user.name,
          sender_role: 'teacher',
          message: message.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('');
        const newConvId = conversationIdRef.current || data.conversation_id;
        if (newConvId) {
          if (!conversationIdRef.current) {
            setConversationId(newConvId);
          }
          setTimeout(() => loadMessages(newConvId), 300);
        }
      } else {
        const errText = await response.text();
        console.error('Error enviando mensaje:', errText);
        // Si el coordinador no tiene chat-id aún (primera vez), usar send-message
        await sendMessageFallback();
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      await sendMessageFallback();
    } finally {
      setSending(false);
    }
  };

  // Fallback: usar send-message directo cuando el coordinador no tiene chat-id previo
  const sendMessageFallback = async () => {
    if (!coordinator) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationIdRef.current || null,
          sender_id: user.id,
          sender_name: user.name,
          sender_role: 'teacher',
          receiver_id: coordinator.id,
          receiver_name: coordinator.name,
          message: message.trim()
        })
      });
      if (response.ok) {
        const data = await response.json();
        setMessage('');
        const newConvId = conversationIdRef.current || data.conversation_id;
        if (newConvId) {
          if (!conversationIdRef.current) setConversationId(newConvId);
          setTimeout(() => loadMessages(newConvId), 300);
        }
      }
    } catch (error) {
      console.error('Error en fallback de envío:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const connectWebSocket = () => {
    try {
      const wsUrl = `${API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://')}/api/v1/chat/ws/${user.id}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket conectado');
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);
        (ws as any).pingInterval = pingInterval;
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_message') {
            const currentConvId = conversationIdRef.current;
            if (currentConvId && data.conversation_id === currentConvId) {
              loadMessages(currentConvId);
            } else if (!currentConvId && data.conversation_id) {
              // Primera vez: guardar conversation_id y cargar mensajes
              setConversationId(data.conversation_id);
              loadMessages(data.conversation_id);
            }
          }
        } catch (error) {
          console.error('❌ Error procesando mensaje WebSocket:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
      };
      
      ws.onclose = () => {
        if ((ws as any).pingInterval) {
          clearInterval((ws as any).pingInterval);
        }
        setTimeout(() => {
          if (wsRef.current === ws) {
            wsRef.current = null;
            connectWebSocket();
          }
        }, 3000);
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Error conectando WebSocket:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  useEffect(() => {
    loadCoordinator();
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null;
        ws.close();
      }
    };
  }, [user.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [conversationId]);

  // Cargar historial de reportes
  const loadReportHistory = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/reports/teacher/${user.id}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const reports = data.reports || [];
        return reports.map((report: any) => ({
          id: report._id,
          name: report.title,
          date: new Date(report.created_at).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
          status: report.status || 'enviado'
        }));
      }
    } catch (error) {
      console.error('Error cargando historial de reportes:', error);
    }
    return [];
  };

  const [reportHistory, setReportHistory] = useState<ReportStatus[]>([]);

  useEffect(() => {
    loadReportHistory().then(setReportHistory);
  }, [user.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      console.log('Archivos seleccionados:', files);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage();
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enviado':
        return <Badge variant="warning">Enviado</Badge>;
      case 'recibido':
        return <Badge variant="info">Recibido</Badge>;
      case 'revisado':
        return <Badge variant="success">Revisado</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };
  // Formatear tiempo (ya definido arriba)
  // Agrupar mensajes por fecha
  const groupedMessages = messages.reduce(
    (groups: Record<string, Message[]>, msg) => {
      const date = new Date(msg.timestamp).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
      return groups;
    },
    {}
  );
  return (
    <MainLayout
      role="teacher"
      currentPage="teacher-coordinator-chat"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={user}
      title="Chat con Coordinador">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
        {/* Panel de Chat Principal */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          {/* Header del Chat */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar fallback={coordinator?.name ?? 'Coordinador'} size="md" />
                {!loadingCoordinator && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {loadingCoordinator ? 'Cargando...' : (coordinator?.name ?? 'Coordinador')}
                </h3>
                <p className="text-xs text-slate-500">Coordinador</p>
                <span className="text-xs text-green-600">
                  {loadingCoordinator ? 'Conectando...' : 'En línea'}
                </span>
              </div>
            </div>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-16 h-16 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Inicia la conversación</p>
                <p className="text-sm text-slate-400 mt-2">
                  Escribe un mensaje abajo para comenzar
                </p>
              </div>
            ) : (
              <>
                {Object.entries(groupedMessages).map(([date, msgs]) =>
                <div key={date}>
                    {/* Separador de fecha */}
                    <div className="flex items-center justify-center mb-4">
                      <span className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full">
                        {date}
                      </span>
                    </div>

                    {/* Mensajes del día */}
                    <div className="space-y-4">
                      {msgs.map((msg) => {
                        const isOwnMessage = msg.sender_id === user.id;
                        return (
                          <div
                            key={msg.message_id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>

                            <div
                              className={`max-w-[75%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>

                              <div
                                className={`
                                  rounded-2xl px-4 py-3 text-sm shadow-sm
                                  ${isOwnMessage ? 'bg-primary text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}
                                }`}>

                                <p className="leading-relaxed">{msg.message}</p>
                                <div className={`flex items-center gap-1 mt-1 ${
                                  isOwnMessage ? 'justify-end' : 'justify-start'
                                }`}>
                                  {isOwnMessage ? (
                                    <>
                                      <span className="text-xs opacity-70">
                                        {formatTime(msg.timestamp)}
                                      </span>
                                      {msg.read ? (
                                        <CheckCheck className="w-3 h-3 opacity-70" aria-label="Leído" />
                                      ) : msg.delivered ? (
                                        <Check className="w-3 h-3 opacity-70" aria-label="Entregado" />
                                      ) : (
                                        <Clock className="w-3 h-3 opacity-70" aria-label="Enviando..." />
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 opacity-70" />
                                      <span className="text-xs opacity-70">
                                        {formatTime(msg.timestamp)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input del Chat */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-slate-400 hover:text-primary p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Adjuntar archivo"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                disabled={sending}
              />
              <Button
                type="submit"
                size="sm"
                className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
                disabled={!message.trim() || sending}
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Panel Lateral - Historial de Reportes */}
        <div className="space-y-6">
          {/* Subir Reporte Rápido */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Subir Reporte de Avance
            </h3>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 hover:border-primary/50 transition-colors cursor-pointer">

              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">
                Arrastra o haz clic para subir
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PDF, DOC, XLS (máx. 10MB)
              </p>
            </div>
          </Card>

          {/* Historial de Reportes */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Historial de Reportes
            </h3>
            <div className="space-y-3">
              {reportHistory.map((report) =>
              <div
                key={report.id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">

                  <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {report.name}
                    </p>
                    <p className="text-xs text-slate-500">{report.date}</p>
                  </div>
                  {getStatusBadge(report.status)}
                </div>
              )}
            </div>
          </Card>

          {/* Información de Contacto */}
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h3 className="font-semibold text-slate-900 mb-3">
              Información de Contacto
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-slate-600">
                <span className="font-medium">Coordinador/a:</span>{' '}
                {coordinator?.name ?? 'No disponible'}
              </p>
              <p className="text-slate-600">
                <span className="font-medium">Email:</span> {coordinator?.email ?? 'No disponible'}
              </p>
              <p className="text-slate-600">
                <span className="font-medium">Horario:</span> Lun-Vie 8:00 AM -
                5:00 PM
              </p>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>);

}