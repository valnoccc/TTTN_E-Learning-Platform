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
    grossRevenue: number;
    adminRevenue: number;
    instructorPayout: number;
    refunds: number;
}

export interface RevenueCategory {
    id: number;
    name: string;
    revenue: number;
    adminRevenue: number;
    instructorPayout: number;
}

export interface SalesChartData {
    label: string;
    orders: number;
    earnings: number;
    grossRevenue: number;
    adminRevenue: number;
    instructorPayout: number;
    refunds: number;
}

export interface RecentOrder {
    orderId: number;
    customerName: string;
    courseName: string;
    totalAmount: number;
    paidAt: string;
    paymentMethod: string;
    paymentStatus: string;
}

export interface TopCourse {
    id: number | string;
    name: string;
    date: string;
    price: number;
    orders: number;
    revenue: number;
    adminRevenue: number;
    instructorRevenue: number;
    image: string;
}

export interface TopInstructor {
    id: number | string;
    name: string;
    category: string;
    students: number;
    revenue: number;
    grossRevenue: number;
    adminRevenue: number;
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
    pendingCourses: number;
    pendingCourseGrowth: number;
    newEnrollments: number;
    newEnrollmentGrowth: number;
    totalRevenue: number;
    grossRevenue: number;
    adminRevenue: number;
    instructorPayout: number;
    revenueGrowth: number;
    aiQuota: {
        monthYear: string;
        usedSeconds: number;
        usedMinutes: number;
        limitMinutes: number;
        remainingMinutes: number;
        percentUsed: number;
        isWarning: boolean;
        isExceeded: boolean;
    };
    storageQuota: {
        monthYear: string;
        usedBytes: number;
        usedMegabytes: number;
        limitMegabytes: number;
        remainingMegabytes: number;
        percentUsed: number;
        isWarning: boolean;
        isExceeded: boolean;
    };
    recentOrders: RecentOrder[];
    revenueChart: RevenueChartData[];
    salesOverview: SalesOverview;
    salesChart: SalesChartData[];
    topCourses: TopCourse[];
    topInstructors: TopInstructor[];
    categoryRevenue: RevenueCategory[];
}

export type DashboardFilter =
    | { type: 'days'; days: number }
    | { type: 'month'; month: number; year: number };

export function useAdminDashboard(filter: DashboardFilter = { type: 'days', days: 30 }) {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const params =
                    filter.type === 'month'
                        ? { month: filter.month, year: filter.year }
                        : { days: filter.days };
                const response = await axiosClient.get<DashboardStats>('/admin/dashboard/stats', { params });
                setStats((response as any)?.data ?? response);
            } catch (error) {
                toast.error('Lỗi khi tải dữ liệu!');
            } finally {
                setLoading(false);
            }
        };

        void fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter.type === 'days' ? filter.days : `${(filter as any).month}-${(filter as any).year}`]);

    return { stats, loading };
}
