import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Download,
  GraduationCap,
  Layers3,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminLayout from "../../../layouts/AdminLayout";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import * as XLSX from "xlsx";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
}

function formatBytesToGb(value: number) {
  const gb = value / (1024 * 1024 * 1024);
  if (gb >= 10) {
    return gb.toFixed(0);
  }
  if (gb >= 1) {
    return gb.toFixed(1);
  }
  return gb.toFixed(2);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPercent(value: number) {
  const rounded = Number.isFinite(value) ? value.toFixed(1) : "0.0";
  return `${value >= 0 ? "+" : ""}${rounded}%`;
}

function TrendBadge({ value }: { value: number }) {
  const positive = value >= 0;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {formatPercent(value)} so với kỳ trước
    </span>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tone,
  trend,
  detail,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: string;
  trend?: number;
  detail: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_-22px_rgba(15,23,42,0.42)] transition-transform duration-300 hover:-translate-y-1">
      <div
        className={`absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl opacity-20 ${tone}`}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-[28px] font-black tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone} bg-opacity-10 text-current`}
        >
          {icon}
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-3">
        {typeof trend === "number" ? (
          <TrendBadge value={trend} />
        ) : (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            {detail}
          </span>
        )}
        {typeof trend === "number" ? (
          <span className="text-xs font-medium text-slate-400">{detail}</span>
        ) : null}
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_36px_-28px_rgba(15,23,42,0.5)] ${className}`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function StatusBadge({ value }: { value: string }) {
  const status = value.toUpperCase();
  const tone =
    status === "PAID"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "PENDING"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}
    >
      {status}
    </span>
  );
}

function QuotaCard({
  title,
  subtitle,
  usedLabel,
  remainingLabel,
  percentUsed,
  isWarning,
  isExceeded,
  embedded = false,
}: {
  title: string;
  subtitle: string;
  usedLabel: string;
  remainingLabel: string;
  percentUsed: number;
  isWarning: boolean;
  isExceeded: boolean;
  embedded?: boolean;
}) {
  const progressTone = isExceeded
    ? "bg-rose-500"
    : isWarning
      ? "bg-amber-500"
      : "bg-emerald-500";
  const trackTone = isExceeded
    ? "bg-rose-50"
    : isWarning
      ? "bg-amber-50"
      : "bg-emerald-50";

  return (
    <div
      className={
        embedded
          ? "space-y-2.5"
          : "rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_-22px_rgba(15,23,42,0.42)]"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {title}
          </p>
          <p className="mt-1.5 text-base font-bold text-slate-900">
            {subtitle}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isExceeded
              ? "bg-rose-100 text-rose-700"
              : isWarning
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {percentUsed}%
        </span>
      </div>

      <div
        className={`${embedded ? "h-2.5" : "mt-4 h-3"} overflow-hidden rounded-full ${trackTone}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${progressTone}`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>

      <div
        className={`${embedded ? "flex items-center justify-between gap-3 text-[13px]" : "mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"}`}
      >
        <span className="font-semibold text-slate-700">{usedLabel}</span>
        <span className="text-slate-500">{remainingLabel}</span>
      </div>
    </div>
  );
}

function QuotaStackCard({
  aiQuota,
  storageQuota,
  className = "",
}: {
  aiQuota: NonNullable<
    NonNullable<ReturnType<typeof useAdminDashboard>["stats"]>["aiQuota"]
  >;
  storageQuota: NonNullable<
    NonNullable<ReturnType<typeof useAdminDashboard>["stats"]>["storageQuota"]
  >;
  className?: string;
}) {
  return (
    <Panel
      title={`Hạn mức sử dụng hệ thống - Tháng ${aiQuota.monthYear}`}
      className={className}
    >
      <div className="px-5 py-4 sm:px-6">
        <div className="rounded-[24px] bg-slate-50/70 p-4">
          <QuotaCard
            embedded
            title="AI quota"
            subtitle={""}
            usedLabel={`Đã dùng ${aiQuota.usedMinutes.toLocaleString("vi-VN")} / ${aiQuota.limitMinutes.toLocaleString("vi-VN")} phút`}
            remainingLabel={`Còn lại ${aiQuota.remainingMinutes.toLocaleString("vi-VN")} phút`}
            percentUsed={aiQuota.percentUsed}
            isWarning={aiQuota.isWarning}
            isExceeded={aiQuota.isExceeded}
          />

          <div className="my-4 h-px bg-slate-200/80" />

          <QuotaCard
            embedded
            title="Dung lượng GCS"
            subtitle={""}
            usedLabel={`Đã dùng ${formatBytesToGb(storageQuota.usedBytes)} / ${formatBytesToGb(storageQuota.limitMegabytes * 1024 * 1024)} GB`}
            remainingLabel={`Còn lại ${formatBytesToGb(storageQuota.remainingMegabytes * 1024 * 1024)} GB`}
            percentUsed={storageQuota.percentUsed}
            isWarning={storageQuota.isWarning}
            isExceeded={storageQuota.isExceeded}
          />
        </div>
      </div>
    </Panel>
  );
}

import { type DashboardFilter } from "./hooks/useAdminDashboard";

const DAY_OPTIONS: { label: string; filter: DashboardFilter }[] = [
  { label: "7 ngày gần nhất",  filter: { type: 'days', days: 7   } },
  { label: "30 ngày gần nhất", filter: { type: 'days', days: 30  } },
  { label: "90 ngày gần nhất", filter: { type: 'days', days: 90  } },
  { label: "1 năm gần nhất",   filter: { type: 'days', days: 365 } },
];

function buildMonthOptions(): { label: string; filter: DashboardFilter }[] {
  const opts: { label: string; filter: DashboardFilter }[] = [];
  const now = new Date();
  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year  = d.getFullYear();
    opts.push({
      label: `Tháng ${String(month).padStart(2,'0')}/${year}`,
      filter: { type: 'month', month, year },
    });
  }
  return opts;
}

const MONTH_OPTIONS = buildMonthOptions();

function filterLabel(f: DashboardFilter) {
  if (f.type === 'month') return `Tháng ${String(f.month).padStart(2,'0')}/${f.year}`;
  return DAY_OPTIONS.find((o) => o.filter.type === 'days' && (o.filter as any).days === f.days)?.label ?? 'Chọn kỳ';
}

function filterKey(f: DashboardFilter) {
  return f.type === 'month' ? `month-${f.month}-${f.year}` : `days-${f.days}`;
}

function exportDashboardXLSX(
  stats: NonNullable<ReturnType<typeof useAdminDashboard>["stats"]>,
  filter: DashboardFilter
) {
  const wb = XLSX.utils.book_new();
  const dateTxt = new Date().toLocaleString("vi-VN");
  const periodTxt = filterLabel(filter);

  // ── Helper: create a sheet from header + rows ──────────────────────────────
  function makeSheet(
    headers: string[],
    rows: (string | number)[][],
    title?: string
  ): XLSX.WorkSheet {
    const aoa: (string | number)[][] = [];
    if (title) {
      aoa.push([title]);
      aoa.push([`Kỳ: ${periodTxt}  |  Xuất lúc: ${dateTxt}`]);
      aoa.push([]);
    }
    aoa.push(headers);
    for (const r of rows) aoa.push(r);

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Auto column width
    const colWidths = headers.map((h, ci) => {
      const maxLen = Math.max(h.length, ...rows.map((r) => String(r[ci] ?? "").length));
      return { wch: Math.min(maxLen + 4, 50) };
    });
    ws["!cols"] = colWidths;

    // Style header row
    const headerRowIndex = title ? 3 : 0;
    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: C });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1E293B" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "94A3B8" } },
          bottom: { style: "thin", color: { rgb: "94A3B8" } },
          left: { style: "thin", color: { rgb: "94A3B8" } },
          right: { style: "thin", color: { rgb: "94A3B8" } },
        },
      };
    }

    // Style data rows (zebra)
    for (let R = headerRowIndex + 1; R <= range.e.r; R++) {
      const isEven = (R - headerRowIndex) % 2 === 0;
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellRef]) ws[cellRef] = { t: "z" };
        ws[cellRef].s = {
          fill: { fgColor: { rgb: isEven ? "F1F5F9" : "FFFFFF" } },
          border: {
            top: { style: "thin", color: { rgb: "E2E8F0" } },
            bottom: { style: "thin", color: { rgb: "E2E8F0" } },
            left: { style: "thin", color: { rgb: "E2E8F0" } },
            right: { style: "thin", color: { rgb: "E2E8F0" } },
          },
          alignment: { vertical: "center" },
        };
      }
    }

    ws["!freeze"] = { xSplit: 0, ySplit: headerRowIndex + 1 };
    return ws;
  }

  // ── Sheet 1: KPI ──────────────────────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb, makeSheet(
    ["Chỉ tiêu", "Giá trị (VNĐ)"],
    [
      ["Dòng tiền hệ thống", stats.grossRevenue],
      ["Lợi nhuận Admin",       stats.adminRevenue],
      ["Công nợ giảng viên",  stats.instructorPayout],
      ["Lượt ghi danh mới",   stats.newEnrollments],
      ["Hàng chờ kiểm duyệt", stats.pendingCourses],
    ],
    `📊 Tóm tắt KPI — ${periodTxt}`
  ), "Tổng quan");

  // ── Sheet 2: Recent orders ────────────────────────────────────────────────
  if (stats.recentOrders?.length) {
    XLSX.utils.book_append_sheet(wb, makeSheet(
      ["Mã đơn", "Khách hàng", "Khóa học", "Số tiền (VNĐ)", "Ngày giao dịch", "Phương thức", "Trạng thái"],
      stats.recentOrders.map((o) => [
        o.orderId, o.customerName, o.courseName, o.totalAmount,
        o.paidAt ? new Date(o.paidAt).toLocaleString("vi-VN") : "",
        o.paymentMethod, o.paymentStatus,
      ]),
      `🧾 Giao dịch — ${periodTxt}`
    ), "Giao dịch");
  }

  // ── Sheet 3: Revenue trend ────────────────────────────────────────────────
  if (stats.salesChart?.length) {
    XLSX.utils.book_append_sheet(wb, makeSheet(
      ["Tháng", "Lượt ghi danh", "Tổng doanh thu (VNĐ)", "Admin (VNĐ)", "Giảng viên (VNĐ)"],
      stats.salesChart.map((s) => [s.label, s.orders, s.grossRevenue, s.adminRevenue, s.instructorPayout]),
      "📈 Xu hướng doanh thu 12 tháng"
    ), "Doanh thu tháng");
  }

  // ── Sheet 4: Category revenue ─────────────────────────────────────────────
  if (stats.categoryRevenue?.length) {
    XLSX.utils.book_append_sheet(wb, makeSheet(
      ["Danh mục", "Doanh thu (VNĐ)", "Admin (VNĐ)", "Giảng viên (VNĐ)"],
      stats.categoryRevenue.map((c) => [c.name, c.revenue, c.adminRevenue, c.instructorPayout]),
      `🗂️ Doanh thu danh mục — ${periodTxt}`
    ), "Danh mục");
  }

  // ── Sheet 5: Top courses ──────────────────────────────────────────────────
  if (stats.topCourses?.length) {
    XLSX.utils.book_append_sheet(wb, makeSheet(
      ["Tên khóa học", "Lượt mua", "Doanh thu (VNĐ)", "Admin (VNĐ)", "GV (VNĐ)"],
      stats.topCourses.map((c) => [c.name, c.orders, c.revenue, c.adminRevenue, c.instructorRevenue]),
      `🏆 Top khóa học — ${periodTxt}`
    ), "Top khóa học");
  }

  // ── Sheet 6: Top instructors ──────────────────────────────────────────────
  if (stats.topInstructors?.length) {
    XLSX.utils.book_append_sheet(wb, makeSheet(
      ["Giảng viên", "Danh mục", "Học viên", "Doanh thu (VNĐ)", "Tỉ lệ (%)"],
      stats.topInstructors.map((i) => [i.name, i.category, i.students, i.revenue, i.percentage]),
      `👨‍🏫 Top giảng viên — ${periodTxt}`
    ), "Top giảng viên");
  }

  // File name
  const slug = filter.type === 'month'
    ? `thang${String(filter.month).padStart(2,'0')}-${filter.year}`
    : `${(filter as any).days}ngay`;
  XLSX.writeFile(wb, `bao-cao-${slug}-${new Date().toISOString().slice(0,10)}.xlsx`);
}

export default function AdminDashboard() {
  const [filter, setFilter] = useState<DashboardFilter>({ type: 'days', days: 30 });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { stats, loading } = useAdminDashboard(filter);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const chartPalette = {
    gross: "#2563eb",
    admin: "#10b981",
    instructor: "#f59e0b",
    category: [
      "#2563eb",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#06b6d4",
      "#ef4444",
    ],
  } as const;

  const revenueSplit = stats
    ? [
        {
          name: "Admin",
          value: stats.adminRevenue,
          color: chartPalette.admin,
        },
        {
          name: "Giảng viên",
          value: stats.instructorPayout,
          color: chartPalette.instructor,
        },
      ]
    : [];

  const revenueTrend = stats?.salesChart ?? [];
  const categoryRevenue = stats?.categoryRevenue ?? [];
  const topCourses = stats?.topCourses ?? [];
  const topInstructors = stats?.topInstructors ?? [];
  const recentTransactions = stats?.recentOrders ?? [];
  const aiQuota = stats?.aiQuota;
  const storageQuota = stats?.storageQuota;

  return (
    <AdminLayout>
      <div className="space-y-6 bg-slate-50/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
              Tổng quan hệ thống
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Time range + month dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="btn-time-range"
                onClick={() => setDropdownOpen((o) => !o)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <CalendarDays size={16} />
                {filterLabel(filter)}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_40px_-16px_rgba(15,23,42,0.35)]">
                  {/* Rolling windows */}
                  <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Khoảng thời gian
                  </div>
                  {DAY_OPTIONS.map((opt) => {
                    const active = filterKey(filter) === filterKey(opt.filter);
                    return (
                      <button
                        key={filterKey(opt.filter)}
                        onClick={() => { setFilter(opt.filter); setDropdownOpen(false); }}
                        className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold transition hover:bg-slate-50 ${
                          active ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}

                  {/* Month picker */}
                  <div className="mx-3 my-1.5 h-px bg-slate-100" />
                  <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Theo tháng
                  </div>
                  {MONTH_OPTIONS.map((opt) => {
                    const active = filterKey(filter) === filterKey(opt.filter);
                    return (
                      <button
                        key={filterKey(opt.filter)}
                        onClick={() => { setFilter(opt.filter); setDropdownOpen(false); }}
                        className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold transition hover:bg-slate-50 ${
                          active ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                  <div className="pb-1" />
                </div>
              )}
            </div>

            {/* Export Excel */}
            <button
              id="btn-export-report"
              disabled={!stats}
              onClick={() => stats && exportDashboardXLSX(stats, filter)}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Xuất báo cáo
            </button>
          </div>
        </div>

        {loading || !stats ? (
          <div className="grid gap-4 xl:grid-cols-5">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-[24px] border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <KpiCard
                label="Dòng tiền hệ thống"
                value={formatCurrency(stats.grossRevenue)}
                icon={<Wallet size={20} className="text-blue-600" />}
                tone="bg-blue-500"
                trend={stats.revenueGrowth}
                detail=""
              />
              <KpiCard
                label="Lợi nhuận Admin"
                value={formatCurrency(stats.adminRevenue)}
                icon={
                  <CircleDollarSign size={20} className="text-emerald-600" />
                }
                tone="bg-emerald-500"
                trend={stats.revenueGrowth}
                detail=""
              />
              <KpiCard
                label="Công nợ giảng viên"
                value={formatCurrency(stats.instructorPayout)}
                icon={<GraduationCap size={20} className="text-amber-600" />}
                tone="bg-amber-500"
                trend={stats.revenueGrowth}
                detail=""
              />
              <KpiCard
                label="Lượt ghi danh mới"
                value={stats.newEnrollments.toLocaleString("vi-VN")}
                icon={<ShoppingCart size={20} className="text-cyan-600" />}
                tone="bg-cyan-500"
                trend={stats.newEnrollmentGrowth}
                detail=""
              />
              <KpiCard
                label="Hàng chờ kiểm duyệt"
                value={stats.pendingCourses.toLocaleString("vi-VN")}
                icon={<Layers3 size={20} className="text-rose-600" />}
                tone="bg-rose-500"
                detail=""
              />
            </section>

            {aiQuota && storageQuota ? (
              <section className="hidden">
                <QuotaCard
                  title="AI quota kiểm duyệt"
                  subtitle={`Tháng ${aiQuota.monthYear}`}
                  usedLabel={`Đã dùng ${aiQuota.usedMinutes.toLocaleString("vi-VN")} / ${aiQuota.limitMinutes.toLocaleString("vi-VN")} phút`}
                  remainingLabel={`Còn lại ${aiQuota.remainingMinutes.toLocaleString("vi-VN")} phút`}
                  percentUsed={aiQuota.percentUsed}
                  isWarning={aiQuota.isWarning}
                  isExceeded={aiQuota.isExceeded}
                />
                <QuotaCard
                  title="Dung lượng video GCS"
                  subtitle={`Tháng ${storageQuota.monthYear}`}
                  usedLabel={`Đã dùng ${formatBytesToGb(storageQuota.usedBytes)} / ${formatBytesToGb(storageQuota.limitMegabytes * 1024 * 1024)} GB`}
                  remainingLabel={`Còn lại ${formatBytesToGb(storageQuota.remainingMegabytes * 1024 * 1024)} GB`}
                  percentUsed={storageQuota.percentUsed}
                  isWarning={storageQuota.isWarning}
                  isExceeded={storageQuota.isExceeded}
                />
              </section>
            ) : null}

            <section className="grid gap-6 xl:grid-cols-2 items-start">
              <div className="contents">
                <Panel
                  title="Xu hướng doanh thu"
                  subtitle=""
                  className="order-1 h-full"
                  action={
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      <TrendingUp size={14} />
                      12 tháng gần nhất
                    </span>
                  }
                >
                  <div className="px-4 pb-4 pt-4 sm:px-6">
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={revenueTrend}
                          margin={{ top: 10, right: 18, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid
                            stroke="#e2e8f0"
                            vertical={false}
                            strokeDasharray="3 3"
                          />
                          <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#64748b" }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#64748b" }}
                            tickFormatter={(value) =>
                              formatCompactCurrency(Number(value) || 0)
                            }
                          />
                          <Tooltip
                            formatter={(value: number, name: string) => {
                              if (name === "grossRevenue")
                                return [
                                  formatCurrency(value),
                                  "Tổng doanh thu",
                                ];
                              if (name === "adminRevenue")
                                return [formatCurrency(value), "Admin"];
                              if (name === "instructorPayout")
                                return [formatCurrency(value), "Giảng viên"];
                              return [value, name];
                            }}
                            labelFormatter={(label) => `Tháng ${label}`}
                            contentStyle={{
                              borderRadius: 16,
                              border: "1px solid #e2e8f0",
                              boxShadow:
                                "0 20px 40px -28px rgb(15 23 42 / 0.45)",
                            }}
                          />
                          <Legend
                            verticalAlign="top"
                            align="right"
                            height={28}
                            iconType="circle"
                            formatter={(value) => (
                              <span className="text-xs font-semibold text-slate-500">
                                {value === "grossRevenue"
                                  ? "Gross"
                                  : value === "adminRevenue"
                                    ? "Admin"
                                    : "Giảng viên"}
                              </span>
                            )}
                          />
                          <Line
                            type="monotone"
                            dataKey="grossRevenue"
                            stroke={chartPalette.gross}
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 5 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="adminRevenue"
                            stroke={chartPalette.admin}
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 5 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="instructorPayout"
                            stroke={chartPalette.instructor}
                            strokeWidth={3}
                            strokeDasharray="8 6"
                            dot={false}
                            activeDot={{ r: 5 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Panel>

                {aiQuota && storageQuota ? (
                  <QuotaStackCard
                    aiQuota={aiQuota}
                    storageQuota={storageQuota}
                    className="order-3 h-full"
                  />
                ) : null}
              </div>

              <div className="contents">
                <Panel
                  title="Cơ cấu chia doanh thu"
                  subtitle=""
                  className="order-2 h-full"
                >
                  <div className="px-4 pb-2 pt-4 sm:px-6">
                    <div className="relative h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={revenueSplit}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={72}
                            outerRadius={100}
                            paddingAngle={4}
                            stroke="#ffffff"
                            strokeWidth={4}
                          >
                            {revenueSplit.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number, name: string) => [
                              formatCurrency(value),
                              name,
                            ]}
                            contentStyle={{
                              borderRadius: 16,
                              border: "1px solid #e2e8f0",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Gross
                          </p>
                          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                            {formatCompactCurrency(stats.grossRevenue)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {revenueSplit.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="h-3.5 w-3.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm font-semibold text-slate-600">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">
                            {formatCurrency(item.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>

                <Panel title="Ghi danh theo tháng" className="order-4 h-full">
                  <div className="px-4 pb-5 pt-3 sm:px-6">
                    <div className="h-[210px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={revenueTrend}
                          margin={{ top: 8, right: 6, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid
                            stroke="#e2e8f0"
                            vertical={false}
                            strokeDasharray="3 3"
                          />
                          <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#64748b" }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#64748b" }}
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              value.toLocaleString("vi-VN"),
                              "Ghi danh",
                            ]}
                            contentStyle={{
                              borderRadius: 16,
                              border: "1px solid #e2e8f0",
                            }}
                          />
                          <Bar
                            dataKey="orders"
                            fill={chartPalette.gross}
                            radius={[12, 12, 0, 0]}
                            barSize={22}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Panel>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Panel title="Cơ cấu doanh thu theo danh mục">
                <div className="px-4 pb-5 pt-4 sm:px-6">
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryRevenue}
                        layout="vertical"
                        margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                      >
                        <CartesianGrid
                          stroke="#e2e8f0"
                          horizontal={false}
                          strokeDasharray="3 3"
                        />
                        <XAxis
                          type="number"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#64748b" }}
                          tickFormatter={(value) =>
                            formatCompactCurrency(Number(value) || 0)
                          }
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#334155" }}
                          width={120}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "Doanh thu",
                          ]}
                          contentStyle={{
                            borderRadius: 16,
                            border: "1px solid #e2e8f0",
                          }}
                        />
                        <Bar
                          dataKey="revenue"
                          radius={[0, 12, 12, 0]}
                          barSize={18}
                        >
                          {categoryRevenue.map((entry, index) => (
                            <Cell
                              key={entry.id}
                              fill={
                                chartPalette.category[
                                  index % chartPalette.category.length
                                ]
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Panel>

              <Panel title="Top khóa học bán chạy">
                <div className="px-4 pb-5 pt-4 sm:px-6">
                  {topCourses.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                      Chưa có dữ liệu khóa học.
                    </div>
                  ) : (
                    <div className="h-[320px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topCourses.slice(0, 5)}
                          layout="vertical"
                          margin={{ top: 10, right: 16, left: 18, bottom: 0 }}
                        >
                          <CartesianGrid
                            stroke="#e2e8f0"
                            horizontal={false}
                            strokeDasharray="3 3"
                          />
                          <XAxis
                            type="number"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#64748b" }}
                            tickFormatter={(value) =>
                              formatCompactCurrency(Number(value) || 0)
                            }
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#334155" }}
                            width={130}
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              formatCurrency(value),
                              "Doanh thu",
                            ]}
                            contentStyle={{
                              borderRadius: 16,
                              border: "1px solid #e2e8f0",
                            }}
                          />
                          <Bar
                            dataKey="revenue"
                            radius={[0, 12, 12, 0]}
                            barSize={18}
                            fill={chartPalette.admin}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </Panel>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <Panel title="Top giảng viên">
                <div className="px-4 pb-5 pt-4 sm:px-6">
                  {topInstructors.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                      Chưa có dữ liệu giảng viên.
                    </div>
                  ) : (
                    <div className="h-[320px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topInstructors.slice(0, 5)}
                          layout="vertical"
                          margin={{ top: 10, right: 16, left: 18, bottom: 0 }}
                        >
                          <CartesianGrid
                            stroke="#e2e8f0"
                            horizontal={false}
                            strokeDasharray="3 3"
                          />
                          <XAxis
                            type="number"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#64748b" }}
                            tickFormatter={(value) =>
                              formatCompactCurrency(Number(value) || 0)
                            }
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#334155" }}
                            width={120}
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              formatCurrency(value),
                              "Doanh thu",
                            ]}
                            contentStyle={{
                              borderRadius: 16,
                              border: "1px solid #e2e8f0",
                            }}
                          />
                          <Bar
                            dataKey="revenue"
                            radius={[0, 12, 12, 0]}
                            barSize={18}
                            fill={chartPalette.instructor}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </Panel>

              <Panel title="Giao dịch mới nhất">
                <div className="max-h-[372px] space-y-3 overflow-y-auto px-4 py-4 sm:px-6 custom-scrollbar">
                  {recentTransactions.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                      Chưa có giao dịch nào.
                    </div>
                  ) : (
                    recentTransactions.map((order) => (
                      <div
                        key={order.orderId}
                        className="rounded-2xl border border-slate-100 px-4 py-4 transition hover:border-slate-200 hover:bg-slate-50/60"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {order.customerName}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                              {order.courseName}
                            </p>
                            <p className="mt-2 text-xs text-slate-400">
                              {formatDate(order.paidAt)} · {order.paymentMethod}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900">
                              {formatCurrency(order.totalAmount)}
                            </p>
                            <div className="mt-2 flex justify-end">
                              <StatusBadge value={order.paymentStatus} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
