import React, { useState } from 'react';
import { Send, X, Paperclip } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
}
interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
}
export function ChatPanel({ isOpen, onClose, recipientName }: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
  {
    id: '1',
    sender: 'Prof. Martínez',
    text: 'Por favor revisa la sección de metodología.',
    time: '10:30 AM',
    isMe: false
  },
  {
    id: '2',
    sender: 'Yo',
    text: 'He actualizado las citas como solicitaste.',
    time: '10:35 AM',
    isMe: true
  },
  {
    id: '3',
    sender: 'Prof. Martínez',
    text: '¡Perfecto! Lo revisaré en breve.',
    time: '10:36 AM',
    isMe: false
  }]
  );
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setMessages([
    ...messages,
    {
      id: Date.now().toString(),
      sender: 'Yo',
      text: message,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isMe: true
    }]
    );
    setMessage('');
  };
  if (!isOpen) return null;
  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-xl w-80 sm:w-96">
      {/* Encabezado */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <Avatar fallback={recipientName} size="sm" />
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">
              {recipientName}
            </h3>
            <span className="flex items-center text-xs text-green-600">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
              En línea
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600">

          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) =>
        <div
          key={msg.id}
          className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>

            <div
            className={`
                max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm
                ${msg.isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}
              `}>

              <p>{msg.text}</p>
              <p
              className={`text-[10px] mt-1 text-right ${msg.isMe ? 'text-primary-light/80' : 'text-slate-400'}`}>

                {msg.time}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Entrada */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 p-2">

            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" />

          <Button
            type="submit"
            size="sm"
            className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
            disabled={!message.trim()}>

            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </form>
      </div>
    </div>);

}