import React, { ReactNode } from 'react';
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
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Chào mừng quay trở lại.</h1>
                <p className="text-gray-500 text-sm mt-1 font-medium">Dưới đây là những gì đang diễn ra với các khóa học của bạn hôm nay.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon={<BookOpen size={18} />} label="Khóa học" value="12" growth="+2 tháng này" />
                <StatCard icon={<Users size={18} />} label="Học viên mới" value="156" growth="+15% tuần này" />
                <StatCard icon={<DollarSign size={18} />} label="Doanh thu" value="18.5Tr" growth="+4.2Tr tháng này" />
                <StatCard icon={<TrendingUp size={18} />} label="Tỷ lệ hoàn thành" value="78%" growth="+5% so với kỳ trước" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Placeholder cho Biểu đồ hoặc Danh sách gần đây */}
                <div className="bg-white border border-gray-200 rounded-md p-6 h-64 flex flex-col items-center justify-center text-gray-400 italic text-sm">
                    Biểu đồ tăng trưởng học viên sẽ hiển thị ở đây
                </div>
                <div className="bg-white border border-gray-200 rounded-md p-6 h-64 flex flex-col items-center justify-center text-gray-400 italic text-sm">
                    Các khóa học phổ biến nhất của bạn
                </div>
            </div>
        </InstructorLayout>
    );
}

function StatCard({ icon, label, value, growth }: StatCardProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="text-gray-400">{icon}</div>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-sm">
                    {growth}
                </span>
            </div>
            <div className="text-2xl font-bold text-[#1D1D1F] tracking-tight">{value}</div>
            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mt-1">{label}</div>
        </div>
    );
}