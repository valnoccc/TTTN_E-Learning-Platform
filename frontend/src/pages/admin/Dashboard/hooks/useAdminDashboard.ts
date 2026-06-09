import { useState, useEffect } from 'react';
import axiosClient from '../../../../api/axios';
import { toast } from 'react-hot-toast';

export interface RevenueChartData {
    thang: number;
    nam: number;
    doanhThu: number;
}

export interface RecentOrder {
    orderId: number;
    customerName: string;
    totalAmount: number;
    paidAt: string;
    paymentMethod: string;
}

export interface DashboardStats {
    totalStudents: number;
    studentGrowth: number;
    totalInstructors: number;
    instructorGrowth: number;
    totalCourses: number;
    courseGrowth: number;
    totalRevenue: number;
    revenueGrowth: number;
    recentOrders: RecentOrder[];
    revenueChart: RevenueChartData[];
}

export function useAdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const response = await axiosClient.get<DashboardStats>('/admin/dashboard/stats');
                setStats(response as any);
            } catch (error) {
                toast.error('Không thể tải dữ liệu thống kê tổng quan!');
            } finally {
                setLoading(false);
            }
        };

        void fetchStats();
    }, []);

    return { stats, loading };
}