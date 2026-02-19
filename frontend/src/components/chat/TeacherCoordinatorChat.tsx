import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  MessageSquare,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { API_BASE_URL } from '../../services/api';

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

interface TeacherCoordinatorChatProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
    email?: string;
  };
  otherUser: {
    id: string;
    name: string;
    role: string;
    email?: string;
  };
  className?: string;
  showHeader?: boolean;
  height?: string;
}

export function TeacherCoordinatorChat({
  currentUser,
  otherUser,
  className = '',
  showHeader = true,
  height = 'h-[500px]'
}: TeacherCoordinatorChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Mantener ref sincronizada con el estado
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Cargar conversación existente o crear una nueva
  const loadConversation = async () => {
    try {
      setLoading(true);
      const chatIdResponse = await fetch(`${API_BASE_URL}/api/v1/chat/chat-id/${otherUser.id}`);
      
      if (chatIdResponse.ok) {
        const chatIdData = await chatIdResponse.json();
        if (chatIdData.conversation_id) {
          setConversationId(chatIdData.conversation_id);
          await loadMessages(chatIdData.conversation_id);
        }
      }
    } catch (error) {
      console.error('Error cargando conversación:', error);
    } finally {
      setLoading(false);
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
        `${API_BASE_URL}/api/v1/chat/mark-as-read/${convId}?user_role=${currentUser.role}`,
        { method: 'PUT' }
      );
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !otherUser) return;

    setSending(true);
    try {
      // Obtener el chatId del receptor
      const chatIdResponse = await fetch(`${API_BASE_URL}/api/v1/chat/chat-id/${otherUser.id}`);
      if (!chatIdResponse.ok) throw new Error('No se pudo obtener el chatId del receptor');
      
      const chatIdData = await chatIdResponse.json();
      if (!chatIdData.chat_id) throw new Error('chatId del receptor no disponible');

      // Enviar mensaje
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/send-by-chat-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_chat_id: chatIdData.chat_id,
          sender_id: currentUser.id,
          sender_name: currentUser.name,
          sender_role: currentUser.role,
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
        // Fallback a send-message si falla
        await sendMessageFallback();
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      await sendMessageFallback();
    } finally {
      setSending(false);
    }
  };

  const sendMessageFallback = async () => {
    if (!otherUser) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationIdRef.current || null,
          sender_id: currentUser.id,
          sender_name: currentUser.name,
          sender_role: currentUser.role,
          receiver_id: otherUser.id,
          receiver_name: otherUser.name,
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

  const connectWebSocket = () => {
    try {
      const wsUrl = `${API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://')}/api/v1/chat/ws/${currentUser.id}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket conectado');
        setOnline(true);
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
              setConversationId(data.conversation_id);
              loadMessages(data.conversation_id);
            }
          }
        } catch (error) {
          console.error('❌ Error procesando mensaje WebSocket:', error);
        }
      };
      
      ws.onerror = () => {
        console.error('❌ Error en WebSocket');
        setOnline(false);
      };
      
      ws.onclose = () => {
        setOnline(false);
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
      setOnline(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      console.log('Archivos seleccionados:', files);
      // TODO: Implementar carga de archivos
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage();
  };

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

  useEffect(() => {
    loadConversation();
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null;
        ws.close();
      }
    };
  }, [currentUser.id, otherUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [conversationId]);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden ${className} ${height}`}>
      {/* Header */}
      {showHeader && (
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar fallback={otherUser.name} size="md" />
              <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
                online ? 'bg-green-500' : 'bg-slate-400'
              }`}></span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{otherUser.name}</h3>
              <p className="text-xs text-slate-500">
                {otherUser.role === 'coordinator' ? 'Coordinador' : 'Docente'}
              </p>
              <span className={`text-xs ${
                online ? 'text-green-600' : 'text-slate-400'
              }`}>
                {online ? 'En línea' : 'Desconectado'}
              </span>
            </div>
          </div>
          <Badge variant={online ? 'success' : 'default'}>
            {online ? 'Disponible' : 'Ausente'}
          </Badge>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-500">Cargando conversación...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Inicia la conversación</p>
            <p className="text-sm text-slate-400 mt-2">
              Envía un mensaje para comenzar a chatear
            </p>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                {/* Date Separator */}
                <div className="flex items-center justify-center mb-4">
                  <span className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full">
                    {date}
                  </span>
                </div>

                {/* Messages of the day */}
                <div className="space-y-4">
                  {msgs.map((msg) => {
                    const isOwnMessage = msg.sender_id === currentUser.id;
                    return (
                      <div
                        key={msg.message_id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                          <div className={`
                            rounded-2xl px-4 py-3 text-sm shadow-sm
                            ${isOwnMessage 
                              ? 'bg-primary text-white rounded-br-none' 
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                            }
                          `}>
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
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
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
  );
}
