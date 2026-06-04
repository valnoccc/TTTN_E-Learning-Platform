import { type ReactNode } from 'react';
import { BookOpen, DollarSign, TrendingUp, Users } from 'lucide-react';

import InstructorLayout from '../../../layouts/InstructorLayout';
import ClassicCard from '../../../components/instructor/ClassicCard';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  growth: string;
}

export default function InstructorDashboard() {
  return (
    <InstructorLayout>
      <div className="space-y-5">
        <section className="border border-[#d1d7dc] bg-white px-6 py-7">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#7a828a]">Tổng quan</p>
            <h1 className="mt-2 text-[1.8rem] font-bold text-[#2c3e50]">Chào mừng quay trở lại.</h1>
            <p className="mt-2 text-sm text-[#7a828a]">
              Dưới đây là những gì đang diễn ra với các khóa học của bạn hôm nay.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<BookOpen size={18} />} label="Khóa học" value="12" growth="+2 tháng này" />
          <StatCard icon={<Users size={18} />} label="Học viên mới" value="156" growth="+15% tuần này" />
          <StatCard icon={<DollarSign size={18} />} label="Doanh thu" value="18.5Tr" growth="+4.2Tr tháng này" />
          <StatCard icon={<TrendingUp size={18} />} label="Tỷ lệ hoàn thành" value="78%" growth="+5% so với kỳ trước" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ClassicCard>
            <div className="flex h-72 items-center justify-center border border-dashed border-[#d1d7dc] bg-[#f9fbfb] text-sm italic text-[#7a828a]">
              Biểu đồ tăng trưởng học viên sẽ hiển thị ở đây
            </div>
          </ClassicCard>
          <ClassicCard>
            <div className="flex h-72 items-center justify-center border border-dashed border-[#d1d7dc] bg-[#f9fbfb] text-sm italic text-[#7a828a]">
              Các khóa học phổ biến nhất của bạn
            </div>
          </ClassicCard>
        </div>
      </div>
    </InstructorLayout>
  );
}

function StatCard({ icon, label, value, growth }: StatCardProps) {
  return (
    <div className="border border-[#d1d7dc] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center border border-[#d1d7dc] bg-[#f7f9fa] text-[#1dbf73]">
          {icon}
        </div>
        <span className="border border-[#d1d7dc] bg-[#f7f9fa] px-2.5 py-1 text-xs font-bold text-[#2c3e50]">
          {growth}
        </span>
      </div>
      <div className="text-2xl font-bold text-[#2c3e50]">{value}</div>
      <div className="mt-1 text-sm font-medium text-[#7a828a]">{label}</div>
    </div>
  );
}
