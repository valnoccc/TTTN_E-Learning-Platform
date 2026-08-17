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

    const handleDelete = async (courseId: string | number) => {        try {
            const response = await axiosClient.delete<{ action?: string; message?: string }>(`/courses/${courseId}`);
            if (response?.action === 'ARCHIVED') {
                setCourses((current) => current.map((course) =>
                    course.id === courseId ? { ...course, trang_thai: 'ARCHIVED' } : course,
                ));
                toast.success(response.message || 'Khóa học đã được lưu trữ vì đã có học viên mua.');
                return;
            }
            setCourses((current) => current.filter((course) => course.id !== courseId));
            toast.success('Đã xử lý thành công!');
        } catch {
            toast.error('Lỗi: Không thể thực hiện yêu cầu!');
        }
    };

    const handleToggleStatus = async (courseId: string | number, currentStatus: string) => {
        const nextStatus = currentStatus === 'PUBLISHED' ? 'UNLISTED' : 'DRAFT';

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

    const handleArchive = async (courseId: string | number) => {
        try {
            await axiosClient.patch(`/courses/${courseId}/status`, { trang_thai: 'ARCHIVED' });
            setCourses((current) =>
                current.map((course) =>
                    course.id === courseId ? { ...course, trang_thai: 'ARCHIVED' } : course,
                ),
            );
            toast.success('Đã lưu trữ: khóa học không bán mới, học viên đã mua vẫn được học và giảng viên có thể chỉnh sửa.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi lưu trữ khóa học');
        }
    };

    return {
        courses,
        loading,
        handleDelete,
        handleToggleStatus,
        handleArchive,
    };
}
