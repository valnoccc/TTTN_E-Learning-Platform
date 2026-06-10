import { useState, useEffect } from 'react';
import axiosClient from '../../../../api/axios';
import { toast } from 'react-hot-toast';

export interface RevenueChartData {
    thang: number;
    nam: number;
    doanhThu: number;
}

export interface SalesOverview {
    orders: number;
    earnings: number;
    refunds: number;
}

export interface SalesChartData {
    label: string;
    orders: number;
    earnings: number;
    refunds: number;
}

export interface RecentOrder {
    orderId: number;
    customerName: string;
    totalAmount: number;
    paidAt: string;
    paymentMethod: string;
}

export interface TopCourse {
    id: number | string;
    name: string;
    date: string;
    price: number;
    orders: number;
    revenue: number;
    image: string;
}

export interface TopInstructor {
    id: number | string;
    name: string;
    category: string;
    students: number;
    revenue: number;
    percentage: number;
    avatar: string;
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
    salesOverview: SalesOverview;
    salesChart: SalesChartData[];
    topCourses: TopCourse[];
    topInstructors: TopInstructor[];
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
                toast.error('Lỗi khi tải dữ liệu!');
            } finally {
                setLoading(false);
            }
        };

        void fetchStats();
    }, []);

    return { stats, loading };
}
