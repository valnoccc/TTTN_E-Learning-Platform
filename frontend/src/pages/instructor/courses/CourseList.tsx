import { Link } from 'react-router-dom';
import {
    BookOpen,
    Eye,
    EyeOff,
    Plus,
    Settings,
    Trash2,
    FilePlusCorner,
} from 'lucide-react';

import InstructorLayout from '../../../layouts/InstructorLayout';
import { useCourseList } from './hooks/useCourseList';

export default function InstructorCourses() {
    const { courses, loading, handleDelete, handleToggleStatus } = useCourseList();

    return (
        <InstructorLayout>
            <div className="space-y-6">
                <div className="mb-5 flex items-center justify-between">
                    <h1 className="m-0 text-[1.8rem] font-bold text-slate-800">Khóa học của tôi</h1>
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

                <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            <div className="h-10 rounded bg-slate-100"></div>
                            <div className="h-10 rounded bg-slate-50"></div>
                            <div className="h-10 rounded bg-slate-50"></div>
                        </div>
                    ) : courses.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="mt-2 w-full border-collapse text-left">
                                <thead>
                                    <tr>
                                        <th className="border-b border-slate-200 bg-slate-50/50 p-4 font-bold text-slate-700">
                                            Tên khóa học
                                        </th>
                                        <th className="border-b border-slate-200 bg-slate-50/50 p-4 font-bold text-slate-700">
                                            Giá bán
                                        </th>
                                        <th className="border-b border-slate-200 bg-slate-50/50 p-4 font-bold text-slate-700">
                                            Trạng thái
                                        </th>
                                        <th className="border-b border-slate-200 bg-slate-50/50 p-4 font-bold text-slate-700 text-right">
                                            Thao tác
                                        </th>
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
                                                {course.gia > 0
                                                    ? `${Number(course.gia).toLocaleString('vi-VN')} đ`
                                                    : 'Miễn phí'}
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
                            <p className="mb-6 mt-2 text-sm text-slate-500">
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
    const baseClass = 'inline-flex rounded-md border px-2.5 py-1 text-xs font-bold';

    switch (status) {
        case 'PUBLISHED':
            return (
                <span className={`${baseClass} border-emerald-200 bg-emerald-50 text-emerald-700`}>
                    Đã xuất bản
                </span>
            );
        case 'PENDING':
            return (
                <span className={`${baseClass} border-amber-200 bg-amber-50 text-amber-700`}>
                    Chờ duyệt
                </span>
            );
        case 'HIDDEN':
            return (
                <span className={`${baseClass} border-slate-200 bg-slate-100 text-slate-600`}>
                    Đang ẩn
                </span>
            );
        default:
            return (
                <span className={`${baseClass} border-blue-200 bg-blue-50 text-blue-700`}>
                    Bản nháp
                </span>
            );
    }
}
