import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  MessageSquare,
  Circle,
  CheckCheck,
  Paperclip,
  X,
  FileText,
  Download
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
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

interface ChatFile {
  file: File;
  url?: string;
  uploading?: boolean;
  error?: string;
}

interface SimpleTeacherCoordinatorChatProps {
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
  height?: string;
  showHeader?: boolean;
}

export function SimpleTeacherCoordinatorChat({
  currentUser,
  otherUser,
  className = '',
  height = 'h-[500px]',
  showHeader = true
}: SimpleTeacherCoordinatorChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<ChatFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cargar mensajes existentes
  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/v1/simple-chat/messages/${currentUser.id}/${otherUser.id}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.messages || []);
          setRoomId(data.room_id);
          console.log('✅ Mensajes cargados:', data.messages?.length || 0);
        }
      }
    } catch (error) {
      console.error('❌ Error cargando mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar archivos
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      // Validar tamaño máximo (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        console.error('❌ Archivo demasiado grande:', file.name);
        return false;
      }
      // Validar tipo de archivo
      const allowedTypes = ['image/', 'application/pdf', 'text/', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
      if (!allowedTypes.some(type => file.type.startsWith(type))) {
        console.error('❌ Tipo de archivo no permitido:', file.name);
        return false;
      }
      return true;
    });

    const newFiles: ChatFile[] = validFiles.map(file => ({
      file,
      uploading: false,
      error: undefined
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File): Promise<string> => {
    console.log('📤 Iniciando subida de archivo:', file.name, file.size, file.type);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chat_room', roomId || 'unknown');

    try {
      console.log('📨 Enviando archivo al endpoint:', `${API_BASE_URL}/api/v1/simple-chat/upload`);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/simple-chat/upload`, {
        method: 'POST',
        body: formData
      });

      console.log('📡 Respuesta del upload:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en upload:', errorText);
        throw new Error('Error al subir archivo');
      }

      const data = await response.json();
      console.log('✅ Upload exitoso:', data);
      return data.file_url;
    } catch (error) {
      console.error('❌ Error subiendo archivo:', error);
      throw error;
    }
  };

  const sendFileMessage = async (fileUrl: string, fileName: string, fileType: string, fileSize: number) => {
    try {
      console.log('📤 Enviando mensaje con archivo:', { fileUrl, fileName, fileType, fileSize });
      
      const messageData = {
        sender_id: currentUser.id,
        receiver_id: otherUser.id,
        sender_name: currentUser.name,
        sender_role: currentUser.role,
        message: `📎 ${fileName}`,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize
      };
      
      console.log('📨 Datos a enviar:', messageData);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/simple-chat/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Respuesta exitosa:', data);
        if (data.success) {
          console.log('✅ Archivo enviado:', data.message_id);
          setTimeout(loadMessages, 100);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Error en respuesta:', errorText);
      }
    } catch (error) {
      console.error('❌ Error enviando archivo:', error);
      throw error;
    }
  };

  // Funciones de utilidad
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.startsWith('text/')) return '📄';
    return '📎';
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      console.log('📥 Iniciando descarga:', fileUrl, fileName);
      
      let downloadUrl = fileUrl;
      
      // Si la URL es del tipo /uploads/chat/, usar el endpoint de descarga
      if (fileUrl.includes('/uploads/chat/')) {
        const filename = fileUrl.split('/').pop() || fileName;
        downloadUrl = `${API_BASE_URL}/api/v1/simple-chat/download/${filename}`;
        console.log('🔗 URL de descarga (endpoint):', downloadUrl);
      } else {
        console.log('🔗 URL de descarga (directa):', downloadUrl);
      }
      
      // Agregar headers para CORS si es necesario
      const response = await fetch(downloadUrl, {
        method: 'GET',
        mode: 'cors', // Explicitamente CORS
        headers: {
          'Accept': 'application/octet-stream, application/pdf, image/*, */*',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('📦 Blob creado:', blob.size, 'bytes');
      
      // Crear URL temporal y descargar
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      
      // Limpieza
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('✅ Descarga completada:', fileName);
    } catch (error) {
      console.error('❌ Error descargando archivo:', error);
      
      // Fallback 1: intentar abrir en nueva pestaña
      try {
        console.log('🔄 Intentando fallback: abrir en nueva pestaña...');
        window.open(fileUrl, '_blank');
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
        
        // Fallback 2: mostrar mensaje al usuario
        alert(`No se pudo descargar el archivo. Puedes acceder directamente desde: ${fileUrl}`);
      }
    }
  };

  // Enviar mensaje
  const sendMessage = async () => {
    if ((!message.trim() && attachedFiles.length === 0) || sending) return;

    setSending(true);
    const messageContent = message.trim();
    setMessage('');

    try {
      // Primero enviar mensaje de texto si existe
      if (messageContent) {
        const response = await fetch(`${API_BASE_URL}/api/v1/simple-chat/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender_id: currentUser.id,
            receiver_id: otherUser.id,
            sender_name: currentUser.name,
            sender_role: currentUser.role,
            message: messageContent
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log('✅ Mensaje enviado:', data.message_id);
          }
        }
      }

      // Luego subir y enviar archivos
      if (attachedFiles.length > 0) {
        console.log('📎 Procesando archivos adjuntos:', attachedFiles.length, 'archivos');
        
        for (const chatFile of attachedFiles) {
          try {
            console.log('📤 Procesando archivo:', chatFile.file.name);
            setUploadingFiles(prev => new Set(prev).add(chatFile.file.name));
            const fileUrl = await uploadFile(chatFile.file);
            console.log('🔗 URL del archivo subido:', fileUrl);
            await sendFileMessage(fileUrl, chatFile.file.name, chatFile.file.type, chatFile.file.size);
            console.log('✅ Mensaje con archivo enviado');
          } catch (error) {
            console.error('❌ Error procesando archivo:', chatFile.file.name, error);
          } finally {
            setUploadingFiles(prev => {
              const newSet = new Set(prev);
              newSet.delete(chatFile.file.name);
              return newSet;
            });
          }
        }
        setAttachedFiles([]);
        console.log('📁 Archivos adjuntos limpiados');
      }

      // Recargar mensajes para mostrar los nuevos
      setTimeout(loadMessages, 100);
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      // Restaurar el mensaje si falló
      setMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  // Conectar WebSocket
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `${API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://')}/api/v1/simple-chat/ws/${currentUser.id}`;
      console.log('🔌 Conectando WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket conectado');
        setWsConnected(true);
        setOnline(true);
        
        // Enviar ping periódico
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
          console.log('📨 Mensaje WebSocket recibido:', data);

          if (data.type === 'new_message') {
            // Verificar si el mensaje es para esta conversación
            if (data.message.sender_id === otherUser.id || data.message.receiver_id === currentUser.id) {
              console.log('✅ Mensaje relevante, recargando...');
              loadMessages();
            }
          } else if (data.type === 'user_online') {
            if (data.user_id === otherUser.id) {
              setOtherUserOnline(true);
              console.log('🟢 Usuario conectado:', otherUser.name);
            }
          } else if (data.type === 'user_offline') {
            if (data.user_id === otherUser.id) {
              setOtherUserOnline(false);
              console.log('🔴 Usuario desconectado:', otherUser.name);
            }
          } else if (data.type === 'pong') {
            // Respuesta al ping
          }
        } catch (error) {
          console.error('❌ Error procesando mensaje WebSocket:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Error WebSocket:', error);
        setWsConnected(false);
        setOnline(false);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket cerrado');
        setWsConnected(false);
        setOnline(false);
        
        // Limpiar interval
        if ((ws as any).pingInterval) {
          clearInterval((ws as any).pingInterval);
        }

        // Reconectar después de 3 segundos
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Reintentando conectar WebSocket...');
          connectWebSocket();
        }, 3000);
      };

    } catch (error) {
      console.error('❌ Error conectando WebSocket:', error);
      setWsConnected(false);
      setOnline(false);
    }
  };

  // Marcar mensajes como leídos
  const markAsRead = async () => {
    if (!roomId) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/v1/simple-chat/mark-read/${roomId}?user_id=${currentUser.id}`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('❌ Error marcando mensajes como leídos:', error);
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

  // Formatear fecha
  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return 'Hoy';
      }
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return '';
    }
  };

  // Agrupar mensajes por fecha
  const groupedMessages = messages.reduce((groups: Record<string, SimpleMessage[]>, msg) => {
    const date = formatDate(msg.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(msg);
    return groups;
  }, {});

  // Efectos
  useEffect(() => {
    loadMessages();
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        const ws = wsRef.current;
        if ((ws as any).pingInterval) {
          clearInterval((ws as any).pingInterval);
        }
        ws.close();
      }
    };
  }, [currentUser.id, otherUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages, roomId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage();
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden ${className} ${height}`}>
      {/* Header */}
      {showHeader && (
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar fallback={otherUser.name} size="md" />
              <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
                otherUserOnline ? 'bg-green-500' : 'bg-slate-400'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{otherUser.name}</h3>
              <p className="text-xs text-slate-500 capitalize">{otherUser.role}</p>
              <span className={`text-xs ${
                otherUserOnline ? 'text-green-600' : 'text-slate-400'
              }`}>
                {otherUserOnline ? 'En línea' : 'Desconectado'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-xs ${
              wsConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              <Circle className="w-2 h-2 fill-current" />
              {wsConnected ? 'Conectado' : 'Desconectado'}
            </div>
            
            {/* Botón de prueba de descarga */}
            <button
              onClick={() => downloadFile(
                "http://localhost:8000/uploads/chat/documento-prueba-descarga.pdf",
                "documento-prueba-descarga.pdf"
              )}
              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              title="Probar descarga de archivo"
            >
              🧪 Probar Descarga
            </button>
          </div>
        </div>
      )}

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
            <p className="text-sm text-slate-400 mt-2">
              Envía un mensaje para comenzar a chatear con {otherUser.name}
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

                {/* Messages */}
                <div className="space-y-3">
                  {msgs.map((msg) => {
                    const isOwnMessage = msg.sender_id === currentUser.id;
                    return (
                      <div
                        key={msg.message_id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                          <div className={`
                            rounded-2xl px-4 py-2 text-sm shadow-sm
                            ${isOwnMessage 
                              ? 'bg-primary text-white rounded-br-none' 
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                            }
                          `}>
                            {/* Mostrar archivo si existe */}
                            {msg.file_url && (
                              <div className="mb-2">
                                <div 
                                  className={`flex items-center gap-2 p-2 rounded-lg ${
                                    isOwnMessage 
                                      ? 'bg-white/20' 
                                      : 'bg-slate-50 border border-slate-200'
                                  }`}
                                >
                                  <span className="text-lg">{getFileIcon(msg.file_type || '')}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-medium truncate ${
                                      isOwnMessage ? 'text-white' : 'text-slate-700'
                                    }`}>
                                      {msg.file_name}
                                    </p>
                                    {msg.file_size && (
                                      <p className={`text-xs ${
                                        isOwnMessage ? 'text-white/70' : 'text-slate-500'
                                      }`}>
                                        {formatFileSize(msg.file_size)}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => downloadFile(msg.file_url!, msg.file_name!)}
                                    className={`p-2 rounded-lg hover:bg-white/20 transition-all transform hover:scale-105 ${
                                      isOwnMessage ? 'text-white hover:bg-white/30' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                    title="Descargar archivo"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {/* Mostrar mensaje de texto */}
                            {msg.message && !msg.message.startsWith('📎') && (
                              <p className="leading-relaxed">{msg.message}</p>
                            )}
                            
                            {/* Si es solo un archivo, mostrar el nombre */}
                            {msg.message && msg.message.startsWith('📎') && (
                              <p className="leading-relaxed opacity-70">
                                {msg.message.replace('📎 ', '')}
                              </p>
                            )}
                            
                            <div className={`flex items-center gap-1 mt-1 ${
                              isOwnMessage ? 'justify-end' : 'justify-start'
                            }`}>
                              <span className="text-xs opacity-70">
                                {formatTime(msg.timestamp)}
                              </span>
                              {isOwnMessage && msg.read && (
                                <CheckCheck className="w-3 h-3 opacity-70" />
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
        {/* Archivos adjuntos */}
        {attachedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachedFiles.map((chatFile, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 text-sm"
              >
                <FileText className="w-4 h-4 text-slate-600" />
                <span className="truncate max-w-[150px]">{chatFile.file.name}</span>
                <span className="text-xs text-slate-500">
                  ({formatFileSize(chatFile.file.size)})
                </span>
                {uploadingFiles.has(chatFile.file.name) ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <button
                    onClick={() => removeFile(index)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    title="Eliminar archivo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="Adjuntar archivo"
            disabled={sending}
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
            disabled={!message.trim() && attachedFiles.length === 0 || sending || !wsConnected}
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
