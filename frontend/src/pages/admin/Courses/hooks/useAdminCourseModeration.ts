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
    moderationHistory: AdminModerationHistoryItem[];
}

export function useAdminCourseModeration() {
    const [courses, setCourses] = useState<AdminManagedCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<AdminCourseStatus>('PENDING');
    const [search, setSearch] = useState('');
    const [selectedCourseDetail, setSelectedCourseDetail] = useState<AdminCourseModerationDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

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
                    toast.error('Khong the tai danh sach khoa hoc cho admin.');
                    setCourses([]);
                }
            } finally {
                setLoading(false);
            }
        };

        void fetchCourses();
        return () => controller.abort();
    }, [search, status]);

    const fetchCourseDetail = async (courseId: number) => {
        const response = await axiosClient.get<{ data?: AdminCourseModerationDetail }>(`/admin/courses/${courseId}`);
        return response?.data ?? null;
    };

    const approveCourse = async (courseId: number) => {
        try {
            const response = await axiosClient.patch<{ data?: { trangThai: string } }>(`/admin/courses/${courseId}/approve`);
            const nextStatus = response?.data?.trangThai ?? 'PUBLISHED';
            setCourses((current) =>
                current.map((course) =>
                    course.id === courseId ? { ...course, trangThai: nextStatus } : course,
                ),
            );
            setSelectedCourseDetail((current) =>
                current && current.id === courseId ? { ...current, trangThai: nextStatus } : current,
            );
            if (selectedCourseDetail?.id === courseId) {
                const refreshedDetail = await fetchCourseDetail(courseId);
                setSelectedCourseDetail(refreshedDetail);
            }
            toast.success('Da phe duyet khoa hoc.');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Khong the phe duyet khoa hoc.');
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
            if (selectedCourseDetail?.id === courseId) {
                const refreshedDetail = await fetchCourseDetail(courseId);
                setSelectedCourseDetail(refreshedDetail);
            }
            toast.success('Da tu choi khoa hoc.');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Khong the tu choi khoa hoc.');
            throw error;
        }
    };

    const openCourseDetail = async (courseId: number) => {
        setDetailLoading(true);
        try {
            const detail = await fetchCourseDetail(courseId);
            setSelectedCourseDetail(detail);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Khong the tai chi tiet khoa hoc.');
            setSelectedCourseDetail(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeCourseDetail = () => {
        setSelectedCourseDetail(null);
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
        selectedCourseDetail,
        detailLoading,
        openCourseDetail,
        closeCourseDetail,
    };
}
