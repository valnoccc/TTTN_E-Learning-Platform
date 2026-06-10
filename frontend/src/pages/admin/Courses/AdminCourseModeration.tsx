import { useState } from 'react';
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
    { value: 'PENDING', label: 'Cho duyet' },
    { value: 'ALL', label: 'Tat ca' },
    { value: 'DRAFT', label: 'Ban nhap' },
    { value: 'PUBLISHED', label: 'Da xuat ban' },
    { value: 'BANNED', label: 'Da tu choi' },
];

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(date);
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        PENDING: 'border-amber-400 bg-white text-amber-600',
        PUBLISHED: 'border-emerald-400 bg-white text-emerald-600',
        BANNED: 'border-rose-400 bg-white text-rose-600',
        DRAFT: 'border-slate-300 bg-white text-slate-600',
    };

    const labels: Record<string, string> = {
        PENDING: 'Cho duyet',
        PUBLISHED: 'Da xuat ban',
        BANNED: 'Da tu choi',
        DRAFT: 'Ban nhap',
    };

    return (
        <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide shadow-sm ${map[status] ?? map.DRAFT}`}>
            {labels[status] ?? status}
        </span>
    );
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
        selectedCourseDetail,
        detailLoading,
        openCourseDetail,
        closeCourseDetail,
    } = useAdminCourseModeration();

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

    return (
        <AdminLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                            <Layers3 size={14} />
                            Quan ly khoa hoc
                        </div>
                        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                            Phe duyet khoa hoc
                        </h1>
                        <p className="mt-2 max-w-2xl text-[14px] text-slate-500">
                            Xem chi tiet noi dung khoa hoc, lich su kiem duyet va xu ly phe duyet
                            cho cac khoa hoc giang vien gui len he thong.
                        </p>
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
                                placeholder="Tim kiem khoa hoc..."
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
                            <h2 className="text-[16px] font-semibold text-slate-800">Danh sach can xu ly</h2>
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
                            <h3 className="mt-4 text-[16px] font-semibold text-slate-800">Khong co khoa hoc nao</h3>
                            <p className="mt-2 text-[14px] text-slate-500">
                                Thu thay doi bo loc hoac tu khoa tim kiem de xem them du lieu.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Khoa hoc</th>
                                        <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Giang vien</th>
                                        <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Chi tiet</th>
                                        <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Trang thai</th>
                                        <th className="px-6 py-4 text-center text-[12px] font-bold uppercase tracking-wider text-slate-500">Thao tac</th>
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
                                                    <div className="min-w-[240px]">
                                                        <h3 className="line-clamp-1 text-[14px] font-semibold text-slate-800">
                                                            {course.tenKhoaHoc}
                                                        </h3>
                                                        <p className="mt-1 line-clamp-1 text-[13px] text-slate-500">
                                                            {course.moTa || 'Chua co mo ta khoa hoc.'}
                                                        </p>
                                                        <div className="mt-1.5 flex items-center gap-3">
                                                            <p className="text-[12px] font-medium text-slate-400">
                                                                Da ban: {course.orderCount.toLocaleString('vi-VN')}
                                                            </p>
                                                            <button
                                                                onClick={() => void openCourseDetail(course.id)}
                                                                className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 transition hover:text-blue-700"
                                                            >
                                                                <Eye size={13} />
                                                                Xem chi tiet
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex min-w-[200px] items-center gap-3">
                                                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                                                        {course.instructorAvatar ? (
                                                            <img
                                                                src={course.instructorAvatar}
                                                                alt={course.instructorName}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : null}
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-semibold text-slate-800">
                                                            {course.instructorName}
                                                        </p>
                                                        <p className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-slate-500">
                                                            <Mail size={12} />
                                                            {course.instructorEmail}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 align-middle">
                                                <p className="text-[14px] font-semibold text-slate-800">
                                                    {formatCurrency(course.giaBan)}
                                                </p>
                                                <div className="mt-1 flex items-center gap-2 text-[13px] text-slate-500">
                                                    <span className="max-w-[120px] truncate">{course.categoryName}</span>
                                                    <span>•</span>
                                                    <span>{course.lessonCount} bai</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 align-middle">
                                                <StatusBadge status={course.trangThai} />
                                            </td>
                                            <td className="px-6 py-5 align-middle">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        disabled={course.trangThai !== 'PENDING'}
                                                        onClick={() => void approveCourse(course.id)}
                                                        className="inline-flex h-[38px] w-24 items-center justify-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-[13px] font-semibold text-teal-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        <CheckCircle2 size={16} strokeWidth={2.5} />
                                                        Duyet
                                                    </button>
                                                    <button
                                                        disabled={course.trangThai !== 'PENDING'}
                                                        onClick={() => handleOpenReject(course.id)}
                                                        className="inline-flex h-[38px] w-24 items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 text-[13px] font-semibold leading-tight text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        <XCircle size={16} strokeWidth={2.5} />
                                                        <span className="text-left leading-4">Tu choi</span>
                                                    </button>
                                                </div>
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
                            <h2 className="text-[18px] font-bold text-slate-900">Tu choi khoa hoc</h2>
                        </div>
                        <p className="mt-3 text-[14px] leading-relaxed text-slate-500">
                            Nhap ly do tu choi de giang vien biet loi, tien hanh chinh sua va gui
                            duyet lai.
                        </p>

                        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-[13px] text-slate-700">
                            <span className="font-semibold text-slate-900">Khoa hoc:</span> {selectedCourse.tenKhoaHoc}
                        </div>

                        <textarea
                            value={rejectReason}
                            onChange={(event) => setRejectReason(event.target.value)}
                            placeholder="Vi du: Noi dung khoa hoc chua day du, anh thu nho chua dat chuan, can bo sung bai hoc..."
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
                                Huy
                            </button>
                            <button
                                onClick={() => void handleConfirmReject()}
                                disabled={!rejectReason.trim()}
                                className="rounded-xl bg-rose-600 px-5 py-2 text-[14px] font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Xac nhan tu choi
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {selectedCourseDetail || detailLoading ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
                    <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-[18px] font-bold text-slate-900">Chi tiet kiem duyet khoa hoc</h2>
                                <p className="mt-1 text-[13px] text-slate-500">
                                    Xem noi dung, chuong trinh hoc va lich su kiem duyet truoc khi
                                    ra quyet dinh.
                                </p>
                            </div>
                            <button
                                onClick={closeCourseDetail}
                                className="rounded-xl px-4 py-2 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                                Dong
                            </button>
                        </div>

                        {detailLoading || !selectedCourseDetail ? (
                            <div className="space-y-4 p-6">
                                {[...Array(4)].map((_, index) => (
                                    <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-50" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid gap-6 overflow-y-auto p-6 lg:grid-cols-[1.25fr,0.9fr]">
                                <div className="space-y-6">
                                    <section className="rounded-[24px] border border-slate-200 bg-white p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                                                {selectedCourseDetail.hinhThuNho ? (
                                                    <img
                                                        src={selectedCourseDetail.hinhThuNho}
                                                        alt={selectedCourseDetail.tenKhoaHoc}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : null}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h3 className="text-[20px] font-bold text-slate-900">
                                                        {selectedCourseDetail.tenKhoaHoc}
                                                    </h3>
                                                    <StatusBadge status={selectedCourseDetail.trangThai} />
                                                </div>
                                                <p className="mt-3 text-[14px] leading-7 text-slate-600">
                                                    {selectedCourseDetail.moTa || 'Chua co mo ta khoa hoc.'}
                                                </p>
                                                <div className="mt-4 flex flex-wrap gap-3 text-[13px] text-slate-500">
                                                    <span className="rounded-full bg-slate-50 px-3 py-1 font-medium text-slate-600">
                                                        Gia: {formatCurrency(selectedCourseDetail.giaBan)}
                                                    </span>
                                                    <span className="rounded-full bg-slate-50 px-3 py-1 font-medium text-slate-600">
                                                        Muc tieu: {selectedCourseDetail.mucTieu.length}
                                                    </span>
                                                    <span className="rounded-full bg-slate-50 px-3 py-1 font-medium text-slate-600">
                                                        Yeu cau: {selectedCourseDetail.yeuCau.length}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="grid gap-6 md:grid-cols-2">
                                        <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                                            <h4 className="text-[15px] font-bold text-slate-900">Muc tieu khoa hoc</h4>
                                            <ul className="mt-4 space-y-3">
                                                {selectedCourseDetail.mucTieu.length === 0 ? (
                                                    <li className="text-[14px] text-slate-500">Chua co muc tieu.</li>
                                                ) : (
                                                    selectedCourseDetail.mucTieu.map((item, index) => (
                                                        <li
                                                            key={`${index}-${item}`}
                                                            className="rounded-2xl bg-slate-50 px-4 py-3 text-[14px] text-slate-700"
                                                        >
                                                            {item}
                                                        </li>
                                                    ))
                                                )}
                                            </ul>
                                        </div>

                                        <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                                            <h4 className="text-[15px] font-bold text-slate-900">Yeu cau dau vao</h4>
                                            <ul className="mt-4 space-y-3">
                                                {selectedCourseDetail.yeuCau.length === 0 ? (
                                                    <li className="text-[14px] text-slate-500">Chua co yeu cau.</li>
                                                ) : (
                                                    selectedCourseDetail.yeuCau.map((item, index) => (
                                                        <li
                                                            key={`${index}-${item}`}
                                                            className="rounded-2xl bg-slate-50 px-4 py-3 text-[14px] text-slate-700"
                                                        >
                                                            {item}
                                                        </li>
                                                    ))
                                                )}
                                            </ul>
                                        </div>
                                    </section>

                                    <section className="rounded-[24px] border border-slate-200 bg-white p-5">
                                        <h4 className="text-[15px] font-bold text-slate-900">Noi dung khoa hoc</h4>
                                        <div className="mt-4 space-y-4">
                                            {selectedCourseDetail.curriculum.length === 0 ? (
                                                <p className="text-[14px] text-slate-500">Chua co chuong hoc nao.</p>
                                            ) : (
                                                selectedCourseDetail.curriculum.map((chapter) => (
                                                    <div
                                                        key={chapter.maChuong}
                                                        className="rounded-[20px] border border-slate-100 bg-slate-50 p-4"
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <h5 className="text-[14px] font-bold text-slate-800">
                                                                Chuong {chapter.thuTu}: {chapter.tenChuong}
                                                            </h5>
                                                            <span className="text-[12px] font-medium text-slate-500">
                                                                {chapter.baiHocs.length} bai
                                                            </span>
                                                        </div>
                                                        <div className="mt-3 space-y-3">
                                                            {chapter.baiHocs.length === 0 ? (
                                                                <p className="text-[13px] text-slate-500">
                                                                    Chua co bai hoc trong chuong nay.
                                                                </p>
                                                            ) : (
                                                                chapter.baiHocs.map((lesson) => (
                                                                    <div
                                                                        key={lesson.maBH}
                                                                        className="rounded-2xl border border-white bg-white px-4 py-3"
                                                                    >
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <p className="text-[14px] font-semibold text-slate-800">
                                                                                Bai {lesson.thuTu}: {lesson.tenBaiHoc}
                                                                            </p>
                                                                            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                                                                {lesson.trangThai}
                                                                            </span>
                                                                        </div>
                                                                        <p className="mt-2 text-[13px] leading-6 text-slate-600">
                                                                            {lesson.noiDung || 'Chua co noi dung bai hoc.'}
                                                                        </p>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-6">
                                    <section className="rounded-[24px] border border-slate-200 bg-white p-5">
                                        <h4 className="text-[15px] font-bold text-slate-900">Lich su kiem duyet</h4>
                                        <div className="mt-4 space-y-4">
                                            {selectedCourseDetail.moderationHistory.length === 0 ? (
                                                <p className="text-[14px] text-slate-500">
                                                    Khoa hoc nay chua co lich su kiem duyet.
                                                </p>
                                            ) : (
                                                selectedCourseDetail.moderationHistory.map((item) => (
                                                    <div
                                                        key={item.maLSKD}
                                                        className="rounded-[20px] border border-slate-100 bg-slate-50 p-4"
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <span
                                                                className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${item.hanhDong === 'APPROVE'
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-rose-100 text-rose-700'
                                                                    }`}
                                                            >
                                                                {item.hanhDong}
                                                            </span>
                                                            <span className="text-[12px] text-slate-500">
                                                                {formatDateTime(item.thoiGian)}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-[13px] font-semibold text-slate-700">
                                                            {item.adminName}
                                                        </p>
                                                        <p className="mt-2 text-[13px] leading-6 text-slate-600">
                                                            {item.ghiChu || 'Khong co ghi chu.'}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </AdminLayout>
    );
}
