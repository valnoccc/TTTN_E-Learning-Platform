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
      const res = await axiosClient.get<{ message: string; data: Notification[] }>('/notifications');
      setNotifications(res.data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axiosClient.get<{ unreadCount: number }>('/notifications/unread-count');
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await axiosClient.patch(`/notifications/${id}/read`);
      // Update local state instead of refetching to be faster
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
    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
};
