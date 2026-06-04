import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    Eye,
    EyeOff,
    Plus,
    Settings,
    Trash2,
    FilePlusCorner
} from 'lucide-react';
import toast from 'react-hot-toast';

import axiosClient from '../../../api/axios';
import InstructorLayout from '../../../layouts/InstructorLayout';

interface Course {
    id: string | number;
    ten_khoa_hoc: string;
    gia: number;
    trang_thai: string;
    hinh_thu_nho?: string;
}

export default function InstructorCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void fetchMyCourses();
    }, []);

    const fetchMyCourses = async () => {
        try {
            const response: any = await axiosClient.get('/courses/my-courses');
            let courseList: Course[] = [];
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

    return (
        <InstructorLayout>
            <div className="space-y-6">

                {/* Header & Nút thêm khóa học */}
                <div className="flex items-center justify-between mb-5">
                    <h1 className="text-[1.8rem] font-bold text-slate-800 m-0">Khóa học của tôi</h1>
                    <Link
                        to="/instructor/courses/new"
                        className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md"
                        style={{ backgroundColor: '#1dbf73' }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#169b5c')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1dbf73')}
                    >
                        <FilePlusCorner size={18} />
                        Thêm khóa học mới
                    </Link>
                </div>

                {/* Card chứa Table */}
                <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            <div className="h-10 bg-slate-100 rounded"></div>
                            <div className="h-10 bg-slate-50 rounded"></div>
                            <div className="h-10 bg-slate-50 rounded"></div>
                        </div>
                    ) : courses.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left mt-2">
                                <thead>
                                    <tr>
                                        <th className="border-b border-slate-200 bg-slate-50/50 p-4 font-bold text-slate-700">Tên khóa học</th>
                                        <th className="border-b border-slate-200 bg-slate-50/50 p-4 font-bold text-slate-700">Giá bán</th>
                                        <th className="border-b border-slate-200 bg-slate-50/50 p-4 font-bold text-slate-700">Trạng thái</th>
                                        <th className="border-b border-slate-200 bg-slate-50/50 p-4 font-bold text-slate-700 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map((course) => (
                                        <tr key={course.id} className="group transition-colors hover:bg-slate-50/70">
                                            <td className="border-b border-slate-100 p-4">
                                                <Link
                                                    to={`/instructor/courses/${course.id}/overview`}
                                                    className="font-bold text-slate-800 transition-colors hover:text-[#1dbf73]"
                                                >
                                                    {course.ten_khoa_hoc}
                                                </Link>
                                            </td>
                                            <td className="border-b border-slate-100 p-4 text-sm font-medium text-slate-600">
                                                {course.gia > 0 ? `${Number(course.gia).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                                            </td>
                                            <td className="border-b border-slate-100 p-4">
                                                <StatusBadge status={course.trang_thai} />
                                            </td>
                                            <td className="border-b border-slate-100 p-4">
                                                <div className="flex justify-end gap-2 opacity-90 transition-opacity group-hover:opacity-100">
                                                    <Link
                                                        to={`/instructor/courses/${course.id}/overview`}
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition-all hover:border-[#1dbf73] hover:bg-[#ebf8f2] hover:text-[#169b5c]"
                                                    >
                                                        <Settings size={14} /> Quản lý
                                                    </Link>

                                                    <button
                                                        onClick={() => void handleToggleStatus(course.id, course.trang_thai)}
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800"
                                                    >
                                                        {course.trang_thai === 'HIDDEN' ? <Eye size={14} /> : <EyeOff size={14} />}
                                                        {course.trang_thai === 'HIDDEN' ? 'Hiện' : 'Ẩn'}
                                                    </button>

                                                    <button
                                                        onClick={() => void handleDelete(course.id)}
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <Trash2 size={14} /> Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                                <BookOpen size={28} />
                            </div>
                            <h2 className="mt-4 text-lg font-bold text-slate-800">Chưa có khóa học nào</h2>
                            <p className="mt-2 text-sm text-slate-500 mb-6">
                                Bạn chưa tạo khóa học nào trên hệ thống. Hãy bắt đầu với một bản nháp mới.
                            </p>

                            <Link
                                to="/instructor/courses/new"
                                className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold text-white transition-colors"
                                style={{ backgroundColor: '#1dbf73' }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#169b5c')}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1dbf73')}
                            >
                                <Plus size={18} />
                                Thêm khóa học mới
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </InstructorLayout>
    );
}

function StatusBadge({ status }: { status: string }) {
    const baseClass = "inline-flex rounded-md px-2.5 py-1 text-xs font-bold border";

    switch (status) {
        case 'PUBLISHED':
            return <span className={`${baseClass} border-emerald-200 bg-emerald-50 text-emerald-700`}>Đã xuất bản</span>;
        case 'PENDING':
            return <span className={`${baseClass} border-amber-200 bg-amber-50 text-amber-700`}>Chờ duyệt</span>;
        case 'HIDDEN':
            return <span className={`${baseClass} border-slate-200 bg-slate-100 text-slate-600`}>Đang ẩn</span>;
        default:
            return <span className={`${baseClass} border-blue-200 bg-blue-50 text-blue-700`}>Bản nháp</span>;
    }
}