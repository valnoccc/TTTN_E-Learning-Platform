import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import axiosClient from '../../../../api/axios';

export type AdminCourseStatus = 'ALL' | 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'BANNED';

export interface AdminManagedCourse {
    id: number;
    tenKhoaHoc: string;
    giaBan: number;
    trangThai: string;
    hinhThuNho: string | null;
    moTa: string;
    instructorId: number;
    instructorName: string;
    instructorEmail: string;
    instructorAvatar: string | null;
    categoryName: string;
    lessonCount: number;
    orderCount: number;
}

export interface AdminModerationLesson {
    maBH: number;
    tenBaiHoc: string;
    thuTu: number;
    noiDung: string;
    videoURL: string | null;
    trangThai: string;
    aiStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
    aiLabels: string[];
    aiRejectReason: string | null;
}

export interface AdminModerationChapter {
    maChuong: number;
    tenChuong: string;
    thuTu: number;
    baiHocs: AdminModerationLesson[];
}

export interface AdminModerationHistoryItem {
    maLSKD: number;
    hanhDong: string;
    ghiChu: string | null;
    thoiGian: string;
    adminId: number;
    adminName: string;
}

export interface AdminCourseReview {
    reviewId: number;
    rating: number | null;
    content: string;
    createdAt: string;
    parentId: number | null;
    userId: number;
    userName: string;
    userAvatar: string | null;
}

export interface AdminCourseModerationDetail {
    id: number;
    tenKhoaHoc: string;
    moTa: string;
    giaBan: number;
    trangThai: string;
    hinhThuNho: string | null;
    maDM: number;
    instructorId: number;
    mucTieu: string[];
    yeuCau: string[];
    curriculum: AdminModerationChapter[];
    reviews: AdminCourseReview[];
    moderationHistory: AdminModerationHistoryItem[];
}

export async function fetchAdminCourseModerationDetail(courseId: number) {
    const response = await axiosClient.get<{ data?: AdminCourseModerationDetail }>(`/admin/courses/${courseId}`);
    return response?.data ?? null;
}

export function useAdminCourseModeration() {
    const [courses, setCourses] = useState<AdminManagedCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<AdminCourseStatus>('PENDING');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        const fetchCourses = async () => {
            setLoading(true);
            try {
                const response = await axiosClient.get<{ data?: AdminManagedCourse[] }>('/admin/courses', {
                    params: { status, search: search.trim() || undefined },
                    signal: controller.signal,
                } as any);
                setCourses(Array.isArray(response?.data) ? response.data : []);
            } catch (error: any) {
                if (error?.name !== 'CanceledError' && error?.code !== 'ERR_CANCELED') {
                    toast.error('Không thể tải danh sách khóa học cho admin.');
                    setCourses([]);
                }
            } finally {
                setLoading(false);
            }
        };

        void fetchCourses();
        return () => controller.abort();
    }, [search, status]);

    const approveCourse = async (courseId: number) => {
        try {
            const response = await axiosClient.patch<{ data?: { trangThai: string } }>(`/admin/courses/${courseId}/approve`);
            const nextStatus = response?.data?.trangThai ?? 'PUBLISHED';
            setCourses((current) =>
                current.map((course) =>
                    course.id === courseId ? { ...course, trangThai: nextStatus } : course,
                ),
            );
            toast.success('Đã phê duyệt khóa học.');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể phê duyệt khóa học.');
        }
    };

    const rejectCourse = async (courseId: number, lyDo: string) => {
        try {
            const response = await axiosClient.patch<{ data?: { trangThai: string } }>(
                `/admin/courses/${courseId}/reject`,
                { lyDo },
            );
            const nextStatus = response?.data?.trangThai ?? 'DRAFT';
            setCourses((current) =>
                current.map((course) =>
                    course.id === courseId ? { ...course, trangThai: nextStatus } : course,
                ),
            );
            toast.success('Đã từ chối khóa học.');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể từ chối khóa học.');
            throw error;
        }
    };

    return {
        courses,
        loading,
        search,
        setSearch,
        status,
        setStatus,
        approveCourse,
        rejectCourse,
    };
}
