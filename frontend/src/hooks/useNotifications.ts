import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axios';

export interface Notification {
  maTB: number;
  maND: number;
  loaiThongBao: string;
  tieuDe: string;
  noiDung: string;
  daDoc: boolean;
  thoiGian: string;
  maNguoiGui: number | null;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('access_token') || JSON.parse(localStorage.getItem('user') || '{}').token;
      if (token) {
        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        // Không có token thì không gọi API
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const res: any = await axiosClient.get('/notifications');
      const notificationData = res.data?.data || res.data || res || [];
      const list = Array.isArray(notificationData) ? notificationData : [];
      setNotifications(list);
      setUnreadCount(list.filter((n: Notification) => !n.daDoc).length);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Token hết hạn - không spam lỗi
        setNotifications([]);
        setUnreadCount(0);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch notifications');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await axiosClient.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.maTB === id ? { ...n, daDoc: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosClient.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, daDoc: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  useEffect(() => {
    // Fetch lần đầu
    fetchNotifications();

    // Polling mỗi 15 giây
    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    // Lắng nghe custom event để refresh tức thì khi có thông báo mới
    const handleRefresh = () => {
      fetchNotifications();
    };
    window.addEventListener('notification-refresh', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-refresh', handleRefresh);
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};