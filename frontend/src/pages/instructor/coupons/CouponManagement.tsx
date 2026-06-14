import { Copy, Plus, Ticket, Users, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';

import InstructorLayout from '../../../layouts/InstructorLayout';
import {
  InstructorCouponItem,
  useInstructorCoupons,
} from './hooks/useInstructorCoupons';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Không giới hạn';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function getUsageRatio(coupon: InstructorCouponItem) {
  if (!coupon.soLuongGioiHan || coupon.soLuongGioiHan <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((coupon.soLuongDaDung / coupon.soLuongGioiHan) * 100),
  );
}

export default function CouponManagement() {
  const {
    loading,
    isSubmitting,
    summary,
    items,
    totalItems,
    courses,
    searchValue,
    setSearchValue,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    form,
    updateForm,
    handleOpenModal,
    handleCloseModal,
    handleCreateCoupon,
    handleToggleStatus,
    generateRandomCode,
  } = useInstructorCoupons();

  const totalFixedDiscount = items.reduce((sum, item) => {
    if (item.loaiGiam === 'AMOUNT') {
      return sum + item.giaTriGiam;
    }

    return sum;
  }, 0);

  const handleCopyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Đã sao chép mã ${code}`);
    } catch {
      toast.error('Không thể sao chép mã giảm giá');
    }
  };

  return (
    <InstructorLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Phân hệ giảng viên
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
              Quản lý mã giảm giá
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Tạo coupon cho từng khóa học và đồng bộ trực tiếp với checkout của học viên.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#10B981] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            <Plus size={16} />
            Tạo mã giảm giá mới
          </button>
        </div>

        <section className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Mã đang hoạt động</p>
              <Ticket size={20} className="text-emerald-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.activeCount}</p>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Tổng lượt sử dụng</p>
              <Users size={20} className="text-blue-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.totalUsageCount}</p>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Tổng mức giảm cố định</p>
              <Wallet size={20} className="text-amber-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {formatCurrency(totalFixedDiscount)}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Tìm theo mã code hoặc khóa học..."
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:max-w-[320px]"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
              }
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Đã tắt</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-4 p-6 animate-pulse">
              <div className="h-10 rounded bg-slate-100" />
              <div className="h-10 rounded bg-slate-50" />
              <div className="h-10 rounded bg-slate-50" />
            </div>
          ) : totalItems === 0 ? (
            <div className="py-16 text-center text-slate-500">
              Chưa có mã giảm giá nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="p-4">Mã code</th>
                    <th className="p-4">Chi tiết giảm</th>
                    <th className="p-4">Khóa học áp dụng</th>
                    <th className="p-4">Lượt dùng</th>
                    <th className="p-4">Thời gian hiệu lực</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((coupon) => {
                    const usageRatio = getUsageRatio(coupon);

                    return (
                      <tr key={coupon.maCoupon} className="transition hover:bg-slate-50/50">
                        <td className="p-4">
                          <div className="inline-flex items-center gap-1.5 rounded bg-slate-800 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-white">
                            <Ticket size={12} className="text-slate-300" />
                            {coupon.maCode}
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-emerald-600">
                          {coupon.loaiGiam === 'PERCENT'
                            ? `- ${coupon.giaTriGiam}%`
                            : `- ${formatCurrency(coupon.giaTriGiam)}`}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{coupon.tenKhoaHoc}</div>
                          {coupon.ghiChu ? (
                            <div className="mt-1 text-xs text-slate-500">{coupon.ghiChu}</div>
                          ) : null}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-800">
                              {coupon.soLuongDaDung}
                              {coupon.soLuongGioiHan ? ` / ${coupon.soLuongGioiHan}` : ' / Không giới hạn'}
                            </span>
                            {coupon.soLuongGioiHan ? (
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full ${usageRatio >= 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${usageRatio}%` }}
                                />
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                          <div>Từ: {formatDate(coupon.ngayBatDau)}</div>
                          <div>Đến: {formatDate(coupon.ngayKetThuc)}</div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${
                              coupon.trangThai === 'ACTIVE'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-100 text-slate-600'
                            }`}
                          >
                            {coupon.trangThai === 'ACTIVE' ? 'Đang hoạt động' : 'Đã tắt'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => void handleCopyCoupon(coupon.maCode)}
                              className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-emerald-600"
                              title="Sao chép mã"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleToggleStatus(coupon)}
                              className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                                coupon.trangThai === 'ACTIVE'
                                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              }`}
                            >
                              {coupon.trangThai === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 p-4 text-center text-xs text-slate-500">
            Hiển thị {totalItems} mã giảm giá
          </div>
        </section>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-md bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-bold text-slate-800">Tạo mã giảm giá mới</h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 transition hover:text-rose-500"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Khóa học áp dụng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.maKH}
                  onChange={(event) => updateForm('maKH', event.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Chọn khóa học --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Mã code <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.maCode}
                    onChange={(event) => updateForm('maCode', event.target.value.toUpperCase())}
                    placeholder="VD: REACT50"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono uppercase outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="shrink-0 rounded-md bg-slate-100 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                  >
                    Tạo ngẫu nhiên
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Loại giảm giá
                  </label>
                  <select
                    value={form.loaiGiam}
                    onChange={(event) =>
                      updateForm('loaiGiam', event.target.value as 'PERCENT' | 'AMOUNT')
                    }
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="AMOUNT">Số tiền trực tiếp (VND)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Mức giảm <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.giaTriGiam}
                    onChange={(event) => updateForm('giaTriGiam', event.target.value)}
                    placeholder={form.loaiGiam === 'PERCENT' ? 'Tối đa 99' : 'VD: 50000'}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Giới hạn lượt dùng
                  </label>
                  <input
                    type="number"
                    value={form.soLuongGioiHan}
                    onChange={(event) => updateForm('soLuongGioiHan', event.target.value)}
                    placeholder="Để trống là không giới hạn"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Ghi chú
                  </label>
                  <input
                    type="text"
                    value={form.ghiChu}
                    onChange={(event) => updateForm('ghiChu', event.target.value)}
                    placeholder="Ghi chú nội bộ"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    value={form.ngayBatDau}
                    onChange={(event) => updateForm('ngayBatDau', event.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Ngày kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    value={form.ngayKetThuc}
                    onChange={(event) => updateForm('ngayKetThuc', event.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 rounded-b-md border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-md px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => void handleCreateCoupon()}
                disabled={isSubmitting}
                className="rounded-md bg-[#10B981] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu mã giảm giá'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </InstructorLayout>
  );
}
