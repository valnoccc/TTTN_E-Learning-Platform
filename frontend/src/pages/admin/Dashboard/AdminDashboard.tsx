import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  GraduationCap,
  Layers3,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';
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
} from 'recharts';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdminDashboard } from './hooks/useAdminDashboard';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatPercent(value: number) {
  const rounded = Number.isFinite(value) ? value.toFixed(1) : '0.0';
  return `${value >= 0 ? '+' : ''}${rounded}%`;
}

function TrendBadge({ value }: { value: number }) {
  const positive = value >= 0;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
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
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl opacity-20 ${tone}`} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-[28px] font-black tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone} bg-opacity-10 text-current`}>
          {icon}
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-3">
        {typeof trend === 'number' ? <TrendBadge value={trend} /> : <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">{detail}</span>}
        {typeof trend === 'number' ? (
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
  className = '',
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_36px_-28px_rgba(15,23,42,0.5)] ${className}`}>
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
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
    status === 'PAID'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'PENDING'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  const { stats, loading } = useAdminDashboard();

  const chartPalette = {
    gross: '#2563eb',
    admin: '#10b981',
    instructor: '#f59e0b',
    category: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'],
  } as const;

  const revenueSplit = stats
    ? [
        {
          name: 'Admin 20%',
          value: stats.adminRevenue,
          color: chartPalette.admin,
        },
        {
          name: 'Giảng viên 80%',
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

  return (
    <AdminLayout>
      <div className="space-y-6 bg-slate-50/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Admin dashboard
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
              Tổng quan vận hành
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Theo dõi doanh thu gộp, chia sẻ 20/80, lượt ghi danh mới và hàng chờ kiểm duyệt
              trong cùng một màn hình.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
              <CalendarDays size={16} />
              30 ngày gần nhất
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
              <BarChart3 size={16} />
              Xuất báo cáo
            </button>
          </div>
        </div>

        {loading || !stats ? (
          <div className="grid gap-4 xl:grid-cols-5">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-[24px] border border-slate-200 bg-white" />
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
                detail="Gross volume"
              />
              <KpiCard
                label="Lợi nhuận Admin"
                value={formatCurrency(stats.adminRevenue)}
                icon={<CircleDollarSign size={20} className="text-emerald-600" />}
                tone="bg-emerald-500"
                trend={stats.revenueGrowth}
                detail="Phần giữ lại 20%"
              />
              <KpiCard
                label="Công nợ giảng viên"
                value={formatCurrency(stats.instructorPayout)}
                icon={<GraduationCap size={20} className="text-amber-600" />}
                tone="bg-amber-500"
                trend={stats.revenueGrowth}
                detail="Khoản chi 80%"
              />
              <KpiCard
                label="Lượt ghi danh mới"
                value={stats.newEnrollments.toLocaleString('vi-VN')}
                icon={<ShoppingCart size={20} className="text-cyan-600" />}
                tone="bg-cyan-500"
                trend={stats.newEnrollmentGrowth}
                detail="30 ngày qua"
              />
              <KpiCard
                label="Hàng chờ kiểm duyệt"
                value={stats.pendingCourses.toLocaleString('vi-VN')}
                icon={<Layers3 size={20} className="text-rose-600" />}
                tone="bg-rose-500"
                detail="Khóa học PENDING"
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
              <Panel
                title="Xu hướng doanh thu"
                subtitle="3 đường dữ liệu: tổng doanh thu, phần Admin 20%, phần giảng viên 80%."
                action={
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    <TrendingUp size={14} />
                    12 tháng gần nhất
                  </span>
                }
              >
                <div className="px-4 pb-5 pt-4 sm:px-6">
                  <div className="h-[370px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={revenueTrend} margin={{ top: 10, right: 18, left: -10, bottom: 0 }}>
                        <CartesianGrid stroke="#e2e8f0" vertical={false} strokeDasharray="3 3" />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickFormatter={(value) => formatCompactCurrency(Number(value) || 0)}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            if (name === 'grossRevenue') return [formatCurrency(value), 'Tổng doanh thu'];
                            if (name === 'adminRevenue') return [formatCurrency(value), 'Admin 20%'];
                            if (name === 'instructorPayout') return [formatCurrency(value), 'Giảng viên 80%'];
                            return [value, name];
                          }}
                          labelFormatter={(label) => `Tháng ${label}`}
                          contentStyle={{
                            borderRadius: 16,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 20px 40px -28px rgb(15 23 42 / 0.45)',
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          height={28}
                          iconType="circle"
                          formatter={(value) => (
                            <span className="text-xs font-semibold text-slate-500">
                              {value === 'grossRevenue'
                                ? 'Gross'
                                : value === 'adminRevenue'
                                  ? 'Admin 20%'
                                  : 'Giảng viên 80%'}
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

              <div className="space-y-6">
                <Panel
                  title="Cơ cấu chia doanh thu"
                  subtitle="Admin 20% và giảng viên 80% trên tổng dòng tiền."
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
                            formatter={(value: number, name: string) => [formatCurrency(value), name]}
                            contentStyle={{
                              borderRadius: 16,
                              border: '1px solid #e2e8f0',
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
                        <div key={item.name} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm font-semibold text-slate-600">{item.name}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>

                <Panel
                  title="Ghi danh theo tháng"
                  subtitle="Số lượt thanh toán thành công đang tạo ra doanh thu."
                >
                  <div className="px-4 pb-5 pt-3 sm:px-6">
                    <div className="h-[210px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueTrend} margin={{ top: 8, right: 6, left: -10, bottom: 0 }}>
                          <CartesianGrid stroke="#e2e8f0" vertical={false} strokeDasharray="3 3" />
                          <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                          />
                          <Tooltip
                            formatter={(value: number) => [value.toLocaleString('vi-VN'), 'Ghi danh']}
                            contentStyle={{ borderRadius: 16, border: '1px solid #e2e8f0' }}
                          />
                          <Bar dataKey="orders" fill={chartPalette.gross} radius={[12, 12, 0, 0]} barSize={22} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Panel>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Panel
                title="Cơ cấu doanh thu theo danh mục"
                subtitle="Cho thấy danh mục nào đang kéo doanh thu tốt nhất để ưu tiên marketing."
              >
                <div className="px-4 pb-5 pt-4 sm:px-6">
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryRevenue}
                        layout="vertical"
                        margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                      >
                        <CartesianGrid stroke="#e2e8f0" horizontal={false} strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          tickFormatter={(value) => formatCompactCurrency(Number(value) || 0)}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#334155' }}
                          width={120}
                        />
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                          contentStyle={{ borderRadius: 16, border: '1px solid #e2e8f0' }}
                        />
                        <Bar dataKey="revenue" radius={[0, 12, 12, 0]} barSize={18}>
                          {categoryRevenue.map((entry, index) => (
                            <Cell key={entry.id} fill={chartPalette.category[index % chartPalette.category.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Panel>

              <Panel
                title="Top khóa học bán chạy"
                subtitle="Tập trung vào khóa học đang mang lại doanh thu cao nhất."
              >
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
                          <CartesianGrid stroke="#e2e8f0" horizontal={false} strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            tickFormatter={(value) => formatCompactCurrency(Number(value) || 0)}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#334155' }}
                            width={130}
                          />
                          <Tooltip
                            formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                            contentStyle={{ borderRadius: 16, border: '1px solid #e2e8f0' }}
                          />
                          <Bar dataKey="revenue" radius={[0, 12, 12, 0]} barSize={18} fill={chartPalette.admin} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </Panel>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <Panel
                title="Top giảng viên"
                subtitle="Đo theo doanh thu thực nhận 80% và số học viên đang trả tiền."
              >
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
                          <CartesianGrid stroke="#e2e8f0" horizontal={false} strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            tickFormatter={(value) => formatCompactCurrency(Number(value) || 0)}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#334155' }}
                            width={120}
                          />
                          <Tooltip
                            formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                            contentStyle={{ borderRadius: 16, border: '1px solid #e2e8f0' }}
                          />
                          <Bar dataKey="revenue" radius={[0, 12, 12, 0]} barSize={18} fill={chartPalette.instructor} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </Panel>

              <Panel
                title="Giao dịch mới nhất"
                subtitle="Thông tin thanh toán thực tế từ hệ thống."
              >
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
                            <p className="truncate text-sm font-bold text-slate-900">{order.customerName}</p>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{order.courseName}</p>
                            <p className="mt-2 text-xs text-slate-400">
                              {formatDate(order.paidAt)} · {order.paymentMethod}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900">{formatCurrency(order.totalAmount)}</p>
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
