import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Download,
  Circle,
  MessageSquare
} from 'lucide-react';
import { Button } from '../ui/Button';
import { API_BASE_URL } from '../../services/api';

interface SimpleMessage {
  message_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  receiver_id: string;
  message: string;
  timestamp: string;
  read: boolean;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
}

interface SimpleTeacherCoordinatorChatProps {
  currentUser: any;
  otherUser: any;
  onNewMessage?: (unreadCount: number) => void;
}

export function SimpleTeacherCoordinatorChat({
  currentUser,
  otherUser,
  onNewMessage
}: SimpleTeacherCoordinatorChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cargar mensajes existentes
  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/simple-chat/messages/${currentUser.id}/${otherUser.id}`);
      
      if (!response.ok) {
        throw new Error('Error cargando mensajes');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
      
      // Hacer scroll hacia abajo después de cargar mensajes
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      // Obtener room ID
      const roomResponse = await fetch(`${API_BASE_URL}/api/v1/simple-chat/get-room/${currentUser.id}/${otherUser.id}`);
      if (roomResponse.ok) {
        const roomData = await roomResponse.json();
        setRoomId(roomData.room_id);
      }
      
      // Contar mensajes no leídos
      const unreadMessages = (data.messages || []).filter((msg: SimpleMessage) => 
        msg.sender_id === otherUser.id && !msg.read
      );
      
      const count = unreadMessages.length;
      setUnreadCount(count);
      
      if (onNewMessage) {
        onNewMessage(count);
      }
      
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Conectar WebSocket
  const connectWebSocket = () => {
    try {
      const wsUrl = `${API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://')}/api/v1/simple-chat/ws/${currentUser.id}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket conectado');
        setWsConnected(true);
        
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
            if (data.message.sender_id === otherUser.id || data.message.receiver_id === currentUser.id) {
              if (data.message.sender_id === otherUser.id) {
                setUnreadCount(prev => {
                  const newCount = prev + 1;
                  if (onNewMessage) {
                    onNewMessage(newCount);
                  }
                  return newCount;
                });
              }
              loadMessages();
            }
          }
        } catch (error) {
          console.error('❌ Error procesando mensaje WebSocket:', error);
        }
      };

      ws.onerror = () => {
        console.error('❌ Error WebSocket');
        setWsConnected(false);
      };

      ws.onclose = () => {
        console.log('� WebSocket cerrado');
        setWsConnected(false);
        
        if ((ws as any).pingInterval) {
          clearInterval((ws as any).pingInterval);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

    } catch (error) {
      console.error('❌ Error conectando WebSocket:', error);
      setWsConnected(false);
    }
  };

  // Marcar mensajes como leídos
  const markAsRead = async () => {
    if (!roomId) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/v1/simple-chat/mark-read/${roomId}?user_id=${currentUser.id}`, {
        method: 'PUT'
      });
      
      setUnreadCount(0);
      if (onNewMessage) {
        onNewMessage(0);
      }
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
    }
  };

  // Enviar mensaje
  const sendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      setSending(true);
      
      const messageData = {
        sender_id: currentUser.id,
        receiver_id: otherUser.id,
        sender_name: currentUser.name,
        sender_role: currentUser.role,
        message: message.trim()
      };
      
      const response = await fetch(`${API_BASE_URL}/api/v1/simple-chat/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });
      
      if (response.ok) {
        setMessage('');
        
        setUnreadCount(0);
        if (onNewMessage) {
          onNewMessage(0);
        }
        
        // Recargar mensajes y hacer scroll hacia abajo
        setTimeout(() => {
          loadMessages();
          // Hacer scroll hacia abajo después de enviar
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }, 100);
      }
      
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
    } finally {
      setSending(false);
    }
  };

  // Formatear hora
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // Descargar archivo
  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Error descargando archivo');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error descargando archivo:', error);
    }
  };

  // Efectos
  useEffect(() => {
    loadMessages();
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentUser.id, otherUser.id]);

  useEffect(() => {
    // Hacer scroll hacia abajo cuando cambian los mensajes
    const timeout = setTimeout(() => {
      scrollToBottom();
    }, 50); // Pequeño delay para asegurar que el DOM se actualice
    
    return () => clearTimeout(timeout);
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const timeout = setTimeout(() => {
        markAsRead();
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [messages, roomId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage();
  };

  return (
    <div className="flex flex-col h-[85vh] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold">
              {otherUser.name ? otherUser.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                {otherUser.name || 'Usuario Desconocido'}
              </h3>
              <p className="text-xs text-slate-500">
                {otherUser.role === 'coordinator' ? 'Coordinador' : 'Profesor'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-xs ${
              wsConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              <Circle className="w-2 h-2 fill-current" />
              {wsConnected ? 'Conectado' : 'Desconectado'}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-500">Cargando conversación...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Inicia la conversación</p>
            <p className="text-slate-400 text-sm mt-1">Envía un mensaje para comenzar</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.message_id}
                className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender_id === currentUser.id
                      ? 'bg-primary text-white'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  {/* Message content */}
                  <p className={`text-sm ${msg.sender_id === currentUser.id ? 'text-white' : 'text-slate-900'}`}>
                    {msg.message}
                  </p>
                  
                  {/* File attachment */}
                  {msg.file_url && (
                    <div className={`mt-2 p-2 rounded-lg ${
                      msg.sender_id === currentUser.id 
                        ? 'bg-white/10' 
                        : 'bg-slate-50'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${
                            msg.sender_id === currentUser.id ? 'text-white' : 'text-slate-900'
                          }`}>
                            {msg.file_name}
                          </p>
                        </div>
                        <button
                          onClick={() => downloadFile(msg.file_url!, msg.file_name!)}
                          className={`p-1 rounded transition-colors ${
                            msg.sender_id === currentUser.id
                              ? 'hover:bg-white/20 text-white'
                              : 'hover:bg-slate-200 text-slate-600'
                          }`}
                          title="Descargar archivo"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Timestamp */}
                  <p className={`text-xs mt-1 ${
                    msg.sender_id === currentUser.id ? 'text-white/70' : 'text-slate-400'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
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
            disabled={!message.trim() || sending || !wsConnected}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        
        {!wsConnected && (
          <p className="text-xs text-red-500 mt-2 text-center">
            Conexión perdida. Intentando reconectar...
          </p>
        )}
      </div>
    </div>
  );
}
