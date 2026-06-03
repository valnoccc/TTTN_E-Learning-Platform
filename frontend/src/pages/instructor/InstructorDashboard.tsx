import { type ReactNode } from 'react';
import InstructorLayout from '../../layouts/InstructorLayout';
import { BookOpen, Users, DollarSign, TrendingUp } from 'lucide-react';

interface StatCardProps {
    icon: ReactNode;
    label: string;
    value: string;
    growth: string;
}

export default function InstructorDashboard() {
    return (
        <InstructorLayout>
            {/* Header section đổi thành rounded-lg, shadow-sm */}
            <section className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white px-6 py-7 shadow-sm">
                <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Tổng quan</p>
                    <h1 className="mt-2 text-2xl font-bold text-slate-800">Chào mừng quay trở lại.</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Dưới đây là những gì đang diễn ra với các khóa học của bạn hôm nay.
                    </p>
                </div>
            </section>

            <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={<BookOpen size={20} />} label="Khóa học" value="12" growth="+2 tháng này" />
                <StatCard icon={<Users size={20} />} label="Học viên mới" value="156" growth="+15% tuần này" />
                <StatCard icon={<DollarSign size={20} />} label="Doanh thu" value="18.5Tr" growth="+4.2Tr tháng này" />
                <StatCard icon={<TrendingUp size={20} />} label="Tỷ lệ hoàn thành" value="78%" growth="+5% so với kỳ trước" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="flex h-72 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white text-sm italic text-slate-400 shadow-sm">
                    Biểu đồ tăng trưởng học viên sẽ hiển thị ở đây
                </div>
                <div className="flex h-72 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white text-sm italic text-slate-400 shadow-sm">
                    Các khóa học phổ biến nhất của bạn
                </div>
            </div>
        </InstructorLayout>
    );
}

function StatCard({ icon, label, value, growth }: StatCardProps) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                    {icon}
                </div>
                <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {growth}
                </span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{value}</div>
            <div className="mt-1 text-sm font-medium text-slate-500">{label}</div>
        </div>
    );
}