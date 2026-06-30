import {
    Calendar,
    ChevronDown,
    Hash,
    Loader2,
    Percent,
    Plus,
    RefreshCw,
    Search,
    Tag,
    ToggleLeft,
    ToggleRight,
    Trash2,
    XCircle,
    Zap,
} from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import Pagination from '../../../components/Pagination';
import {
    type AdminCouponItem,
    type CreateAdminCouponPayload,
    type LoaiKM,
    type QueryCouponsFilter,
    useAdminCoupons,
} from './hooks/useAdminCoupons';

// ─── Constants ────────────────────────────────────────────────────────────────

const LOAI_KM_OPTIONS: { value: LoaiKM; label: string; desc: string; color: string; icon: string }[] = [
    { value: 'FIRST_TIME', label: 'Mua lần đầu', desc: 'Ràng buộc 1 lần / tài khoản', color: 'bg-blue-100 text-blue-700', icon: '🥇' },
    { value: 'CROSS_SELL', label: 'Mua kèm / Cross-sell', desc: 'Tự động áp dụng gợi ý khóa học', color: 'bg-orange-100 text-orange-700', icon: '🔗' },
    { value: 'HOLIDAY', label: 'Dịp lễ / Sự kiện', desc: 'Khuyến mãi theo mùa / sự kiện', color: 'bg-purple-100 text-purple-700', icon: '🎉' },
    { value: 'STANDARD', label: 'Tiêu chuẩn', desc: 'Mã giảm giá thông thường', color: 'bg-slate-100 text-slate-700', icon: '📋' },
];

const PHAN_TRAM_OPTIONS = [10, 15, 20, 25, 30, 40, 50];
const PAGE_SIZE = 10;

// ─── Empty form ────────────────────────────────────────────────────────────────

type CouponForm = {
    maCode: string;
    maKM: string;
    loaiKM: LoaiKM;
    giaTriGiam: number;
    soLuongGioiHan: string;
    ngayBatDau: string;
    ngayKetThuc: string;
    ghiChu: string;
    trangThai: 'ACTIVE' | 'INACTIVE';
};

const emptyForm: CouponForm = {
    maCode: '',
    maKM: '',
    loaiKM: 'STANDARD',
    giaTriGiam: 20,
    soLuongGioiHan: '',
    ngayBatDau: '',
    ngayKetThuc: '',
    ghiChu: '',
    trangThai: 'ACTIVE',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLoaiKMInfo(loaiKM: LoaiKM | null) {
    return (
        LOAI_KM_OPTIONS.find((o) => o.value === loaiKM) ?? LOAI_KM_OPTIONS[3]
    );
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN');
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminCoupons() {
    const {
        coupons,
        summary,
        loading,
        error,
        filter,
        setFilter,
        createCoupon,
        deleteCoupon,
        toggleStatus,
    } = useAdminCoupons();

    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<CouponForm>(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminCouponItem | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const totalPages = Math.max(1, Math.ceil(coupons.length / PAGE_SIZE));
    const indexOfLast = currentPage * PAGE_SIZE;
    const indexOfFirst = indexOfLast - PAGE_SIZE;
    const visibleCoupons = useMemo(
        () => coupons.slice(indexOfFirst, indexOfLast),
        [coupons, indexOfFirst, indexOfLast],
    );

    useEffect(() => setCurrentPage(1), [filter]);

    const openCreateForm = () => {
        setForm(emptyForm);
        setFormError(null);
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setFormError(null);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!form.maCode.trim()) {
            setFormError('Mã giảm giá không được để trống');
            return;
        }
        setSubmitting(true);
        setFormError(null);
        try {
            const payload: CreateAdminCouponPayload = {
                maCode: form.maCode.trim().toUpperCase(),
                maKM: form.maKM.trim() || null,
                loaiKM: form.loaiKM,
                giaTriGiam: form.giaTriGiam,
                loaiGiam: 'PERCENT',
                trangThai: form.trangThai,
                ngayBatDau: form.ngayBatDau || null,
                ngayKetThuc: form.ngayKetThuc || null,
                soLuongGioiHan: form.soLuongGioiHan
                    ? Number(form.soLuongGioiHan)
                    : null,
                ghiChu: form.ghiChu.trim() || null,
            };
            await createCoupon(payload);
            closeForm();
        } catch (err: any) {
            setFormError(
                err?.response?.data?.message ?? 'Lỗi tạo mã khuyến mãi',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteCoupon(deleteTarget.maCoupon);
            setDeleteTarget(null);
        } catch (err: any) {
            alert(err?.response?.data?.message ?? 'Lỗi xóa mã khuyến mãi');
        } finally {
            setDeleting(false);
        }
    };

    const handleToggle = async (coupon: AdminCouponItem) => {
        setTogglingId(coupon.maCoupon);
        try {
            await toggleStatus(coupon);
        } catch (err: any) {
            alert(err?.response?.data?.message ?? 'Lỗi cập nhật trạng thái');
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6 animate-fade-in">

                {/* ── Header ── */}
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                            Quản lý Khuyến mãi
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Tạo và quản lý mã giảm giá cho hệ thống Edumeo
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateForm}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1dbf73] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#18a864] active:translate-y-[1px]"
                        id="btn-create-coupon"
                    >
                        <Plus size={18} />
                        Tạo mã khuyến mãi
                    </button>
                </div>

                {/* ── Summary Cards ── */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                    {[
                        { label: 'Tổng mã', value: summary.total, color: 'bg-slate-50', text: 'text-slate-800', icon: <Tag size={18} className="text-slate-400" /> },
                        { label: 'Đang hoạt động', value: summary.activeCount, color: 'bg-emerald-50', text: 'text-emerald-700', icon: <Zap size={18} className="text-emerald-500" /> },
                        { label: 'Cross-sell active', value: summary.crossSellActive, color: 'bg-orange-50', text: 'text-orange-700', icon: <span className="text-lg">🔗</span> },
                        { label: 'Lần đầu active', value: summary.firstTimeActive, color: 'bg-blue-50', text: 'text-blue-700', icon: <span className="text-lg">🥇</span> },
                        { label: 'Tổng lượt dùng', value: summary.totalUsed, color: 'bg-purple-50', text: 'text-purple-700', icon: <Hash size={18} className="text-purple-400" /> },
                    ].map((card) => (
                        <div key={card.label} className={`rounded-2xl ${card.color} px-4 py-4 flex items-center gap-3`}>
                            <div className="shrink-0">{card.icon}</div>
                            <div>
                                <div className={`text-2xl font-black ${card.text}`}>{card.value}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Filters ── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="relative block w-full sm:w-[260px]">
                        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={filter.search ?? ''}
                            onChange={(e) => setFilter((prev: QueryCouponsFilter) => ({ ...prev, search: e.target.value }))}
                            placeholder="Tìm kiếm mã giảm giá..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-[14px] text-slate-700 shadow-sm outline-none transition focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73]"
                            id="search-coupon-input"
                        />
                    </label>

                    <div className="relative">
                        <select
                            value={filter.loaiKM ?? ''}
                            onChange={(e) => setFilter((prev: QueryCouponsFilter) => ({ ...prev, loaiKM: e.target.value as LoaiKM | '' }))}
                            className="appearance-none rounded-2xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-[14px] text-slate-700 shadow-sm outline-none transition focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] cursor-pointer"
                            id="filter-loaikm"
                        >
                            <option value="">Tất cả loại mã</option>
                            {LOAI_KM_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.icon} {opt.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="relative">
                        <select
                            value={filter.trangThai ?? ''}
                            onChange={(e) => setFilter((prev: QueryCouponsFilter) => ({ ...prev, trangThai: e.target.value as 'ACTIVE' | 'INACTIVE' | '' }))}
                            className="appearance-none rounded-2xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-[14px] text-slate-700 shadow-sm outline-none transition focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73] cursor-pointer"
                            id="filter-trangthai"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="ACTIVE">Đang hoạt động</option>
                            <option value="INACTIVE">Vô hiệu hóa</option>
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                {/* ── Table ── */}
                <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-[#1dbf73]" />
                            <h2 className="text-[16px] font-semibold text-slate-800">Danh sách mã khuyến mãi</h2>
                        </div>
                        <span className="text-[13px] font-medium text-slate-500">{coupons.length} mã</span>
                    </div>

                    {loading ? (
                        <div className="space-y-3 p-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-50" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="px-6 py-16 text-center">
                            <p className="text-red-500 text-sm">{error}</p>
                            <button
                                type="button"
                                onClick={() => setFilter({ ...filter })}
                                className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
                            >
                                <RefreshCw size={14} /> Thử lại
                            </button>
                        </div>
                    ) : coupons.length === 0 ? (
                        <div className="px-6 py-20 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                                <Tag size={28} strokeWidth={1.5} />
                            </div>
                            <h3 className="mt-4 text-[16px] font-semibold text-slate-800">
                                {filter.search ? 'Không tìm thấy mã khuyến mãi' : 'Chưa có mã nào'}
                            </h3>
                            <p className="mt-2 text-[14px] text-slate-500">
                                {filter.search
                                    ? 'Thử thay đổi từ khóa tìm kiếm.'
                                    : 'Tạo mã khuyến mãi đầu tiên để kích thích học viên mua khóa học.'}
                            </p>
                            {!filter.search && (
                                <button
                                    type="button"
                                    onClick={openCreateForm}
                                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#1dbf73] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#18a864]"
                                >
                                    <Plus size={18} />
                                    Tạo mã đầu tiên
                                </button>
                            )}
                        </div>
                    ) : (
                        <div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-fixed text-left">
                                    <thead className="bg-slate-50/70">
                                        <tr>
                                            <th className="w-[10%] px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">ID</th>
                                            <th className="w-[16%] px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Mã Code</th>
                                            <th className="w-[22%] px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Loại mã</th>
                                            <th className="w-[10%] px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 text-center">% Giảm</th>
                                            <th className="w-[14%] px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Hết hạn</th>
                                            <th className="w-[10%] px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 text-center">Lượt dùng</th>
                                            <th className="w-[10%] px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 text-center">Trạng thái</th>
                                            <th className="w-[8%] px-5 py-4 text-right text-[12px] font-bold uppercase tracking-wider text-slate-500">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {visibleCoupons.map((coupon) => {
                                            const loaiInfo = getLoaiKMInfo(coupon.loaiKM);
                                            const isToggling = togglingId === coupon.maCoupon;
                                            return (
                                                <tr key={coupon.maCoupon} className="transition hover:bg-slate-50/60">
                                                    <td className="px-5 py-4 text-[14px] font-semibold text-slate-500">
                                                        #{coupon.maCoupon}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="font-mono text-[14px] font-bold text-slate-800">{coupon.maCode}</div>
                                                        {coupon.maKM && (
                                                            <div className="text-[11px] text-slate-400">{coupon.maKM}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${loaiInfo.color}`}>
                                                            <span>{loaiInfo.icon}</span>
                                                            {loaiInfo.label}
                                                        </span>
                                                        {coupon.ghiChu && (
                                                            <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">{coupon.ghiChu}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <span className="inline-flex items-center gap-0.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[13px] font-bold text-emerald-700">
                                                            <Percent size={11} />
                                                            {coupon.giaTriGiam}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-1.5 text-[13px] text-slate-600">
                                                            <Calendar size={13} className="text-slate-400" />
                                                            {formatDate(coupon.ngayKetThuc)}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <span className="text-[13px] font-semibold text-slate-700">
                                                            {coupon.soLuongDaDung}
                                                            {coupon.soLuongGioiHan ? ` / ${coupon.soLuongGioiHan}` : ''}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleToggle(coupon)}
                                                            disabled={isToggling}
                                                            className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition disabled:opacity-50"
                                                            id={`toggle-status-${coupon.maCoupon}`}
                                                        >
                                                            {isToggling ? (
                                                                <Loader2 size={16} className="animate-spin text-slate-400" />
                                                            ) : coupon.trangThai === 'ACTIVE' ? (
                                                                <>
                                                                    <ToggleRight size={20} className="text-emerald-500" />
                                                                    <span className="text-emerald-600">Bật</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ToggleLeft size={20} className="text-slate-400" />
                                                                    <span className="text-slate-500">Tắt</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteTarget(coupon)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                            title="Xóa mã"
                                                            id={`delete-coupon-${coupon.maCoupon}`}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-slate-100 px-5 pb-5">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    totalItems={coupons.length}
                                    indexOfFirst={indexOfFirst}
                                    indexOfLast={indexOfLast}
                                    variant="numbers"
                                />
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                MODAL: Tạo mã khuyến mãi
            ══════════════════════════════════════════════════════════════════ */}
            {formOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => !submitting && closeForm()}
                    />
                    <div className="relative w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-7 shadow-2xl max-h-[90vh] overflow-y-auto">

                        {/* Modal header */}
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                                    <Tag size={13} />
                                    Tạo mã mới
                                </div>
                                <h3 className="mt-3 text-[22px] font-black tracking-tight text-slate-900">
                                    Thêm mã khuyến mãi
                                </h3>
                                <p className="mt-1 text-[14px] text-slate-500">
                                    Chọn loại mã và thiết lập thông tin chi tiết.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={submitting}
                                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">

                            {/* Loại mã — Dropdown UI đặc biệt */}
                            <div>
                                <label className="mb-2 block text-[14px] font-semibold text-slate-700">
                                    Loại mã <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {LOAI_KM_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, loaiKM: opt.value }))}
                                            className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition ${form.loaiKM === opt.value
                                                ? 'border-[#1dbf73] bg-emerald-50'
                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                                }`}
                                            id={`loaikm-option-${opt.value}`}
                                        >
                                            <span className="text-xl leading-none">{opt.icon}</span>
                                            <div>
                                                <div className="text-[13px] font-bold text-slate-800">{opt.label}</div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                                            </div>
                                            {form.loaiKM === opt.value && (
                                                <span className="ml-auto h-5 w-5 shrink-0 rounded-full bg-[#1dbf73] flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mã Code + Mã KM */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-[14px] font-semibold text-slate-700">
                                        Mã Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        value={form.maCode}
                                        onChange={(e) => setForm((f) => ({ ...f, maCode: e.target.value.toUpperCase() }))}
                                        placeholder="VD: CROSS20, NEW25"
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-[14px] font-bold uppercase text-slate-800 outline-none transition focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73]"
                                        id="input-macode"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-[14px] font-semibold text-slate-700">
                                        Tên hiển thị (tuỳ chọn)
                                    </label>
                                    <input
                                        value={form.maKM}
                                        onChange={(e) => setForm((f) => ({ ...f, maKM: e.target.value }))}
                                        placeholder="VD: Giảm 20% mua kèm"
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73]"
                                        id="input-makm"
                                    />
                                </div>
                            </div>

                            {/* % Giảm */}
                            <div>
                                <label className="mb-2 block text-[14px] font-semibold text-slate-700">
                                    Phần trăm giảm <span className="text-red-500">*</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {PHAN_TRAM_OPTIONS.map((pct) => (
                                        <button
                                            key={pct}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, giaTriGiam: pct }))}
                                            className={`rounded-xl border-2 px-4 py-2 text-[14px] font-bold transition ${form.giaTriGiam === pct
                                                ? 'border-[#1dbf73] bg-emerald-500 text-white'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                                                }`}
                                            id={`pct-option-${pct}`}
                                        >
                                            {pct}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Số lượng & Ngày */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-[14px] font-semibold text-slate-700">
                                        Giới hạn lượt dùng
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={form.soLuongGioiHan}
                                        onChange={(e) => setForm((f) => ({ ...f, soLuongGioiHan: e.target.value }))}
                                        placeholder="Không giới hạn"
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73]"
                                        id="input-soluonggioihan"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-[14px] font-semibold text-slate-700">
                                        Ngày bắt đầu
                                    </label>
                                    <input
                                        type="date"
                                        value={form.ngayBatDau}
                                        onChange={(e) => setForm((f) => ({ ...f, ngayBatDau: e.target.value }))}
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73]"
                                        id="input-ngaybatdau"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-[14px] font-semibold text-slate-700">
                                        Ngày kết thúc
                                    </label>
                                    <input
                                        type="date"
                                        value={form.ngayKetThuc}
                                        onChange={(e) => setForm((f) => ({ ...f, ngayKetThuc: e.target.value }))}
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73]"
                                        id="input-ngayketthuc"
                                    />
                                </div>
                            </div>

                            {/* Ghi chú */}
                            <div>
                                <label className="mb-1.5 block text-[14px] font-semibold text-slate-700">
                                    Ghi chú / Mô tả
                                </label>
                                <textarea
                                    value={form.ghiChu}
                                    onChange={(e) => setForm((f) => ({ ...f, ghiChu: e.target.value }))}
                                    rows={2}
                                    placeholder="Mô tả ngắn về điều kiện sử dụng mã..."
                                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] leading-6 text-slate-700 outline-none transition focus:border-[#1dbf73] focus:ring-1 focus:ring-[#1dbf73]"
                                    id="input-ghichu"
                                />
                            </div>

                            {/* Trạng thái */}
                            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setForm((f) => ({
                                            ...f,
                                            trangThai: f.trangThai === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                                        }))
                                    }
                                    className="flex items-center gap-2 transition"
                                    id="toggle-trangthai"
                                >
                                    {form.trangThai === 'ACTIVE' ? (
                                        <ToggleRight size={24} className="text-emerald-500" />
                                    ) : (
                                        <ToggleLeft size={24} className="text-slate-400" />
                                    )}
                                </button>
                                <span className="text-[14px] font-semibold text-slate-700">
                                    {form.trangThai === 'ACTIVE' ? '✅ Kích hoạt ngay sau khi tạo' : '⏸️ Tạo ở trạng thái vô hiệu hóa'}
                                </span>
                            </div>

                            {formError && (
                                <p className="rounded-2xl bg-red-50 px-4 py-3 text-[14px] text-red-600">
                                    ⚠️ {formError}
                                </p>
                            )}

                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={submitting}
                                    className="rounded-2xl border border-slate-200 px-5 py-2.5 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !form.maCode.trim()}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-[#1dbf73] px-6 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#18a864] disabled:cursor-not-allowed disabled:opacity-70"
                                    id="submit-create-coupon"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        <>
                                            <Tag size={16} />
                                            Tạo mã khuyến mãi
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                MODAL: Confirm Delete
            ══════════════════════════════════════════════════════════════════ */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => !deleting && setDeleteTarget(null)}
                    />
                    <div className="relative w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="mt-4 text-center text-[20px] font-black tracking-tight text-slate-900">
                            Xóa mã khuyến mãi
                        </h3>
                        <p className="mt-2 text-center text-[14px] leading-6 text-slate-500">
                            Bạn có chắc muốn xóa mã{' '}
                            <span className="font-mono font-bold text-slate-800">"{deleteTarget.maCode}"</span>?
                            {deleteTarget.soLuongDaDung > 0 && (
                                <span className="mt-2 block rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                                    ⚠️ Mã này đã được dùng {deleteTarget.soLuongDaDung} lần. Không thể xóa.
                                </span>
                            )}
                        </p>

                        <div className="mt-6 flex gap-3 border-t border-slate-100 pt-5">
                            <button
                                type="button"
                                onClick={() => !deleting && setDeleteTarget(null)}
                                disabled={deleting}
                                className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={() => void confirmDelete()}
                                disabled={deleting || deleteTarget.soLuongDaDung > 0}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                                id="confirm-delete-coupon"
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Đang xóa...
                                    </>
                                ) : (
                                    'Xóa mã'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
