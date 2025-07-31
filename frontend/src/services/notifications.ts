import api from '../lib/api';
import { Notification } from '../types';

export const notificationsService = {
  async getNotifications(unread?: boolean): Promise<Notification[]> {
    const params = unread ? '?unread=true' : '';
    const response = await api.get(`/notifications${params}`);
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/count');
    return response.data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },
};
