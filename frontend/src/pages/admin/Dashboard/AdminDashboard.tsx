import {
    Users,
    BookOpen,
    Wallet,
    GraduationCap,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    CalendarDays,
    ChevronDown,
    BarChart3,
} from 'lucide-react';
import {
    ComposedChart,
    BarChart,
    Bar,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
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
    return date.toLocaleDateString('vi-VN');
}

function GrowthIndicator({ value }: { value: number }) {
    const isPositive = value >= 0;
    return (
        <div
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
        >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>
                {isPositive ? '+' : ''}
                {value}% so với trước
            </span>
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

function RevenueMetric({
    value,
    label,
    dotClass,
    valueClass = 'text-slate-800',
}: {
    value: string;
    label: string;
    dotClass: string;
    valueClass?: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 border-b border-dashed border-slate-200 px-4 py-5 text-center md:border-b-0 md:border-r last:border-r-0">
            <p className={`text-[30px] font-black tracking-tight ${valueClass}`}>{value}</p>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <span className={`h-3 w-3 rounded-full ${dotClass}`} />
                <span>{label}</span>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { stats, loading } = useAdminDashboard();

    const memberPieData = stats
        ? [
            { name: 'Hoc vien', value: stats.totalStudents, color: '#3b82f6' },
            { name: 'Giang vien', value: stats.totalInstructors, color: '#10b981' },
        ]
        : [];

    const latestOrders = stats?.recentOrders ?? [];
    const totalMembers = (stats?.totalStudents ?? 0) + (stats?.totalInstructors ?? 0);
    const salesOverview = stats?.salesOverview ?? {
        orders: 0,
        earnings: 0,
        grossRevenue: 0,
        adminRevenue: 0,
        instructorPayout: 0,
        refunds: 0,
    };
    const salesChart = stats?.salesChart ?? [];
    const topSellingCourses = stats?.topCourses ?? [];
    const topInstructors = stats?.topInstructors ?? [];

    return (
        <AdminLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-wrap justify-end gap-3">
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-[#1dbf73] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#18a864]">
                        <CalendarDays size={16} />
                        30 ngày gần nhất
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-[#0028b6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b36cf]">
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
                                label="Doanh thu admin (60%)"
                                value={formatCurrency(stats.totalRevenue)}
                                icon={<Wallet size={20} className="text-[#1dbf73]" />}
                                iconClass="bg-emerald-50 text-[#1dbf73]"
                                growth={stats.revenueGrowth}
                                accentClass="bg-emerald-500"
                            />
                        </section>

                        <section className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
                            <div className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-[0_14px_40px_-28px_rgba(15,23,42,0.55)]">
                                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                                    <h2 className="text-[18px] font-bold text-slate-900">Doanh thu</h2>
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                        <button className="rounded-lg bg-blue-50 px-3 py-1.5 text-blue-600">ALL</button>
                                        <button className="rounded-lg bg-slate-100 px-3 py-1.5">1M</button>
                                        <button className="rounded-lg bg-slate-100 px-3 py-1.5">6M</button>
                                        <button className="rounded-lg bg-slate-100 px-3 py-1.5">1Y</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3">
                                    <RevenueMetric
                                        value={formatCompactCurrency(salesOverview.grossRevenue)}
                                        label="Gross"
                                        dotClass="bg-blue-600"
                                    />
                                    <RevenueMetric
                                        value={formatCompactCurrency(salesOverview.adminRevenue)}
                                        label="Admin 60%"
                                        dotClass="bg-teal-500"
                                    />
                                    <RevenueMetric
                                        value={formatCompactCurrency(salesOverview.instructorPayout)}
                                        label="Giảng viên 40%"
                                        dotClass="bg-orange-500"
                                        valueClass="text-teal-500"
                                    />
                                </div>

                                <div className="px-4 pb-4 pt-6 sm:px-6">
                                    <div className="h-[360px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={salesChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                                <CartesianGrid stroke="#eef2f7" vertical={true} strokeDasharray="0 0" />
                                                <XAxis
                                                    dataKey="label"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                                    tickFormatter={(value) => formatCompactCurrency(Number(value) || 0)}
                                                />
                                                <Tooltip
                                                    formatter={(value: any, name: string) => {
                                                        if (name === 'earnings') {
                                                            return [formatCurrency(Number(value) || 0), 'Admin 60%'];
                                                        }
                                                        if (name === 'instructorPayout') {
                                                            return [formatCurrency(Number(value) || 0), 'Giảng viên 40%'];
                                                        }
                                                        return [Number(value).toLocaleString('vi-VN'), 'Orders'];
                                                    }}
                                                    contentStyle={{
                                                        borderRadius: '14px',
                                                        border: '1px solid #e2e8f0',
                                                        boxShadow: '0 12px 30px -20px rgb(15 23 42 / 0.35)',
                                                    }}
                                                />
                                                <Bar dataKey="earnings" fill="#24b7aa" barSize={24} radius={[0, 0, 0, 0]} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="orders"
                                                    stroke="#425996"
                                                    strokeWidth={3}
                                                    dot={false}
                                                    activeDot={{ r: 5 }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="instructorPayout"
                                                    stroke="#f26743"
                                                    strokeWidth={3}
                                                    strokeDasharray="8 6"
                                                    dot={false}
                                                    activeDot={{ r: 4 }}
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 flex flex-wrap items-center justify-center gap-8 text-sm font-medium text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <span className="h-4 w-4 rounded-full bg-[#425996]" />
                                            <span>Orders</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="h-4 w-4 rounded-full bg-[#24b7aa]" />
                                            <span>Admin 60%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="h-4 w-4 rounded-full bg-[#f26743]" />
                                            <span>Giảng viên 40%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.55)]">
                                <div className="mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                                        <h2 className="text-lg font-bold text-slate-900">Cơ cấu người dùng</h2>
                                    </div>
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
                                                contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}
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

                        <section className="grid gap-6 xl:grid-cols-2">
                            <div className="flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                                    <h2 className="text-[16px] font-semibold text-slate-800">Top khóa học</h2>
                                    {/* <button className="flex items-center gap-1 text-[13px] font-medium text-slate-500 transition hover:text-slate-800">
                                        <span className="mr-1 uppercase text-[11px] font-bold tracking-wider">Sort by:</span>
                                        Hom nay
                                        <ChevronDown size={14} />
                                    </button> */}
                                </div>
                                <div className="flex-1 p-5">
                                    {topSellingCourses.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-slate-500">Chưa có dữ liệu</p>
                                    ) : (
                                        <div className="space-y-5">
                                            {topSellingCourses.map((course) => (
                                                <div key={course.id} className="flex items-center justify-between border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                                                    <div className="flex w-[40%] items-center gap-4">
                                                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                                            {course.image ? (
                                                                <img src={course.image} alt={course.name} className="h-full w-full object-cover" />
                                                            ) : null}
                                                        </div>
                                                        <div>
                                                            <h3 className="line-clamp-1 text-[14px] font-semibold text-slate-800">{course.name}</h3>
                                                            <p className="mt-0.5 text-[13px] text-slate-500">{formatDate(course.date)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="w-[20%]">
                                                        <p className="text-[14px] font-semibold text-slate-800">{formatCurrency(course.price)}</p>
                                                        <p className="mt-0.5 text-[13px] text-slate-500">Giá</p>
                                                    </div>
                                                    <div className="w-[15%]">
                                                        <p className="text-[14px] font-semibold text-slate-800">{course.orders}</p>
                                                        <p className="mt-0.5 text-[13px] text-slate-500">Lượt bán</p>
                                                    </div>
                                                    <div className="w-[25%] text-right">
                                                        <p className="text-[14px] font-semibold text-slate-800">{formatCurrency(course.revenue)}</p>
                                                        <p className="mt-0.5 text-[13px] text-slate-500">Gross</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                                    <h2 className="text-[16px] font-semibold text-slate-800">Top giảng viên</h2>
                                    {/* <button className="flex items-center gap-1 text-[13px] font-medium text-slate-500 transition hover:text-slate-800">
                                        Bao cao
                                        <ChevronDown size={14} />
                                    </button> */}
                                </div>
                                <div className="flex-1 p-5">
                                    {topInstructors.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-slate-500">Chưa có dữ liệu.</p>
                                    ) : (
                                        <div className="space-y-5">
                                            {topInstructors.map((instructor) => (
                                                <div key={instructor.id} className="flex items-center justify-between border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                                                    <div className="flex w-[35%] items-center gap-4">
                                                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200">
                                                            {instructor.avatar ? (
                                                                <img src={instructor.avatar} alt={instructor.name} className="h-full w-full object-cover" />
                                                            ) : null}
                                                        </div>
                                                        <div>
                                                            <h3 className="line-clamp-1 text-[14px] font-semibold text-slate-800">{instructor.name}</h3>
                                                            <p className="mt-0.5 line-clamp-1 text-[13px] text-slate-500">{instructor.category}</p>
                                                        </div>
                                                    </div>
                                                    <div className="w-[20%] text-center">
                                                        <p className="text-[14px] font-semibold text-slate-800">{Number(instructor.students).toLocaleString()}</p>
                                                        <p className="mt-0.5 text-[13px] text-slate-500">Học viên</p>
                                                    </div>
                                                    <div className="w-[25%] text-right">
                                                        <p className="text-[14px] font-semibold text-slate-800">{formatCurrency(instructor.revenue)}</p>
                                                        <p className="mt-0.5 text-[13px] text-slate-500">Giảng viên 40%</p>
                                                    </div>
                                                    <div className="flex w-[20%] items-center justify-end gap-2">
                                                        <span className="text-[14px] font-bold text-slate-800">{instructor.percentage}%</span>
                                                        <BarChart3 size={16} className="text-emerald-500" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.55)]">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-amber-500" />
                                        <h2 className="text-lg font-bold text-slate-900">Giao dịch gần đây</h2>
                                    </div>
                                </div>
                            </div>
                            <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                                {latestOrders.length === 0 ? (
                                    <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Chưa có giao dịch nào</div>
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
                                                {/* <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                                                    <ShoppingCart size={11} />
                                                    Đã thanh toán
                                                </span> */}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
