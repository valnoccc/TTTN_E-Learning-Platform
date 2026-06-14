import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    CheckCircle2,
    XCircle,
    BookOpen,
    Filter,
    Mail,
    Layers3,
    Eye,
} from 'lucide-react';

import AdminLayout from '../../../layouts/AdminLayout';
import {
    useAdminCourseModeration,
    type AdminCourseStatus,
} from './hooks/useAdminCourseModeration';

const statusOptions: { value: AdminCourseStatus; label: string }[] = [
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'ALL', label: 'Tất cả' },
    { value: 'DRAFT', label: 'Bản nháp' },
    { value: 'PUBLISHED', label: 'Đã xuất bản' },
    { value: 'BANNED', label: 'Đã ban' },
];

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function AdminCourseModeration() {
    const {
        courses,
        loading,
        search,
        setSearch,
        status,
        setStatus,
        approveCourse,
        rejectCourse,
    } = useAdminCourseModeration();

    const navigate = useNavigate();
    const [rejectingCourseId, setRejectingCourseId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const selectedCourse = courses.find((course) => course.id === rejectingCourseId) ?? null;

    const handleOpenReject = (courseId: number) => {
        setRejectingCourseId(courseId);
        setRejectReason('');
    };

    const handleConfirmReject = async () => {
        if (!selectedCourse) {
            return;
        }

        await rejectCourse(selectedCourse.id, rejectReason);
        setRejectingCourseId(null);
        setRejectReason('');
    };

    function getStatusDisplay(status: string) {
        switch (status) {
            case 'PENDING':
                return {
                    label: 'Chờ duyệt',
                    className: 'bg-amber-50 text-amber-600 border-amber-200'
                };
            case 'PUBLISHED':
                return {
                    label: 'Xuất bản',
                    className: 'bg-emerald-50 text-emerald-600 border-emerald-200'
                };
            case 'DRAFT':
                return {
                    label: 'Nháp',
                    className: 'bg-slate-50 text-slate-600 border-slate-200'
                };
            default:
                return {
                    label: status,
                    className: 'bg-slate-50 text-slate-600 border-slate-200'
                };
        }
    }

    return (
        <AdminLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        {/* <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                            <Layers3 size={14} />
                            Quản lý khóa học
                        </div> */}
                        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                            Phê duyệt khóa học
                        </h1>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <label className="relative block w-full sm:w-[260px]">
                            <Search
                                size={16}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Tìm kiếm khóa học..."
                                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-[14px] text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </label>

                        <label className="relative block w-full sm:w-[180px]">
                            <Filter
                                size={16}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value as AdminCourseStatus)}
                                className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-[14px] font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                <div className="flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 p-5">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-500" />
                            <h2 className="text-[16px] font-semibold text-slate-800">Danh sách cần xử lý</h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-4 p-6">
                            {[...Array(5)].map((_, index) => (
                                <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-50" />
                            ))}
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="px-6 py-20 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                                <BookOpen size={28} strokeWidth={1.5} />
                            </div>
                            <h3 className="mt-4 text-[16px] font-semibold text-slate-800">Không có khóa học nào</h3>
                            <p className="mt-2 text-[14px] text-slate-500">
                                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem thêm dữ liệu.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-fixed text-left"> {/* Thêm table-fixed vào đây */}
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        {/* Thiết lập width cụ thể cho từng cột để cân đối không gian */}
                                        <th className="w-[35%] px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Khóa học</th>
                                        <th className="w-[25%] px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Giảng viên</th>
                                        <th className="w-[15%] px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Chi tiết</th>
                                        <th className="w-[10%] px-6 py-4 text-center text-[12px] font-bold uppercase tracking-wider text-slate-500">Chi tiết</th>
                                        <th className="w-[15%] px-6 py-4 text-center text-[12px] font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map((course) => (
                                        <tr
                                            key={course.id}
                                            className="border-t border-slate-100 align-top transition hover:bg-slate-50/60"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-start gap-4">
                                                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                                        {course.hinhThuNho ? (
                                                            <img
                                                                src={course.hinhThuNho}
                                                                alt={course.tenKhoaHoc}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : null}
                                                    </div>
                                                    {/* min-w-0 giúp text truncate hoạt động đúng trong flexbox */}
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="truncate text-[14px] font-semibold text-slate-800">
                                                            {course.tenKhoaHoc}
                                                        </h3>
                                                        <p className="mt-1 truncate text-[13px] text-slate-500">
                                                            {course.moTa || 'Chưa có mô tả khóa học.'}
                                                        </p>
                                                        <p className="mt-1.5 text-[12px] font-medium text-slate-400">
                                                            {course.lessonCount} bài
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                                                        {course.instructorAvatar ? (
                                                            <img
                                                                src={course.instructorAvatar}
                                                                alt={course.instructorName}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : null}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-[14px] font-semibold text-slate-800">
                                                            {course.instructorName}
                                                        </p>
                                                        <p className="mt-0.5 flex items-center gap-1 text-[13px] text-slate-500">
                                                            <Mail size={12} className="shrink-0" />
                                                            <span className="truncate">{course.instructorEmail}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 align-middle">
                                                <p className="text-[14px] font-semibold text-slate-800">
                                                    {formatCurrency(course.giaBan)}
                                                </p>
                                                <div className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-500">
                                                    {/* Đã thêm truncate cho categoryName để tránh tràn chữ */}
                                                    <span className="truncate block max-w-[90px]" title={course.categoryName}>
                                                        {course.categoryName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 align-middle text-center">
                                                <button
                                                    onClick={() => navigate(`/admin/courses/${course.id}`)}
                                                    // Thêm whitespace-nowrap để chữ không bị rớt dòng, giảm padding (px-3 py-1.5) và text-[12px]
                                                    className="whitespace-nowrap rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-blue-700 active:bg-blue-800"
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </td>
                                            {/* Thêm px-6, py-5 và align-middle để đồng bộ chiều cao và căn giữa dọc với các cột khác */}
                                            <td className="px-6 py-5 align-middle text-center">
                                                {(() => {
                                                    const statusDisplay = getStatusDisplay(course.trangThai);
                                                    return (
                                                        <span
                                                            className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[12px] font-semibold ${statusDisplay.className}`}
                                                        >
                                                            {statusDisplay.label}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {selectedCourse ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm transition-all">
                    <div className="w-full max-w-lg rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                                <XCircle size={20} />
                            </div>
                            <h2 className="text-[18px] font-bold text-slate-900">Từ chối khóa học</h2>
                        </div>
                        <p className="mt-3 text-[14px] leading-relaxed text-slate-500">
                            Nhập lý do từ chối để giảng viên biết lỗi, tiến hành chỉnh sửa và gửi
                            duyệt lại.
                        </p>

                        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-[13px] text-slate-700">
                            <span className="font-semibold text-slate-900">Khóa học:</span> {selectedCourse.tenKhoaHoc}
                        </div>

                        <textarea
                            value={rejectReason}
                            onChange={(event) => setRejectReason(event.target.value)}
                            placeholder="Ví dụ: Nội dung khóa học chưa đầy đủ, ảnh thu nhỏ chưa đạt chuẩn, cần bổ sung bài học..."
                            className="mt-4 min-h-[120px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-700 shadow-sm outline-none transition focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                        />

                        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                            <button
                                onClick={() => {
                                    setRejectingCourseId(null);
                                    setRejectReason('');
                                }}
                                className="rounded-xl px-4 py-2 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => void handleConfirmReject()}
                                disabled={!rejectReason.trim()}
                                className="rounded-xl bg-rose-600 px-5 py-2 text-[14px] font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Xác nhận từ chối
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </AdminLayout>
    );
}
