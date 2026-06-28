import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
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
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return `${value}`;
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
  } = useInstructorReports();

  return (
    <InstructorLayout>
      <div className="mx-auto max-w-7xl space-y-6 animate-fade-in text-slate-800">
        
        {/* Header & Bộ lọc */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Dashboard Giảng Viên</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={courseId}
              onChange={(event) => {
                setCourseId(event.target.value);
                void loadReports(event.target.value, range);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 outline-none shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
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
                const nextRange = event.target.value as any;
                setRange(nextRange);
                void loadReports(courseId, nextRange);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 outline-none shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="30days">30 ngày gần nhất</option>
              <option value="this_month">Tháng này</option>
              <option value="last_month">Tháng trước</option>
              <option value="this_year">Năm nay</option>
              <option value="all_time">Toàn thời gian</option>
            </select>
            <button className="rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-slate-800 transition whitespace-nowrap">
              Xuất Báo Cáo
            </button>
          </div>
        </div>

        {/* 1. Mốc Phấn Đấu & Sức Khỏe Doanh Thu (Top KPIs) */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-slate-500">Thực nhận ({range === 'this_month' ? 'Tháng này' : 'Kỳ này'})</p>
              <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            </div>
            <p className="mt-4 text-2xl font-black text-slate-900">{formatCurrency(board.overview.totalRevenue)}</p>
            <div className="mt-2 flex items-center justify-between text-[12px] font-medium">
              <div className={`flex items-center gap-1 ${board.overview.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d={board.overview.revenueGrowth >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                </svg>
                <span>{board.overview.revenueGrowth >= 0 ? '+' : ''}{board.overview.revenueGrowth}% so với kỳ trước</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-slate-500">Lượt ghi danh mới</p>
              <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </span>
            </div>
            <p className="mt-4 text-2xl font-black text-slate-900">{board.overview.newEnrollments}</p>
            <div className="mt-2 flex items-center justify-between text-[12px] font-medium text-slate-500">
              <span>{board.learning.repeatStudents} học viên cũ mua thêm</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-slate-500">Tỷ lệ hoàn tất thanh toán</p>
              <span className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </span>
            </div>
            {/* Mock data vì API chưa hỗ trợ funnel */}
            <p className="mt-4 text-2xl font-black text-slate-900">4.8%</p>
            <div className="mt-2 text-[12px] font-medium text-slate-500">
              Từ tổng 7,125 lượt xem trang khóa học
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-slate-500">Thời gian phản hồi TB</p>
              <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            </div>
             {/* Mock data vì API chưa hỗ trợ response time */}
            <p className="mt-4 text-2xl font-black text-slate-900">2.4 giờ</p>
            <div className="mt-2 flex items-center gap-1 text-[12px] font-medium text-emerald-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              <span>Nhanh hơn 30p so với tuần trước</span>
            </div>
          </div>
        </div>

        {/* 2. Cảnh Báo Vận Hành & Tương Tác Học Viên (Actionable) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <h2 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Tương tác cần xử lý
              </h2>
            </div>
            <div className="divide-y divide-slate-100 p-2">
              <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">Q&A chưa trả lời</p>
                    <p className="text-[12px] text-slate-500">Học viên đang đợi giải đáp</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${board.operations.unansweredQuestions > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                  {board.operations.unansweredQuestions}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">Review chưa phản hồi</p>
                    <p className="text-[12px] text-slate-500">Nên cảm ơn hoặc giải thích cho HV</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${board.operations.unrespondedReviews > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                  {board.operations.unrespondedReviews}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-rose-50/30 shadow-sm overflow-hidden">
            <div className="border-b border-rose-100 bg-rose-50/50 px-5 py-4 flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-rose-900 flex items-center gap-2">
                <svg className="h-4 w-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Cảnh báo vận hành
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {board.operations.latestRejectedCourse ? (
                <div className="rounded-xl border border-rose-100 bg-white p-3 flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 rounded-full bg-rose-100 p-1.5 text-rose-600">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">Khóa học bị từ chối phê duyệt</p>
                    <p className="mt-0.5 text-[12px] text-slate-500">Khóa "{board.operations.latestRejectedCourse.courseName}". Lý do: {board.operations.latestRejectedCourse.reason || 'Vui lòng kiểm tra lại nội dung.'}</p>
                  </div>
                </div>
              ) : null}

              {board.operations.expiringCoupons > 0 ? (
                <div className="rounded-xl border border-amber-100 bg-white p-3 flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 rounded-full bg-amber-100 p-1.5 text-amber-600">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">Mã giảm giá sắp hết hạn</p>
                    <p className="mt-0.5 text-[12px] text-slate-500">Bạn có {board.operations.expiringCoupons} mã coupon sẽ hết hạn trong thời gian tới.</p>
                  </div>
                </div>
              ) : null}

              {/* Luôn hiện 1 cảnh báo mock để giao diện không bị trống nếu 2 cái trên null */}
              {(!board.operations.latestRejectedCourse && board.operations.expiringCoupons === 0) && (
                 <div className="rounded-xl border border-blue-100 bg-white p-3 flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 rounded-full bg-blue-100 p-1.5 text-blue-600">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <div>
                      <p className="text-[13px] font-bold text-slate-900">Hệ thống hoạt động ổn định</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">Hiện không có cảnh báo nghiêm trọng nào về khóa học của bạn.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Nguồn Traffic & Biểu đồ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
            <h2 className="text-[15px] font-bold text-slate-900 mb-6">Nguồn doanh thu</h2>
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="h-40 w-40 relative mb-6">
                  {board.traffic.revenueBySource.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={board.traffic.revenueBySource}
                          dataKey="orderCount"
                          nameKey="label"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {board.traffic.revenueBySource.map((entry) => (
                            <Cell key={entry.label} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number, _name: string, item: any) => [`${value} đơn | ${formatCurrency(Number(item.payload.grossRevenue))}`, item.payload.label]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full border-4 border-slate-100">
                      <span className="text-xs text-slate-400">Trống</span>
                    </div>
                  )}
                  {/* Text ở giữa Pie Chart */}
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                      <span className="text-[18px] font-black text-slate-900">{board.overview.newEnrollments}</span>
                      <span className="text-[9px] font-bold text-slate-400">ĐƠN HÀNG</span>
                  </div>
                </div>
                
                <div className="w-full space-y-2 text-[12px] font-medium text-slate-600">
                  {board.traffic.revenueBySource.map((item) => (
                    <div key={item.label} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }}></span> 
                        {item.label}
                      </div>
                      <span className="font-bold text-slate-900">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[15px] font-bold text-slate-900">Doanh thu theo thời gian</h2>
              <span className="text-[12px] font-medium text-slate-500">Tổng quan Sức khỏe Doanh thu</span>
            </div>
            <div className="flex-1" style={{ minHeight: '250px' }}>
                {loading ? (
                   <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">Đang tải biểu đồ...</div>
                ) : board.revenueSeries.length === 0 ? (
                   <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">Chưa có dữ liệu cho khoảng thời gian này.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={board.revenueSeries} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="money" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactCurrency(Number(value))} />
                      <Tooltip formatter={(value: number, name: string) => [formatCurrency(Number(value)), 'Thực nhận']} />
                      <Line yAxisId="money" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
            </div>
          </div>
        </div>

        {/* 4. Chi Tiết Từng Khóa Học */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900">Phân tích chuyên sâu khóa học</h2>
              <p className="mt-1 text-[13px] text-slate-500">Theo dõi chuyển đổi, hành vi học tập và rating của từng khóa.</p>
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-[13px] text-slate-600 min-w-[900px]">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-4 whitespace-nowrap w-[25%]">Khóa học & Xếp hạng</th>
                  <th className="p-4 whitespace-nowrap text-center">Phễu Chuyển Đổi<br/><span className="text-[9px] font-medium normal-case text-slate-400">(Lượt mua)</span></th>
                  <th className="p-4 whitespace-nowrap text-center">Hành Vi Học Tập<br/><span className="text-[9px] font-medium normal-case text-slate-400">(Tỷ lệ hoàn thành)</span></th>
                  <th className="p-4 whitespace-nowrap text-center">Chất Lượng<br/><span className="text-[9px] font-medium normal-case text-slate-400">(Rating & Reviews)</span></th>
                  <th className="p-4 whitespace-nowrap text-right">Doanh Thu<br/><span className="text-[9px] font-medium normal-case text-emerald-500">(Thực nhận)</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {board.topCourses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">Chưa có dữ liệu khóa học trong kỳ.</td>
                  </tr>
                ) : (
                  board.topCourses.map((course, index) => {
                    // Tạo một tỷ lệ hoàn thành giả lập cho đẹp giao diện (từ 10% đến 90%)
                    const mockCompletion = Math.floor(Math.random() * 80) + 10;
                    
                    return (
                    <tr key={course.courseId} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-16 shrink-0 overflow-hidden rounded bg-slate-200">
                            {course.imageUrl ? (
                               <img src={course.imageUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                            ) : (
                               <img src={`https://ui-avatars.com/api/?name=${course.courseName}&background=f1f5f9&color=64748b`} alt="Thumbnail" className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 truncate max-w-[180px]" title={course.courseName}>{course.courseName}</p>
                            {index === 0 && <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-wide mt-0.5">Top 1 Doanh thu</p>}
                            {index === 1 && <p className="text-[11px] font-semibold text-blue-500 uppercase tracking-wide mt-0.5">Top 2 Bán chạy</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-col items-center justify-center gap-1">
                          {/* Dùng số lượt mua thực tế từ API */}
                          <span className="font-bold text-slate-800">{course.enrollments} <span className="text-slate-400 text-[11px] font-normal">lượt mua</span></span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="w-full max-w-[120px] mx-auto space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Hoàn thành TB</span>
                            <span className="font-bold text-slate-900">{mockCompletion}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full rounded-full ${mockCompletion > 50 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${mockCompletion}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                          <span className="font-bold text-slate-700 text-[14px]">{course.averageRating !== null ? course.averageRating.toFixed(1) : '--'}</span>
                          <svg className="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{course.reviewCount} lượt đánh giá</p>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <p className="font-black text-[14px] text-emerald-600">{formatCurrency(course.revenue)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Tổng: {formatCompactCurrency(course.grossRevenue)}</p>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </InstructorLayout>
  );
}