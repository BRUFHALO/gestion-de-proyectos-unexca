import { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, CheckCircle, X, ExternalLink } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { API_BASE_URL } from '../services/api';

interface Notification {
  id: string;
  type: 'comment' | 'message' | 'grade';
  title: string;
  message: string;
  projectId?: string;
  projectTitle?: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  read: boolean;
}

interface NotificationsDropdownProps {
  userId: string;
  userRole: 'student' | 'teacher';
}

export function NotificationsDropdown({ userId, userRole }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout>();

  // Cargar notificaciones iniciales
  useEffect(() => {
    loadNotifications();
    startPolling();
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [userId]);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      if (!userId) {
        console.warn('Cannot load notifications: userId is undefined');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/notifications/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        updateUnreadCount(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const startPolling = () => {
    // Polling cada 30 segundos para nuevas notificaciones
    pollingRef.current = setInterval(() => {
      loadNotifications();
    }, 30000);
  };

  const updateUnreadCount = (notifs: Notification[]) => {
    const unread = notifs.filter(n => !n.read).length;
    setUnreadCount(unread);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      updateUnreadCount(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!userId) {
        console.warn('Cannot mark all as read: userId is undefined');
        return;
      }
      
      await fetch(`${API_BASE_URL}/api/v1/notifications/${userId}/read-all`, {
        method: 'PUT'
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      updateUnreadCount(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'grade':
        return <CheckCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'comment':
        return 'bg-blue-50 border-blue-200';
      case 'message':
        return 'bg-green-50 border-green-200';
      case 'grade':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)} d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de campanita */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Marcar todas como leídas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-slate-50 transition-colors ${
                      !notification.read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 text-sm">
                              {notification.title}
                            </p>
                            <p className="text-slate-600 text-sm mt-1">
                              {notification.message}
                            </p>
                            {notification.projectTitle && (
                              <p className="text-xs text-slate-500 mt-1">
                                Proyecto: {notification.projectTitle}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-slate-400">
                                {formatTime(notification.createdAt)}
                              </span>
                              <span className="text-xs text-slate-400">
                                • {notification.senderName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Marcar como leída"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Eliminar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
