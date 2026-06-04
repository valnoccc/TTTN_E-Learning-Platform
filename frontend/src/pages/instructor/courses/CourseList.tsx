import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    Eye,
    EyeOff,
    Plus,
    Settings,
    Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import axiosClient from '../../../api/axios';
import InstructorLayout from '../../../layouts/InstructorLayout';

interface Course {
    id: string | number;
    ten_khoa_hoc: string;
    gia: number;
    trang_thai: string;
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

                {/* Header & Nút thêm khóa học góc trên cùng */}
                <div className="flex items-center justify-between mb-5">
                    <h1 className="text-[1.8rem] font-bold text-slate-800 m-0">Khóa học của tôi</h1>
                    <Link
                        to="/instructor/courses/new"
                        className="inline-flex items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-bold text-white transition-colors"
                        style={{ backgroundColor: '#1dbf73' }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#169b5c')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1dbf73')}
                    >
                        <Plus size={16} />
                        Thêm khóa học mới
                    </Link>
                </div>

                {/* Card chứa Table danh sách */}
                <div className="rounded-sm border border-slate-300 bg-white p-6">
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
                                        <th className="border-b border-slate-300 bg-slate-50 p-3 font-bold text-slate-800">Tên khóa học</th>
                                        <th className="border-b border-slate-300 bg-slate-50 p-3 font-bold text-slate-800">Giá bán</th>
                                        <th className="border-b border-slate-300 bg-slate-50 p-3 font-bold text-slate-800">Trạng thái</th>
                                        <th className="border-b border-slate-300 bg-slate-50 p-3 font-bold text-slate-800">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map((course) => (
                                        <tr key={course.id} className="hover:bg-[#f9fbfb] transition-colors">
                                            <td className="border-b border-slate-200 p-3">
                                                <Link
                                                    to={`/instructor/courses/${course.id}/overview`}
                                                    className="font-bold text-[#1dbf73] hover:text-[#169b5c] cursor-pointer"
                                                >
                                                    {course.ten_khoa_hoc}
                                                </Link>
                                            </td>
                                            <td className="border-b border-slate-200 p-3 text-sm text-slate-700">
                                                {course.gia > 0 ? `${Number(course.gia).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                                            </td>
                                            <td className="border-b border-slate-200 p-3">
                                                <StatusBadge status={course.trang_thai} />
                                            </td>
                                            <td className="border-b border-slate-200 p-3">
                                                <td className="border-b border-slate-200 p-3">
                                                    <div className="flex gap-2">
                                                        <Link
                                                            to={`/instructor/courses/${course.id}/overview`}
                                                            className="inline-flex items-center gap-1.5 rounded-sm border border-slate-800 bg-transparent px-3 py-1.5 text-sm font-bold !text-slate-800 hover:bg-slate-50 transition"
                                                        >
                                                            <Settings size={14} /> Quản lý
                                                        </Link>

                                                        <button
                                                            onClick={() => void handleToggleStatus(course.id, course.trang_thai)}
                                                            className="inline-flex items-center gap-1.5 rounded-sm border border-slate-800 bg-transparent px-3 py-1.5 text-sm font-bold !text-slate-800 hover:bg-slate-50 transition"
                                                        >
                                                            {course.trang_thai === 'HIDDEN' ? <Eye size={14} /> : <EyeOff size={14} />}
                                                            {course.trang_thai === 'HIDDEN' ? 'Hiện' : 'Ẩn'}
                                                        </button>

                                                        {/* NÚT XÓA: ÉP MÀU ĐỎ BẰNG ! */}
                                                        <button
                                                            onClick={() => void handleDelete(course.id)}
                                                            className="inline-flex items-center gap-1.5 rounded-sm border !border-red-600 bg-transparent px-3 py-1.5 text-sm font-bold !text-red-600 hover:!bg-red-50 transition"
                                                        >
                                                            <Trash2 size={14} /> Xóa
                                                        </button>
                                                    </div>
                                                </td>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-14 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                                <BookOpen size={22} />
                            </div>
                            <h2 className="mt-4 text-lg font-bold text-slate-800">Chưa có khóa học nào</h2>
                            <p className="mt-2 text-sm text-slate-500 mb-5">
                                Bạn chưa tạo khóa học nào trên hệ thống. Hãy bắt đầu với một bản nháp mới.
                            </p>

                            {/* Nút thêm khóa học khi danh sách trống */}
                            <Link
                                to="/instructor/courses/new"
                                className="inline-flex items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-bold text-white transition-colors"
                                style={{ backgroundColor: '#1dbf73' }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#169b5c')}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1dbf73')}
                            >
                                <Plus size={16} />
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
    const baseClass = "inline-flex rounded-sm px-2 py-1 text-xs font-bold border";

    switch (status) {
        case 'PUBLISHED':
            return <span className={`${baseClass} border-green-300 bg-green-50 text-green-700`}>Đã xuất bản</span>;
        case 'PENDING':
            return <span className={`${baseClass} border-yellow-300 bg-yellow-50 text-yellow-700`}>Chờ duyệt</span>;
        case 'HIDDEN':
            return <span className={`${baseClass} border-slate-300 bg-slate-100 text-slate-600`}>Đang ẩn</span>;
        default:
            return <span className={`${baseClass} border-blue-300 bg-blue-50 text-blue-700`}>Bản nháp</span>;
    }
}
