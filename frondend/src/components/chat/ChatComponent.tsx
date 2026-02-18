import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Paperclip,
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

interface Message {
  message_id: string;
  conversation_id?: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  receiver_id: string;
  receiver_name: string;
  message: string;
  timestamp: string;
  read: boolean;
  isMe?: boolean;
}

interface ChatComponentProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  otherUser?: {
    id: string;
    name: string;
    role: string;
    email?: string;
    lastActive?: string;
    pendingEvaluations?: number;
  };
  conversationId?: string;
}

export function ChatComponent({
  isOpen,
  onClose,
  currentUser,
  otherUser,
  conversationId
}: ChatComponentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cargar mensajes existentes
  useEffect(() => {
    if (isOpen && conversationId) {
      loadMessages();
    }
  }, [isOpen, conversationId]);

  // Conectar WebSocket
  useEffect(() => {
    if (isOpen && currentUser) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen, currentUser]);

  const connectWebSocket = () => {
    try {
      const wsUrl = `ws://localhost:8000/api/v1/chat/ws/${currentUser.id}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket conectado');
        // Enviar ping periódico para mantener conexión
        const pingInterval = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send('ping');
          }
        }, 30000);

        // Limpiar interval al cerrar
        if (wsRef.current) {
          wsRef.current.onclose = () => {
            clearInterval(pingInterval);
          };
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'new_message') {
            const newMsg = {
              ...data.message,
              isMe: data.message.sender_id === currentUser.id
            };
            setMessages(prev => [...prev, newMsg]);
            scrollToBottom();
          } else if (data.type === 'pong') {
            // Respuesta al ping, no hacer nada
          }
        } catch (error) {
          console.error('Error procesando mensaje WebSocket:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Error WebSocket:', error);
      };

    } catch (error) {
      console.error('Error conectando WebSocket:', error);
    }
  };

  const loadMessages = async () => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/messages/${conversationId}`);
      
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.messages.map((msg: any) => ({
          ...msg,
          isMe: msg.sender_id === currentUser.id
        }));
        setMessages(formattedMessages);
        scrollToBottom();
        
        // Marcar mensajes como leídos
        await markAsRead();
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!conversationId) return;
    
    try {
      await fetch(
        `${API_BASE_URL}/api/v1/chat/mark-as-read/${conversationId}?user_role=${currentUser.role}`,
        { method: 'PUT' }
      );
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !otherUser) return;

    try {
      setSending(true);
      
      // Obtener chatId del receptor
      const chatIdResponse = await fetch(`${API_BASE_URL}/api/v1/chat/chat-id/${otherUser.id}`);
      const chatIdData = await chatIdResponse.json();
      
      if (!chatIdData.success) {
        throw new Error('No se pudo obtener el chatId del receptor');
      }
      
      const targetChatId = chatIdData.chat_id;
      
      console.log('Enviando mensaje al chatId:', targetChatId);

      // Enviar mensaje usando chatId
      const messageData = {
        target_chat_id: targetChatId,
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        sender_role: currentUser.role,
        message: newMessage.trim()
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/chat/send-by-chat-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        setNewMessage('');
        
        // Recargar mensajes para asegurar que aparezcan
        if (conversationId || data.conversation_id) {
          setTimeout(async () => {
            await loadMessages();
          }, 500);
        }
        
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Error al enviar mensaje');
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      // Agregar mensaje localmente si falla el envío
      const tempMessage: Message = {
        message_id: Date.now().toString(),
        conversation_id: conversationId || '',
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        sender_role: currentUser.role,
        receiver_id: otherUser.id,
        receiver_name: otherUser.name,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        read: false,
        isMe: true
      };
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
    } finally {
      setSending(false);
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar fallback={otherUser?.name ?? ''} size="md" />
            <div>
              <h3 className="font-semibold text-slate-900">
                {otherUser?.name}
              </h3>
              <p className="text-xs text-slate-500">
                {otherUser?.email} • {otherUser?.role === 'teacher' ? 'Profesor' : 'Coordinador'}
              </p>
              {otherUser?.lastActive && (
                <span className={`text-xs ${
                  otherUser.lastActive === 'En línea' ? 'text-green-600' : 'text-slate-400'
                }`}>
                  {otherUser.lastActive}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {otherUser?.pendingEvaluations !== undefined && (
              <Badge
                variant={otherUser.pendingEvaluations > 5 ? 'warning' : 'success'}
              >
                {otherUser.pendingEvaluations} pendientes
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-500">Cargando mensajes...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No hay mensajes aún</p>
              <p className="text-sm text-slate-400">
                Inicia una conversación con {otherUser?.name}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.message_id}
                className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm
                    ${msg.isMe 
                      ? 'bg-primary text-white rounded-br-none' 
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }
                  `}
                >
                  <p>{msg.message}</p>
                  <p
                    className={`text-[10px] mt-1 text-right ${
                      msg.isMe ? 'text-primary-light/80' : 'text-slate-400'
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={sendMessage} className="flex items-center gap-2">
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 p-2"
              title="Adjuntar archivo"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1"
              disabled={sending}
            />
            <Button
              type="submit"
              size="sm"
              className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Use este chat para comunicación directa con {otherUser?.name}
          </p>
        </div>
      </div>
    </div>
  );
}

const API_BASE_URL = 'http://localhost:8000';
