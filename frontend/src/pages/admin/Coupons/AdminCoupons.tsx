import { FormEvent, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CalendarDays,
  Filter,
  Plus,
  Save,
  Search,
  ShieldCheck,
  ShieldOff,
  Ticket,
  UsersRound,
  X,
} from 'lucide-react';

import AdminLayout from '../../../layouts/AdminLayout';
import {
  AdminCouponRuleType,
  AdminCouponScopeOption,
  AdminCouponScopeType,
  useAdminCoupons,
} from './hooks/useAdminCoupons';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getScopeLabel(scope: AdminCouponScopeType) {
  switch (scope) {
    case 'COURSE':
      return 'Khóa học';
    case 'CATEGORY':
      return 'Danh mục';
    case 'INSTRUCTOR':
      return 'Giảng viên';
    default:
      return 'Toàn sàn';
  }
}

function getScopeHint(scope: AdminCouponScopeType) {
  switch (scope) {
    case 'COURSE':
      return 'Chọn đúng một khóa học cụ thể hoặc tìm nhanh theo tên.';
    case 'CATEGORY':
      return 'Chọn danh mục cần áp dụng mã giảm giá.';
    case 'INSTRUCTOR':
      return 'Chọn giảng viên sở hữu khóa học được áp dụng.';
    default:
      return 'Mã sẽ áp dụng cho toàn bộ hệ thống.';
  }
}

function getRuleLabel(rule: AdminCouponRuleType) {
  switch (rule) {
    case 'NEW_USER_24H':
      return 'Tài khoản mới 24h';
    case 'FIRST_PURCHASE':
      return 'Mua đầu tiên';
    case 'COMBO_ONLY':
      return 'Chỉ combo';
    case 'MIN_ORDER_VALUE':
      return 'Giá trị đơn tối thiểu';
    case 'MIN_COURSE_COUNT':
      return 'Số khóa tối thiểu';
    default:
      return rule;
  }
}

function getRuleValueConfig(rule: AdminCouponRuleType) {
  switch (rule) {
    case 'COMBO_ONLY':
      return {
        visible: true,
        label: '',
        placeholder: 'VD: 2',
        min: 2,
      };
    case 'MIN_ORDER_VALUE':
      return {
        visible: true,
        label: 'Giá trị đơn tối thiểu',
        placeholder: 'VD: 500000',
        min: 1,
      };
    case 'MIN_COURSE_COUNT':
      return {
        visible: true,
        label: 'Số khóa tối thiểu',
        placeholder: 'VD: 2',
        min: 1,
      };
    default:
      return {
        visible: false,
        label: '',
        placeholder: '',
        min: 0,
      };
  }
}

function getScopeTargetLabel(scope: AdminCouponScopeType) {
  switch (scope) {
    case 'COURSE':
      return 'Chọn khóa học áp dụng';
    case 'CATEGORY':
      return 'Chọn danh mục áp dụng';
    case 'INSTRUCTOR':
      return 'Chọn giảng viên áp dụng';
    default:
      return '';
  }
}

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/60">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ScopePicker({
  scopeType,
  scopeOptions,
  scopeOptionsLoading,
  scopeSearch,
  setScopeSearch,
  selectedScopeTargetIds,
  onSelectTarget,
  onClearTarget,
}: {
  scopeType: AdminCouponScopeType;
  scopeOptions: {
    courses: AdminCouponScopeOption[];
    categories: AdminCouponScopeOption[];
    instructors: AdminCouponScopeOption[];
  };
  scopeOptionsLoading: boolean;
  scopeSearch: string;
  setScopeSearch: (value: string) => void;
  selectedScopeTargetIds: number[];
  onSelectTarget: (id: number) => void;
  onClearTarget: () => void;
}) {
  if (scopeType === 'ALL') {
    return null;
  }

  const options =
    scopeType === 'COURSE'
      ? scopeOptions.courses
      : scopeType === 'CATEGORY'
        ? scopeOptions.categories
        : scopeOptions.instructors;

  const normalizedSearch = scopeSearch.trim().toLowerCase();
  const filteredOptions = normalizedSearch
    ? options.filter((option) =>
        `${option.label} ${option.description ?? ''}`.toLowerCase().includes(normalizedSearch),
      )
    : options;

  return (
    <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">{getScopeTargetLabel(scopeType)}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{getScopeHint(scopeType)}</p>
        </div>

        {selectedScopeTargetIds.length > 0 ? (
          <button
            type="button"
            onClick={onClearTarget}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600"
          >
            <X size={14} />
            Bỏ chọn
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3">
        <label className="relative block">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={scopeSearch}
            onChange={(event) => setScopeSearch(event.target.value)}
            placeholder={
              scopeType === 'COURSE'
                ? 'Tìm tên khóa học...'
                : scopeType === 'CATEGORY'
                  ? 'Tìm tên danh mục...'
                  : 'Tìm tên giảng viên...'
            }
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </label>

        <div className="max-h-72 overflow-y-auto rounded-[18px] border border-slate-200 bg-white p-2">
          {scopeOptionsLoading ? (
            <div className="space-y-2 p-2">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-50" />
              ))}
            </div>
          ) : filteredOptions.length > 0 ? (
            <div className="grid gap-2">
              {filteredOptions.map((option) => {
                const selected = selectedScopeTargetIds.includes(option.id);

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelectTarget(option.id)}
                    className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      selected
                        ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                        : 'border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{option.label}</p>
                      {option.description ? (
                        <p className="mt-1 max-h-10 overflow-hidden text-xs leading-5 text-slate-500">
                          {option.description}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`mt-0.5 inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        selected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {selected ? 'Đã chọn' : 'Chọn'}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-700">Không tìm thấy kết quả phù hợp.</p>
              <p className="mt-1 text-xs text-slate-500">Thử đổi từ khóa hoặc xóa bộ lọc tìm kiếm.</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
          {selectedScopeTargetIds.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Đã chọn</p>
              <div className="flex flex-wrap gap-2">
                {selectedScopeTargetIds.map((id) => {
                  const selectedOption = options.find((option) => option.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex max-w-full items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      {selectedOption?.label ?? `#${id}`}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Chưa chọn đối tượng nào.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCoupons() {
  const {
    loading,
    saving,
    search,
    setSearch,
    status,
    setStatus,
    summary,
    coupons,
    scopeOptions,
    scopeOptionsLoading,
    scopeSearch,
    setScopeSearch,
    form,
    setForm,
    error,
    resetForm,
    submitCoupon,
    toggleCouponStatus,
    updateRule,
    addRule,
    removeRule,
  } = useAdminCoupons();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const selectedScopeTargetIds = form.scopeTargetIds
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await submitCoupon();
    if (success) {
      setIsCreateOpen(false);
    }
  };

  const closeCreateModal = (shouldReset: boolean) => {
    if (shouldReset) {
      resetForm();
    }
    setIsCreateOpen(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Quản lý mã giảm giá</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Tạo và quản lý mã giảm giá admin với bố cục gọn, rõ ràng, phù hợp backend hiện tại.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            <Plus size={18} />
            Tạo mã mới
          </button>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Tổng mã"
            value={summary.totalCouponCount.toLocaleString('vi-VN')}
            description="Tất cả coupon trong hệ thống"
            icon={<Ticket size={20} />}
          />
          <StatCard
            label="Đang hoạt động"
            value={summary.activeCount.toLocaleString('vi-VN')}
            description="Mã có thể dùng ngay"
            icon={<ShieldCheck size={20} />}
          />
          <StatCard
            label="Lượt sử dụng"
            value={summary.totalUsageCount.toLocaleString('vi-VN')}
            description="Tổng số lần redeem"
            icon={<UsersRound size={20} />}
          />
          <StatCard
            label="Có điều kiện"
            value={coupons.filter((coupon) => coupon.rules.length > 0).length.toLocaleString('vi-VN')}
            description="Mã có ràng buộc sử dụng"
            icon={<ShieldCheck size={20} />}
          />
        </section>

        <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <label className="relative block flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo mã coupon..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-[14px] font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
              />
            </label>

            <label className="relative block md:w-[230px]">
              <Filter
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as typeof status)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-[14px] font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Vô hiệu hóa</option>
              </select>
            </label>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-[18px] font-bold text-slate-900">Danh sách mã giảm giá</h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading ? 'Đang tải dữ liệu...' : `${coupons.length} mã trong bộ lọc hiện tại`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-50" />
              ))}
            </div>
          ) : coupons.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                <Ticket size={28} strokeWidth={1.6} />
              </div>
              <h3 className="mt-4 text-[16px] font-semibold text-slate-900">Chưa có mã giảm giá</h3>
              <p className="mt-2 text-[14px] text-slate-500">
                Hãy tạo mã đầu tiên để bắt đầu áp dụng ưu đãi.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed text-left">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="w-[18%] px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                      Mã
                    </th>
                    <th className="w-[14%] px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                      Giảm
                    </th>
                    <th className="w-[18%] px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                      Phạm vi
                    </th>
                    <th className="w-[22%] px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                      Điều kiện
                    </th>
                    <th className="w-[18%] px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                      Hiệu lực
                    </th>
                    <th className="w-[10%] px-6 py-4 text-center text-[12px] font-bold uppercase tracking-wider text-slate-500">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr
                      key={coupon.maCoupon}
                      className="border-t border-slate-100 align-top transition hover:bg-slate-50/60"
                    >
                      <td className="px-6 py-5">
                        <div className="space-y-2">
                          <p className="text-[15px] font-bold text-slate-900">{coupon.maCode}</p>
                          <p className="text-[12px] text-slate-500">{coupon.ghiChu || 'Mã giảm giá admin'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[14px] font-bold text-emerald-600">
                          {coupon.loaiGiam === 'PERCENT'
                            ? `${coupon.giaTriGiam}%`
                            : formatCurrency(coupon.giaTriGiam)}
                        </p>
                        <p className="mt-1 text-[12px] text-slate-500">
                          {coupon.soLuongDaDung}/{coupon.soLuongGioiHan ?? '∞'} lượt dùng
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-2">
                          <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            {coupon.scopes.length > 0
                              ? coupon.scopes.map((scope) => getScopeLabel(scope.loaiPhamVi)).join(', ')
                              : coupon.maKH
                                ? 'Khóa học'
                                : 'Toàn sàn'}
                          </span>
                          <p className="text-[12px] text-slate-500">
                            {coupon.scopes.length > 0
                              ? coupon.scopes
                                  .map((scope) => (scope.maDoiTuong ? `#${scope.maDoiTuong}` : 'Tất cả'))
                                  .join(', ')
                              : coupon.tenKhoaHoc || 'Áp dụng trên giỏ hàng hợp lệ'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-2">
                          {coupon.rules.length > 0 ? (
                            coupon.rules.map((rule) => {
                              const valueConfig = getRuleValueConfig(rule.loaiDieuKien);

                              return (
                                 <p className="text-[12px] font-bold text-slate-800">
                                    {getRuleLabel(rule.loaiDieuKien)}
                                  </p>
                              );
                            })
                          ) : (
                            <p className="text-[12px] text-slate-500">Không có điều kiện bổ sung.</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-2 text-[12px] text-slate-500">
                          <p className="flex items-center gap-1.5">
                            <CalendarDays size={12} />
                            {formatDateTime(coupon.ngayBatDau)}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <CalendarDays size={12} />
                            {formatDateTime(coupon.ngayKetThuc)}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-bold ${
                              coupon.trangThai === 'ACTIVE'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-100 text-slate-600'
                            }`}
                          >
                            {coupon.trangThai === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu hóa'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void toggleCouponStatus(
                                coupon.maCoupon,
                                coupon.trangThai === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                              )
                            }
                            className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-[12px] font-semibold shadow-sm transition ${
                              coupon.trangThai === 'ACTIVE'
                                ? 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100'
                            }`}
                          >
                            {coupon.trangThai === 'ACTIVE' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                            {coupon.trangThai === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {isCreateOpen ? (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 sm:p-6 backdrop-blur-sm"
            onClick={() => closeCreateModal(false)}
          >
            <div
              className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
              style={{ maxHeight: 'calc(100vh - 3rem)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h2 className="text-[20px] font-black text-slate-900">Thêm mã giảm giá mới</h2>
                  <p className="mt-1 text-[13px] text-slate-500">
                    Thiết lập thông tin và điều kiện áp dụng
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => closeCreateModal(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                  aria-label="Đóng"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body Form */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <form
                  id="coupon-create-form"
                  onSubmit={handleSubmit}
                  className="space-y-6 px-6 py-6"
                >
                  {/* Phần 1: Thông tin cơ bản */}
                  <section className="rounded-[20px] border border-slate-100 bg-slate-50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                        <Plus size={18} />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold uppercase tracking-wide text-slate-900">1. Thông tin cơ bản</h3>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-700">Mã giảm giá</span>
                        <input
                          value={form.maCode}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, maCode: event.target.value }))
                          }
                          placeholder="VD: 8M3-NEW-20"
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-700">Trạng thái</span>
                        <select
                          value={form.trangThai}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              trangThai: event.target.value as typeof form.trangThai,
                            }))
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="ACTIVE">Hoạt động</option>
                          <option value="INACTIVE">Vô hiệu hóa</option>
                        </select>
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-700">Loại giảm</span>
                        <select
                          value={form.loaiGiam}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              loaiGiam: event.target.value as typeof form.loaiGiam,
                            }))
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="PERCENT">Phần trăm</option>
                          <option value="AMOUNT">Số tiền</option>
                        </select>
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-700">Giá trị giảm</span>
                        <input
                          type="number"
                          min={1}
                          value={form.giaTriGiam}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, giaTriGiam: event.target.value }))
                          }
                          placeholder="VD: 20"
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-700">Ngày bắt đầu</span>
                        <input
                          type="datetime-local"
                          value={form.ngayBatDau}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, ngayBatDau: event.target.value }))
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-700">Ngày kết thúc</span>
                        <input
                          type="datetime-local"
                          value={form.ngayKetThuc}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, ngayKetThuc: event.target.value }))
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                      </label>

                      <label className="grid gap-2 md:col-span-2">
                        <span className="text-sm font-semibold text-slate-700">Giới hạn lượt dùng</span>
                        <input
                          type="number"
                          min={1}
                          value={form.soLuongGioiHan}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, soLuongGioiHan: event.target.value }))
                          }
                          placeholder="Để trống nếu không giới hạn"
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                      </label>
                    </div>
                  </section>

                  {/* Phần 2: Phạm vi áp dụng */}
                  <section className="rounded-[20px] border border-slate-100 bg-slate-50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                        <UsersRound size={18} />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold uppercase tracking-wide text-slate-900">2. Phạm vi áp dụng</h3>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-700">Phạm vi áp dụng</span>
                        <select
                          value={form.scopeType}
                          onChange={(event) => {
                            setScopeSearch('');
                            setForm((current) => ({
                              ...current,
                              scopeType: event.target.value as typeof form.scopeType,
                              scopeTargetIds: '',
                            }));
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="ALL">Toàn sàn</option>
                          <option value="COURSE">Khóa học</option>
                          <option value="CATEGORY">Danh mục</option>
                          <option value="INSTRUCTOR">Giảng viên</option>
                        </select>
                      </label>
                    </div>

                    <div className="mt-4">
                      <ScopePicker
                        scopeType={form.scopeType}
                        scopeOptions={scopeOptions}
                        scopeOptionsLoading={scopeOptionsLoading}
                        scopeSearch={scopeSearch}
                        setScopeSearch={setScopeSearch}
                        selectedScopeTargetIds={selectedScopeTargetIds}
                        onSelectTarget={(id) => {
                          setForm((current) => ({
                            ...current,
                            scopeTargetIds: String(id),
                          }));
                        }}
                        onClearTarget={() => setForm((current) => ({ ...current, scopeTargetIds: '' }))}
                      />
                    </div>
                  </section>

                  {/* Phần 3: Điều kiện áp dụng */}
                  <section className="rounded-[20px] border border-slate-100 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                          <ShieldCheck size={18} />
                        </div>
                        <h3 className="text-[14px] font-bold uppercase tracking-wide text-slate-900">3. Điều kiện áp dụng</h3>
                      </div>
                      <button
                        type="button"
                        onClick={addRule}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <Plus size={16} />
                        Thêm điều kiện
                      </button>
                    </div>

                    <div className="mt-5 space-y-4">
                      {form.rules.map((rule, index) => {
                        const valueConfig = getRuleValueConfig(rule.loaiDieuKien);

                        return (
                          <div
                            key={`${rule.loaiDieuKien}-${index}`}
                            className="rounded-[16px] border border-slate-100 bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                  Điều kiện {index + 1}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeRule(index)}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50"
                                aria-label="Xóa điều kiện"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <div className="mt-3 grid gap-4 md:grid-cols-2">
                              <label className="grid gap-2">
                                <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                                  Loại điều kiện
                                </span>
                                <select
                                  value={rule.loaiDieuKien}
                                  onChange={(event) => {
                                    const nextRule = event.target.value as AdminCouponRuleType;
                                    updateRule(index, {
                                      loaiDieuKien: nextRule,
                                      giaTriDieuKien: getRuleValueConfig(nextRule).visible
                                        ? rule.giaTriDieuKien
                                        : '',
                                    });
                                  }}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                >
                                  <option value="FIRST_PURCHASE">{getRuleLabel('FIRST_PURCHASE')}</option>
                                  <option value="NEW_USER_24H">{getRuleLabel('NEW_USER_24H')}</option>
                                  <option value="COMBO_ONLY">{getRuleLabel('COMBO_ONLY')}</option>
                                  <option value="MIN_ORDER_VALUE">{getRuleLabel('MIN_ORDER_VALUE')}</option>
                                  <option value="MIN_COURSE_COUNT">{getRuleLabel('MIN_COURSE_COUNT')}</option>
                                </select>
                              </label>

                              {valueConfig.visible ? (
                                <label className="grid gap-2">
                                  <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                                    {valueConfig.label}
                                  </span>
                                  <input
                                    type="number"
                                    min={valueConfig.min}
                                    value={rule.giaTriDieuKien}
                                    onChange={(event) =>
                                      updateRule(index, {
                                        giaTriDieuKien: event.target.value,
                                      })
                                    }
                                    placeholder={valueConfig.placeholder}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                  />
                                </label>
                              ) : (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5">
                                  <p className="text-sm font-semibold text-slate-700">Không cần giá trị bổ sung</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </form>
              </div>

              {/* Footer Modal */}
              <div className="shrink-0 flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => closeCreateModal(true)}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  form="coupon-create-form"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? 'Đang lưu...' : 'Lưu mã giảm giá'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}