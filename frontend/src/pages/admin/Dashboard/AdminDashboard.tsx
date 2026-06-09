import {
    Users,
    BookOpen,
    Wallet,
    GraduationCap,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    CalendarDays,
    ArrowRight,
    BadgeCheck,
    Clock3,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAdminDashboard } from './hooks/useAdminDashboard';

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
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
    return date.toLocaleDateString('vi-VN');
}

function GrowthIndicator({ value }: { value: number }) {
    const isPositive = value >= 0;

    return (
        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{isPositive ? '+' : ''}{value}% so với tháng trước</span>
        </div>
    );
}

function StatCard({
    label,
    value,
    icon,
    iconClass,
    growth,
    accentClass,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    iconClass: string;
    growth: number;
    accentClass: string;
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-20px_rgba(15,23,42,0.45)]">
            <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl opacity-20 ${accentClass}`} />
            <div className="relative flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}>
                    {icon}
                </div>
            </div>
            <div className="relative mt-4">
                <GrowthIndicator value={growth} />
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { stats, loading } = useAdminDashboard();

    const chartData = stats?.revenueChart.map((item) => ({
        name: `T${item.thang}/${item.nam.toString().slice(2)}`,
        doanhThu: Number(item.doanhThu),
    })) || [];

    const memberPieData = stats ? [
        { name: 'Học viên', value: stats.totalStudents, color: '#3b82f6' },
        { name: 'Giảng viên', value: stats.totalInstructors, color: '#10b981' },
    ] : [];

    const latestOrders = stats?.recentOrders ?? [];
    const totalMembers = (stats?.totalStudents ?? 0) + (stats?.totalInstructors ?? 0);

    return (
        <AdminLayout>
            <div className="space-y-6 animate-fade-in">
                {/* <section className="overflow-hidden rounded-[28px] border border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.6)] lg:p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(29,191,115,0.22),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_32%)]" />
                    <div className="relative grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                                <BadgeCheck size={14} className="text-emerald-400" />
                                Phân hệ quản trị viên
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                                    Hệ thống Quản trị tổng quan
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                                    Theo dõi doanh thu, số lượng người dùng, khóa học và hoạt động giao dịch trong một giao diện
                                    giàu tương tác, gọn hơn nhưng vẫn giữ luồng dữ liệu hiện tại.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15">
                                    <CalendarDays size={16} />
                                    30 ngày gần nhất
                                </button>
                                <button className="inline-flex items-center gap-2 rounded-2xl bg-[#1dbf73] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#18a864]">
                                    Xuất báo cáo
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
                            <div className="flex items-center justify-between rounded-2xl bg-white/8 px-4 py-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Trạng thái</p>
                                    <p className="mt-1 text-sm font-semibold text-white">Hệ thống ổn định</p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                                    <Clock3 size={18} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                    <p className="text-[11px] text-slate-400">Học viên</p>
                                    <p className="mt-1 text-xl font-extrabold text-white">{stats?.totalStudents ?? 0}</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                    <p className="text-[11px] text-slate-400">Giảng viên</p>
                                    <p className="mt-1 text-xl font-extrabold text-white">{stats?.totalInstructors ?? 0}</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                    <p className="text-[11px] text-slate-400">Khóa học</p>
                                    <p className="mt-1 text-xl font-extrabold text-white">{stats?.totalCourses ?? 0}</p>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Tổng thành viên</p>
                                <div className="mt-2 flex items-end justify-between">
                                    <p className="text-3xl font-black text-white">{totalMembers}</p>
                                    <p className="text-sm font-semibold text-emerald-300">+{stats?.studentGrowth ?? 0}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section> */}

                <div className="flex flex-wrap gap-3 justify-end">
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-[#1dbf73] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#18a864]">
                        <CalendarDays size={16} />
                        30 ngày gần nhất
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-[#0028b6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#18a864]">
                        Xuất báo cáo
                    </button>
                </div>

                {loading || !stats ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {[...Array(4)].map((_, index) => (
                            <div key={index} className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                        ))}
                    </div>
                ) : (
                    <>
                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                label="Tổng học viên"
                                value={stats.totalStudents.toLocaleString('vi-VN')}
                                icon={<Users size={20} className="text-blue-600" />}
                                iconClass="bg-blue-50 text-blue-600"
                                growth={stats.studentGrowth}
                                accentClass="bg-blue-500"
                            />
                            <StatCard
                                label="Tổng giảng viên"
                                value={stats.totalInstructors.toLocaleString('vi-VN')}
                                icon={<GraduationCap size={20} className="text-emerald-600" />}
                                iconClass="bg-emerald-50 text-emerald-600"
                                growth={stats.instructorGrowth}
                                accentClass="bg-emerald-500"
                            />
                            <StatCard
                                label="Tổng khóa học"
                                value={stats.totalCourses.toLocaleString('vi-VN')}
                                icon={<BookOpen size={20} className="text-amber-600" />}
                                iconClass="bg-amber-50 text-amber-600"
                                growth={stats.courseGrowth}
                                accentClass="bg-amber-500"
                            />
                            <StatCard
                                label="Tổng doanh thu"
                                value={formatCurrency(stats.totalRevenue)}
                                icon={<Wallet size={20} className="text-[#1dbf73]" />}
                                iconClass="bg-emerald-50 text-[#1dbf73]"
                                growth={stats.revenueGrowth}
                                accentClass="bg-emerald-500"
                            />
                        </section>

                        <section className="grid gap-6 xl:grid-cols-[1.5fr_0.95fr]">
                            <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.55)]">
                                <div className="mb-6 flex items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-[#1dbf73]" />
                                            <h2 className="text-lg font-bold text-slate-900">Xu hướng doanh thu gần đây</h2>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-500">Biểu đồ 6 tháng gần nhất từ dữ liệu thanh toán.</p>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                        Biểu đồ đường
                                    </span>
                                </div>
                                <div className="h-[320px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#1dbf73" stopOpacity={0.28} />
                                                    <stop offset="95%" stopColor="#1dbf73" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#64748b' }}
                                                tickFormatter={(value) => formatCompactCurrency(Number(value) || 0)}
                                            />
                                            <Tooltip
                                                formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Doanh thu']}
                                                contentStyle={{
                                                    borderRadius: '14px',
                                                    border: '1px solid #e2e8f0',
                                                    boxShadow: '0 12px 30px -20px rgb(15 23 42 / 0.35)',
                                                }}
                                            />
                                            <Area type="monotone" dataKey="doanhThu" stroke="#1dbf73" strokeWidth={3} fill="url(#revenueGradient)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.55)]">
                                <div className="mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                                        <h2 className="text-lg font-bold text-slate-900">Cơ cấu thành viên</h2>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">So sánh học viên và giảng viên đang hoạt động.</p>
                                </div>
                                <div className="relative mt-2 h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={memberPieData}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={70}
                                                outerRadius={92}
                                                paddingAngle={3}
                                                strokeWidth={4}
                                            >
                                                {memberPieData.map((entry) => (
                                                    <Cell key={entry.name} fill={entry.color} stroke="#ffffff" />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: any, name: string) => [Number(value).toLocaleString('vi-VN'), name]}
                                                contentStyle={{
                                                    borderRadius: '14px',
                                                    border: '1px solid #e2e8f0',
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-3xl font-black text-slate-900">{totalMembers.toLocaleString('vi-VN')}</p>
                                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Thành viên</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 space-y-3">
                                    {memberPieData.map((item) => (
                                        <div key={item.name} className="flex items-center justify-between border-b border-slate-50 pb-2 text-sm last:border-b-0 last:pb-0">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                                <span className="font-medium">{item.name}</span>
                                            </div>
                                            <span className="font-bold text-slate-800">{item.value.toLocaleString('vi-VN')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
                            <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.55)]">
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-blue-500" />
                                            <h2 className="text-lg font-bold text-slate-900">Thống kê doanh thu theo tháng</h2>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-500">Dạng cột để nhìn rõ biên độ tăng giảm từng tháng.</p>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                        Biểu đồ cột
                                    </span>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#64748b' }}
                                                tickFormatter={(value) => formatCompactCurrency(Number(value) || 0)}
                                            />
                                            <Tooltip
                                                formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Doanh thu']}
                                                contentStyle={{
                                                    borderRadius: '14px',
                                                    border: '1px solid #e2e8f0',
                                                    boxShadow: '0 12px 30px -20px rgb(15 23 42 / 0.35)',
                                                }}
                                            />
                                            <Bar dataKey="doanhThu" radius={[10, 10, 0, 0]} fill="#1dbf73" barSize={28} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.55)]">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-amber-500" />
                                        <h2 className="text-lg font-bold text-slate-900">Giao dịch gần đây</h2>
                                    </div>
                                    <button className="text-xs font-semibold text-[#1dbf73] transition hover:text-[#18a864]">
                                        Xem tất cả
                                    </button>
                                </div>
                                <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                                    {latestOrders.length === 0 ? (
                                        <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                                            Chưa có giao dịch nào.
                                        </div>
                                    ) : (
                                        latestOrders.map((order) => (
                                            <div
                                                key={order.orderId}
                                                className="flex items-start justify-between rounded-2xl border border-slate-100 px-4 py-3 transition hover:border-slate-200 hover:bg-slate-50/60"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-slate-900">{order.customerName}</p>
                                                    <p className="mt-1 text-[11px] font-medium text-slate-400">
                                                        {formatDate(order.paidAt)} • {order.paymentMethod}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-[#1dbf73]">+{formatCurrency(order.totalAmount)}</p>
                                                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                                                        <ShoppingCart size={11} />
                                                        Đã thanh toán
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
