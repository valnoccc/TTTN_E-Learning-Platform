import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import axiosClient from '../../../../api/axios';

export type AdminUserStatus = 'ALL' | 'ACTIVE' | 'LOCKED' | 'DELETED';
export type AdminUserRole = 'ALL' | 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export interface AdminUserSummary {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  deletedUsers: number;
  admins: number;
  instructors: number;
  students: number;
}

export interface AdminUserRecord {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: Exclude<AdminUserRole, 'ALL'>;
  status: Exclude<AdminUserStatus, 'ALL'>;
  avatar: string | null;
  createdAt: string;
  activeEnrollments: number;
  purchaseCount: number;
  totalSpent: number;
}

interface AdminUsersResponse {
  message?: string;
  data?: AdminUserRecord[];
  summary?: AdminUserSummary;
}

const defaultSummary: AdminUserSummary = {
  totalUsers: 0,
  activeUsers: 0,
  lockedUsers: 0,
  deletedUsers: 0,
  admins: 0,
  instructors: 0,
  students: 0,
};

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [summary, setSummary] = useState<AdminUserSummary>(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<AdminUserRole>('ALL');
  const [status, setStatus] = useState<AdminUserStatus>('ALL');

  const loadUsers = useCallback(
    async (signal?: AbortSignal) => {
    setLoading(true);

    try {
      const response = await axiosClient.get<AdminUsersResponse>('/admin/users', {
        params: {
          search: search.trim() || undefined,
          role: role !== 'ALL' ? role : undefined,
          status: status !== 'ALL' ? status : undefined,
        },
        signal,
      } as any);

      setUsers(Array.isArray(response?.data) ? response.data : []);
      setSummary(response?.summary ?? defaultSummary);
    } catch (error: any) {
      if (error?.name !== 'CanceledError' && error?.code !== 'ERR_CANCELED') {
        toast.error('Không thể tải danh sách người dùng.');
        setUsers([]);
        setSummary(defaultSummary);
      }
    } finally {
      setLoading(false);
    }
    },
    [role, search, status],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadUsers(controller.signal);
    return () => controller.abort();
  }, [loadUsers]);

  const updateUserStatus = async (userId: number, nextStatus: Exclude<AdminUserStatus, 'ALL'>) => {
    try {
      await axiosClient.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      toast.success('Đã cập nhật trạng thái người dùng.');
      await loadUsers();
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật trạng thái.');
      return false;
    }
  };

  const updateUserRole = async (userId: number, nextRole: Exclude<AdminUserRole, 'ALL'>) => {
    try {
      await axiosClient.patch(`/admin/users/${userId}/role`, { role: nextRole });
      toast.success('Đã cập nhật vai trò người dùng.');
      await loadUsers();
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật vai trò.');
      return false;
    }
  };

  return {
    users,
    summary,
    loading,
    search,
    setSearch,
    role,
    setRole,
    status,
    setStatus,
    reload: loadUsers,
    updateUserStatus,
    updateUserRole,
  };
}
