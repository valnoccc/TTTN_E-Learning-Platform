import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import axiosClient from '../../../../api/axios';

export interface AdminInstructorDebtItem {
  instructorId: number;
  instructorName: string;
  instructorAvatar: string | null;
  specialty: string | null;
  courseCount: number;
  orderCount: number;
  grossRevenue: number;
  adminRevenue: number;
  instructorPayout: number;
  debtAmount: number;
}

export interface AdminInstructorDebtSummary {
  totalInstructors: number;
  totalCourses: number;
  totalOrders: number;
  grossRevenue: number;
  adminRevenue: number;
  instructorPayout: number;
  topDebtAmount: number;
}

export interface AdminInstructorDebtBoard {
  month: number;
  year: number;
  monthLabel: string;
  summary: AdminInstructorDebtSummary;
  items: AdminInstructorDebtItem[];
}

export function useAdminInstructorDebts() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(currentYear);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [board, setBoard] = useState<AdminInstructorDebtBoard | null>(null);
  const [searchValue, setSearchValue] = useState('');

  const loadBoard = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    try {
      if (mode === 'initial') {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await axiosClient.get(
        `/admin/dashboard/debts?month=${month}&year=${year}`,
      );
      const data = response?.data ?? response;
      setBoard(data as AdminInstructorDebtBoard);
    } catch {
      toast.error('Không thể tải dữ liệu công nợ');
      setBoard(null);
    } finally {
      if (mode === 'initial') {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, [month, year]);

  useEffect(() => {
    void loadBoard('initial');
  }, [loadBoard]);

  const filteredItems = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    const items = board?.items ?? [];

    if (!keyword) {
      return items;
    }

    return items.filter((item) =>
      [item.instructorName, item.specialty]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [board?.items, searchValue]);

  const summary = board?.summary ?? {
    totalInstructors: 0,
    totalCourses: 0,
    totalOrders: 0,
    grossRevenue: 0,
    adminRevenue: 0,
    instructorPayout: 0,
    topDebtAmount: 0,
  };

  const years = useMemo(() => {
    return Array.from({ length: 5 }, (_, index) => currentYear - index);
  }, [currentYear]);

  return {
    board,
    summary,
    loading,
    refreshing,
    month,
    year,
    years,
    searchValue,
    setSearchValue,
    setMonth,
    setYear,
    refetch: () => loadBoard('refresh'),
    filteredItems,
  };
}
