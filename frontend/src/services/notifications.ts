import { API_BASE_URL } from './api';

export interface NotificationData {
  type: 'comment' | 'message' | 'grade';
  recipientId: string;
  title: string;
  message: string;
  projectId?: string;
  projectTitle?: string;
  senderId: string;
  senderName: string;
}

export const notificationsService = {
  // Enviar una notificación
  async sendNotification(data: NotificationData) {
    try {
      console.log('📤 Debug: Sending notification:', data);
      console.log('📤 Debug: API URL:', `${API_BASE_URL}/api/v1/notifications`);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('📤 Debug: Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('📤 Debug: Response not ok:', response.status, errorText);
        throw new Error('Error al enviar notificación');
      }

      const result = await response.json();
      console.log('📤 Debug: Notification sent result:', result);
      return result;
    } catch (error) {
      console.error('📤 Debug: Error sending notification:', error);
      throw error;
    }
  },

  // Obtener notificaciones de un usuario
  async getNotifications(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/notifications/${userId}`);
      if (!response.ok) {
        throw new Error('Error al obtener notificaciones');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },

  // Marcar notificación como leída
  async markAsRead(notificationId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error('Error al marcar notificación como leída');
      }
      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Marcar todas las notificaciones como leídas
  async markAllAsRead(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/notifications/${userId}/read-all`, {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error('Error al marcar todas las notificaciones como leídas');
      }
      return await response.json();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Eliminar notificación
  async deleteNotification(notificationId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Error al eliminar notificación');
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Funciones helper para crear notificaciones específicas
  createCommentNotification(recipientId: string, projectId: string, projectTitle: string, senderId: string, senderName: string) {
    return {
      type: 'comment' as const,
      recipientId,
      title: 'Nuevo comentario en tu proyecto',
      message: `${senderName} ha agregado un nuevo comentario en tu proyecto "${projectTitle}"`,
      projectId,
      projectTitle,
      senderId,
      senderName,
    };
  },

  createMessageNotification(recipientId: string, projectId: string, projectTitle: string, senderId: string, senderName: string) {
    return {
      type: 'message' as const,
      recipientId,
      title: 'Nuevo mensaje recibido',
      message: `${senderName} te ha enviado un mensaje sobre tu proyecto "${projectTitle}"`,
      projectId,
      projectTitle,
      senderId,
      senderName,
    };
  },

  createGradeNotification(recipientId: string, projectId: string, projectTitle: string, grade: number, gradeType: string, senderId: string, senderName: string) {
    return {
      type: 'grade' as const,
      recipientId,
      title: 'Calificación actualizada',
      message: `${senderName} ha calificado tu proyecto "${projectTitle}" con ${grade}/20 (${gradeType})`,
      projectId,
      projectTitle,
      senderId,
      senderName,
    };
  },
};
