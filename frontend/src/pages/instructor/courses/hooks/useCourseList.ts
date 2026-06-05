import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import axiosClient from '../../../../api/axios';

export interface CourseListItem {
    id: string | number;
    ten_khoa_hoc: string;
    gia: number;
    trang_thai: string;
    hinh_thu_nho?: string;
}

export function useCourseList() {
    const [courses, setCourses] = useState<CourseListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyCourses = async () => {
            try {
                const response = await axiosClient.get<any>('/courses/my-courses');
                let courseList: CourseListItem[] = [];

                if (response?.data?.data && Array.isArray(response.data.data)) {
                    courseList = response.data.data;
                } else if (Array.isArray(response?.data)) {
                    courseList = response.data;
                }

                setCourses(courseList);
            } catch {
                toast.error('Không thể tải danh sách khóa học!');
                setCourses([]);
            } finally {
                setLoading(false);
            }
        };

        void fetchMyCourses();
    }, []);

    const handleDelete = async (courseId: string | number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa khóa học này?')) {
            return;
        }

        try {
            await axiosClient.delete(`/courses/${courseId}`);
            setCourses((current) => current.filter((course) => course.id !== courseId));
            toast.success('Đã xử lý thành công!');
        } catch {
            toast.error('Lỗi: Không thể thực hiện yêu cầu!');
        }
    };

    const handleToggleStatus = async (courseId: string | number, currentStatus: string) => {
        const nextStatus = currentStatus === 'HIDDEN' ? 'DRAFT' : 'HIDDEN';
        const confirmMessage =
            nextStatus === 'HIDDEN'
                ? 'Ẩn khóa học này khỏi giao diện học viên?'
                : 'Hiển thị lại khóa học trong danh sách quản lý?';

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            await axiosClient.patch(`/courses/${courseId}/status`, { trang_thai: nextStatus });
            setCourses((current) =>
                current.map((course) =>
                    course.id === courseId ? { ...course, trang_thai: nextStatus } : course,
                ),
            );
            toast.success('Đã cập nhật trạng thái!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
        }
    };

    return {
        courses,
        loading,
        handleDelete,
        handleToggleStatus,
    };
}
