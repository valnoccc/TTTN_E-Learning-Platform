import {
  CalendarDays,
  CircleDollarSign,
  RefreshCw,
  Search,
  Wallet,
  Users,
  BookOpen,
} from "lucide-react";
import type { ReactNode } from "react";
import AdminLayout from "../../../layouts/AdminLayout";
import {
  AdminInstructorDebtItem,
  useAdminInstructorDebts,
} from "./hooks/useAdminInstructorDebts";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonthLabel(month: number, year: number) {
  return `Tháng ${String(month).padStart(2, "0")}/${year}`;
}

function StatCard({
  label,
  value,
  icon,
  tone,
  subtitle,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: string;
  subtitle: string;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.45)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-[28px] font-black tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone} bg-opacity-10 text-current`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        {subtitle}
      </p>
    </div>
  );
}

function DebtBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
      {value}
    </span>
  );
}

function TableRow({ item }: { item: AdminInstructorDebtItem }) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
            {item.instructorAvatar ? (
              <>
                <img
                  src={item.instructorAvatar.startsWith('http') || item.instructorAvatar.startsWith('data:') ? item.instructorAvatar : `/assets/images/${item.instructorAvatar}`}
                  alt={item.instructorName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                          (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                  }}
                />
                <span className="hidden h-full w-full items-center justify-center text-sm font-bold text-slate-500">
                  {item.instructorName.charAt(0).toUpperCase()}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-slate-500">
                {item.instructorName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              {item.instructorName}
            </p>
            <p className="text-xs text-slate-500">
              {item.specialty || "Giảng viên"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-slate-600">{item.courseCount}</td>
      <td className="px-4 py-4 text-sm text-slate-600">{item.orderCount}</td>
      <td className="px-4 py-4 text-sm font-semibold text-slate-700">
        {formatCurrency(item.grossRevenue)}
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-emerald-600">
        {formatCurrency(item.adminRevenue)}
      </td>
      <td className="px-4 py-4 text-sm font-bold text-amber-600">
        {formatCurrency(item.debtAmount)}
      </td>
      <td className="px-4 py-4 text-center">
        <DebtBadge value="Chờ đối soát" />
      </td>
    </tr>
  );
}

export default function AdminInstructorDebts() {
  const {
    board,
    summary,
    loading,
    refreshing,
    month,
    year,
    years,
    searchValue,
    setSearchValue,
    setMonth,
    setYear,
    refetch,
    filteredItems,
  } = useAdminInstructorDebts();

  const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div></div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <CalendarDays size={16} className="text-slate-400" />
              <select
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
              >
                {monthOptions.map((value) => (
                  <option key={value} value={value}>
                    Tháng {value}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
              >
                {years.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Tải lại
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-[24px] border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Tổng phải trả"
                value={formatCurrency(summary.instructorPayout)}
                icon={<Wallet size={20} className="text-amber-600" />}
                tone="bg-amber-500"
                subtitle="Công nợ tháng hiện tại"
              />
              <StatCard
                label="Giảng viên phát sinh"
                value={summary.totalInstructors.toLocaleString("vi-VN")}
                icon={<Users size={20} className="text-cyan-600" />}
                tone="bg-cyan-500"
                subtitle="Số giảng viên có doanh thu"
              />
              <StatCard
                label="Doanh thu gộp"
                value={formatCurrency(summary.grossRevenue)}
                icon={
                  <CircleDollarSign size={20} className="text-emerald-600" />
                }
                tone="bg-emerald-500"
                subtitle="Doanh thu đã ghi nhận trong tháng"
              />
              <StatCard
                label="Khóa học phát sinh"
                value={summary.totalCourses.toLocaleString("vi-VN")}
                icon={<BookOpen size={20} className="text-blue-600" />}
                tone="bg-blue-500"
                subtitle="Khóa học có doanh thu trong tháng"
              />
            </section>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_36px_-28px_rgba(15,23,42,0.5)]">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-[18px] font-bold tracking-tight text-slate-900">
                    Công nợ theo giảng viên
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Bảng này thể hiện số tiền phải trả cho từng giảng viên trong
                    tháng đã chọn.
                  </p>
                </div>

                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Search size={16} className="text-slate-400" />
                  <input
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Tìm giảng viên hoặc chuyên môn..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-72"
                  />
                </label>
              </div>

              {filteredItems.length === 0 ? (
                <div className="px-6 py-16 text-center text-sm text-slate-500">
                  Không có dữ liệu công nợ cho bộ lọc hiện tại.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      <tr>
                        <th className="px-4 py-4">Giảng viên</th>
                        <th className="px-4 py-4">Khóa học</th>
                        <th className="px-4 py-4">Đơn hàng</th>
                        <th className="px-4 py-4">Doanh thu gộp</th>
                        <th className="px-4 py-4">Phần admin</th>
                        <th className="px-4 py-4">Phải trả</th>
                        <th className="px-4 py-4 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <TableRow key={item.instructorId} item={item} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
                Hiển thị {filteredItems.length}/{board?.items.length ?? 0} giảng
                viên trong
                {` ${board?.monthLabel ?? formatMonthLabel(month, year)}`}.
              </div>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
