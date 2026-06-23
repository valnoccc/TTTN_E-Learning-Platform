import {
    ArrowDownRight,
    ArrowUpRight,
    CheckCircle2,
    DollarSign,
    Star,
    Users,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import InstructorLayout from '../../../layouts/InstructorLayout';
import { useInstructorReports } from './hooks/useInstructorReports';

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatCompactCurrency(value: number) {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
    }

    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(0)}K`;
    }

    return `${value}`;
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value));
}

function renderGrowth(value: number, suffix: string) {
    const positive = value >= 0;
    const Icon = positive ? ArrowUpRight : ArrowDownRight;

    return (
        <div
            className={`mt-2 flex items-center gap-1.5 text-[12px] font-medium ${positive ? 'text-emerald-600' : 'text-rose-600'
                }`}
        >
            <Icon size={14} />
            <span>
                {positive ? '+' : ''}
                {value}% {suffix}
            </span>
        </div>
    );
}

export default function InstructorReports() {
    const {
        loading,
        courses,
        board,
        courseId,
        setCourseId,
        range,
        setRange,
        loadReports,
        selectedCourseName,
    } = useInstructorReports();

    return (
        <InstructorLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                            Phân hệ giảng viên
                        </p>
                        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                            Báo cáo doanh thu
                        </h1>
                        <p className="mt-2 text-[14px] text-slate-500">
                            Theo dõi tăng trưởng doanh thu và số lượng học viên đăng ký theo bộ lọc hiện tại.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <select
                            value={courseId}
                            onChange={(event) => {
                                setCourseId(event.target.value);
                                void loadReports(event.target.value, range);
                            }}
                            className="rounded border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="">Tất cả khóa học</option>
                            {courses.map((course) => (
                                <option key={course.courseId} value={course.courseId}>
                                    {course.courseName}
                                </option>
                            ))}
                        </select>
                        <select
                            value={range}
                            onChange={(event) => {
                                const nextRange = event.target.value as typeof range;
                                setRange(nextRange);
                                void loadReports(courseId, nextRange);
                            }}
                            className="rounded border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="30days">30 ngày qua</option>
                            <option value="this_month">Tháng này</option>
                            <option value="last_month">Tháng trước</option>
                            <option value="this_year">Năm nay</option>
                            <option value="all_time">Toàn thời gian</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-[13px] font-semibold text-slate-500">Doanh thu giảng viên (40%)</p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                                <DollarSign size={16} />
                            </div>
                        </div>
                        <p className="mt-4 text-2xl font-bold text-slate-900">
                            {formatCurrency(board.overview.totalRevenue)}
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-slate-500">
                            Gross {formatCurrency(board.overview.grossRevenue)} · Admin 60% {formatCurrency(board.overview.adminRevenue)}
                        </p>
                        {renderGrowth(board.overview.revenueGrowth, 'so với kỳ trước')}
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-[13px] font-semibold text-slate-500">Lượt đăng ký mới</p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                                <Users size={16} />
                            </div>
                        </div>
                        <p className="mt-4 text-2xl font-bold text-slate-900">
                            {board.overview.newEnrollments}
                        </p>
                        {renderGrowth(board.overview.enrollmentGrowth, 'so với kỳ trước')}
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-[13px] font-semibold text-slate-500">Điểm trung bình</p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 text-amber-500">
                                <Star size={16} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-1">
                            <p className="text-2xl font-bold text-slate-900">--</p>
                            <span className="text-[13px] text-slate-500">/ 5.0</span>
                        </div>
                        <div className="mt-2 text-[12px] font-medium text-amber-600">
                            {board.overview.averageRatingLabel}
                        </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-[13px] font-semibold text-slate-500">Tỷ lệ hoàn thành</p>
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                                <CheckCircle2 size={16} />
                            </div>
                        </div>
                        <p className="mt-4 text-2xl font-bold text-slate-900">--</p>
                        <div className="mt-2 text-[12px] font-medium text-violet-600">
                            {board.overview.completionRateLabel}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="flex flex-col rounded-md border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-[15px] font-bold text-slate-800">
                                    Biểu đồ doanh thu giảng viên 40% (dữ liệu thật)
                                </h2>
                                <p className="mt-1 text-xs text-emerald-600">
                                    Source: DATABASE
                                </p>
                            </div>
                        </div>
                        <div className="min-h-[300px] flex-1 rounded border border-slate-100 bg-slate-50/50 p-4">
                            {loading ? (
                                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                    Đang tải biểu đồ...
                                </div>
                            ) : board.revenueSeries.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                    Chưa có dữ liệu doanh thu trong bộ lọc hiện tại.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={board.revenueSeries}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                                        <YAxis
                                            stroke="#64748b"
                                            fontSize={12}
                                            tickFormatter={(value) => formatCompactCurrency(Number(value))}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [formatCurrency(Number(value)), 'Giảng viên 40%']}
                                            labelFormatter={(label) => `Mốc: ${label}`}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#10b981"
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col rounded-md border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 p-6">
                            <h2 className="text-[15px] font-bold text-slate-800">
                                Top khóa học doanh thu cao
                            </h2>
                            <p className="mt-1 text-xs text-emerald-600">Source: DATABASE</p>
                        </div>
                        <div className="flex-1">
                            <div className="divide-y divide-slate-100">
                                {board.topCourses.length === 0 ? (
                                    <div className="p-6 text-sm text-slate-500">
                                        Chưa có dữ liệu khóa học trong bộ lọc hiện tại.
                                    </div>
                                ) : (
                                    board.topCourses.map((course) => (
                                        <div
                                            key={course.courseId}
                                            className="flex items-center gap-3 p-4 transition hover:bg-slate-50"
                                        >
                                            <div className="h-10 w-16 shrink-0 overflow-hidden rounded bg-slate-200">
                                                {course.imageUrl ? (
                                                    <img
                                                        src={course.imageUrl}
                                                        alt={course.courseName}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : null}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate text-[13px] font-bold text-slate-900">
                                                    {course.courseName}
                                                </h3>
                                                <p className="text-[12px] text-slate-500">
                                                    {course.enrollments} HV •{' '}
                                                    <span className="font-medium text-amber-500">
                                                        {course.ratingLabel}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-[13px] font-bold text-emerald-600">
                                                    {formatCompactCurrency(course.revenue)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="flex flex-col rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-[15px] font-bold text-slate-800">
                                Doanh thu theo nguồn
                            </h2>
                            <p className="mt-1 text-xs text-amber-600">
                                Source: MOCKDATA
                            </p>
                        </div>

                        <div className="flex flex-1 flex-col items-center justify-center">
                            <div
                                className="relative mb-6 h-48 w-48 rounded-full"
                                style={{
                                    background: `conic-gradient(${board.revenueBySource
                                        .map((item, index, array) => {
                                            const start = array
                                                .slice(0, index)
                                                .reduce((sum, current) => sum + current.percentage, 0);
                                            const end = start + item.percentage;
                                            return `${item.color} ${start}% ${end}%`;
                                        })
                                        .join(', ')})`,
                                }}
                            >
                                <div className="absolute inset-0 m-auto flex h-28 w-28 items-center justify-center rounded-full bg-white text-center shadow-inner">
                                    <span className="text-xs font-bold text-slate-400">MOCKDATA</span>
                                </div>
                            </div>

                            <div className="w-full px-4 text-[12px] font-medium text-slate-600">
                                <p className="mb-3 text-amber-600">{board.revenueBySourceLabel}</p>
                                <div className="flex flex-col gap-2">
                                    {board.revenueBySource.map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="h-3 w-3 rounded-sm"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                {item.label}
                                            </div>
                                            <span className="font-bold text-slate-900">{item.percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col rounded-md border border-slate-200 bg-white shadow-sm lg:col-span-2">
                        <div className="flex items-center justify-between border-b border-slate-100 p-6">
                            <div>
                                <h2 className="text-[15px] font-bold text-slate-800">
                                    Lượt đăng ký mới nhất
                                </h2>
                                <p className="mt-1 text-xs text-emerald-600">Source: DATABASE</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left text-[13px] text-slate-600">
                                <thead className="border-b border-slate-100 bg-slate-50/50 text-[12px] font-semibold uppercase text-slate-500">
                                    <tr>
                                        <th className="whitespace-nowrap p-4">Học viên</th>
                                        <th className="whitespace-nowrap p-4">Khóa học</th>
                                        <th className="whitespace-nowrap p-4 text-right">Số tiền</th>
                                        <th className="whitespace-nowrap p-4">Mã giảm giá</th>
                                        <th className="whitespace-nowrap p-4">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {board.recentEnrollments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-6 text-center text-sm text-slate-500">
                                                Chưa có lượt đăng ký phù hợp với bộ lọc hiện tại.
                                            </td>
                                        </tr>
                                    ) : (
                                        board.recentEnrollments.map((item) => (
                                            <tr
                                                key={item.enrollmentCode}
                                                className="transition hover:bg-slate-50/50"
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {item.studentAvatar ? (
                                                            <img
                                                                src={item.studentAvatar}
                                                                className="h-8 w-8 rounded-full object-cover"
                                                                alt={item.studentName}
                                                            />
                                                        ) : (
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                                                                {item.studentName.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-bold text-slate-900">
                                                                {item.studentName}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500">
                                                                {item.studentEmail}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-medium text-slate-800">{item.courseName}</div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {formatDate(item.purchasedAt)}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-bold text-emerald-600">
                                                    {formatCurrency(item.amount)}
                                                    <div className="text-[11px] font-medium text-slate-400">
                                                        Gross {formatCurrency(item.grossAmount)}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {item.couponCode ? (
                                                        <span className="font-mono text-xs font-bold text-slate-600">
                                                            {item.couponCode}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs italic text-slate-400">
                                                            Tự nhiên (Không dùng mã)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4">

                                                    <span className="inline-flex rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">

                                                        {item.status === 'ACTIVE' ? 'Thành công' : item.status}

                                                    </span>

                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </InstructorLayout>
    );
}
