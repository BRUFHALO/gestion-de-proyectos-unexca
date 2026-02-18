import React, { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Notificaciones de ejemplo
  const [notifications, setNotifications] = useState<Notification[]>([
  {
    id: '1',
    title: 'Proyecto Aprobado',
    message: 'Tu proyecto "Sistema de Biblioteca Digital" ha sido aprobado.',
    time: 'Hace 2 min',
    read: false,
    type: 'success'
  },
  {
    id: '2',
    title: 'Nuevo Comentario',
    message: 'Prof. Martínez comentó en tu metodología.',
    time: 'Hace 1 hora',
    read: false,
    type: 'info'
  },
  {
    id: '3',
    title: 'Recordatorio de Entrega',
    message: 'Borrador final vence en 2 días.',
    time: 'Hace 1 día',
    read: true,
    type: 'warning'
  }]
  );
  const unreadCount = notifications.filter((n) => !n.read).length;
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node))
      {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) =>
      n.id === id ?
      {
        ...n,
        read: true
      } :
      n
      )
    );
  };
  const markAllAsRead = () => {
    setNotifications(
      notifications.map((n) => ({
        ...n,
        read: true
      }))
    );
  };
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">

        <Bell className="w-6 h-6" />
        {unreadCount > 0 &&
        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
        }
      </button>

      {isOpen &&
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 z-50 animate-scale-in origin-top-right">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Notificaciones</h3>
            {unreadCount > 0 &&
          <button
            onClick={markAllAsRead}
            className="text-xs text-primary hover:text-primary-dark font-medium">

                Marcar todo como leído
              </button>
          }
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ?
          <div className="p-8 text-center text-slate-500 text-sm">
                Sin notificaciones
              </div> :

          <ul className="divide-y divide-slate-50">
                {notifications.map((notification) =>
            <li
              key={notification.id}
              className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50/30' : ''}`}
              onClick={() => markAsRead(notification.id)}>

                    <div className="flex items-start justify-between">
                      <div>
                        <p
                    className={`text-sm font-medium ${!notification.read ? 'text-slate-900' : 'text-slate-600'}`}>

                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          {notification.time}
                        </p>
                      </div>
                      {!notification.read &&
                <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                }
                    </div>
                  </li>
            )}
              </ul>
          }
          </div>
          <div className="p-3 border-t border-slate-100 text-center">
            <button className="text-xs text-slate-500 hover:text-primary font-medium">
              Ver todas las notificaciones
            </button>
          </div>
        </div>
      }
    </div>);

}