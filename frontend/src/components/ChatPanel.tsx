import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../services/api';
import { notificationsService } from '../services/notifications';
import { MessageSquare, Send, X, User, Clock, Check, CheckCheck, MessageCircle } from 'lucide-react';
import { Button } from './ui/Button';

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

interface Conversation {
  conversation_id: string;
  student_id: string;
  student_name: string;
  teacher_id: string;
  teacher_name: string;
  project_id?: string;
  project_title?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count_student: number;
  unread_count_teacher: number;
  created_at: string;
  updated_at: string;
}

interface ChatPanelProps {
  userId: string;
  userName: string;
  userRole: 'student' | 'teacher';
  isOpen: boolean;
  onClose: () => void;
  otherUserId?: string;
  otherUserName?: string;
  projectId?: string;
  projectTitle?: string;
}

export function ChatPanel({ userId, userName, userRole, isOpen, onClose, otherUserId, otherUserName, projectId, projectTitle }: ChatPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const selectedConversationRef = useRef<Conversation | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/conversations/${userId}?role=${userRole}`
      );
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/messages/${conversationId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(
        `${API_BASE_URL}/api/v1/chat/mark-as-read/${conversationId}?user_role=${userRole}`,
        { method: 'PUT' }
      );
      loadConversations();
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const receiverId = selectedConversation 
      ? (userRole === 'student' ? selectedConversation.teacher_id : selectedConversation.student_id)
      : otherUserId;
    
    const receiverName = selectedConversation
      ? (userRole === 'student' ? selectedConversation.teacher_name : selectedConversation.student_name)
      : otherUserName;

    if (!receiverId || !receiverName) {
      console.error('Falta información del receptor');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation?.conversation_id || null,
          sender_id: userId,
          sender_name: userName,
          sender_role: userRole,
          receiver_id: receiverId,
          receiver_name: receiverName,
          message: newMessage,
          project_id: selectedConversation?.project_id || projectId,
          project_title: selectedConversation?.project_title || projectTitle
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNewMessage('');
        
        if (!selectedConversation) {
          await loadConversations();
          const conversationsResponse = await fetch(
            `${API_BASE_URL}/api/v1/chat/conversations/${userId}?role=${userRole}`
          );
          if (conversationsResponse.ok) {
            const conversationsData = await conversationsResponse.json();
            const newConv = conversationsData.conversations?.find(
              (c: Conversation) => c.conversation_id === data.conversation_id
            );
            if (newConv) {
              setSelectedConversation(newConv);
            }
          }
        } else {
          loadMessages(selectedConversation.conversation_id);
          loadConversations();
        }
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    } finally {
      setSending(false);
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
    if (isOpen && userId) {
      loadConversations();
      connectWebSocket();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isOpen, userId]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(`${API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://')}/api/v1/chat/ws/${userId}`);
      
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
            console.log('📩 Nuevo mensaje recibido vía WebSocket:', data);
            loadConversations();
            
            const currentConv = selectedConversationRef.current;
            if (currentConv && data.conversation_id === currentConv.conversation_id) {
              console.log('✅ Actualizando mensajes de la conversación activa');
              loadMessages(currentConv.conversation_id);
            }
          } else if (data.type === 'pong') {
            // Respuesta al ping (silencioso)
          }
        } catch (error) {
          console.error('❌ Error procesando mensaje WebSocket:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
      };
      
      ws.onclose = () => {
        console.log('🔌 WebSocket desconectado');
        if ((ws as any).pingInterval) {
          clearInterval((ws as any).pingInterval);
        }
        if (isOpen) {
          setTimeout(() => {
            if (isOpen && !wsRef.current) {
              connectWebSocket();
            }
          }, 3000);
        }
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Error conectando WebSocket:', error);
    }
  };

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
    if (selectedConversation) {
      loadMessages(selectedConversation.conversation_id);
      markAsRead(selectedConversation.conversation_id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-0 h-screen w-96 bg-white shadow-2xl z-50 flex flex-col border-r border-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6" />
          <div>
            <h2 className="font-semibold text-lg">Mensajes</h2>
            <p className="text-xs text-white/80">
              {conversations.length} conversación(es)
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Vista de conversaciones o mensajes */}
      {conversations.length === 0 && !selectedConversation ? (
        <>
          {/* Vista de nueva conversación (sin conversaciones previas) */}
          <div className="border-b border-slate-200 p-4 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  Nueva conversación
                </h3>
                <p className="text-xs text-slate-500">
                  Escribe tu primer mensaje
                </p>
              </div>
            </div>
          </div>

          {/* Área de mensajes vacía */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Inicia la conversación</p>
              <p className="text-sm text-slate-400 mt-2">
                Escribe un mensaje abajo para comenzar
              </p>
            </div>
          </div>

          {/* Input de mensaje */}
          <div className="border-t border-slate-200 p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={sending}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      ) : !selectedConversation ? (
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-slate-100">
            {conversations.map((conv) => {
              const unreadCount = userRole === 'student' 
                ? conv.unread_count_student 
                : conv.unread_count_teacher;
              const otherPersonName = userRole === 'student'
                ? conv.teacher_name
                : conv.student_name;

              return (
                <div
                  key={conv.conversation_id}
                  onClick={() => setSelectedConversation(conv)}
                  className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {otherPersonName}
                        </h3>
                        {conv.last_message_time && (
                          <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                            {formatTime(conv.last_message_time)}
                          </span>
                        )}
                      </div>
                      {conv.project_title && (
                        <p className="text-xs text-slate-500 mb-1 truncate">
                          📄 {conv.project_title}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600 truncate">
                          {conv.last_message || 'Sin mensajes'}
                        </p>
                        {unreadCount > 0 && (
                          <span className="bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* Header de conversación */}
          <div className="border-b border-slate-200 p-4 bg-slate-50">
            <button
              onClick={() => setSelectedConversation(null)}
              className="text-primary hover:text-primary-dark text-sm font-medium mb-2"
            >
              ← Volver a conversaciones
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {userRole === 'student' 
                    ? selectedConversation.teacher_name 
                    : selectedConversation.student_name}
                </h3>
                {selectedConversation.project_title && (
                  <p className="text-xs text-slate-500">
                    📄 {selectedConversation.project_title}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => {
              const isOwnMessage = msg.sender_id === userId;
              return (
                <div
                  key={msg.message_id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-primary text-white'
                        : 'bg-white text-slate-900 border border-slate-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
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
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de mensaje */}
          <div className="border-t border-slate-200 p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={sending}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
