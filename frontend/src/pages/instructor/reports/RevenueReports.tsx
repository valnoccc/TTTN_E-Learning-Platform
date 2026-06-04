import { BarChart3, FileBarChart, Wallet, type ReactNode } from 'lucide-react';

import InstructorLayout from '../../../layouts/InstructorLayout';

const panelClassName = 'border border-[#d1d7dc] bg-white p-5 sm:p-6';

export default function InstructorReports() {
    return (
        <InstructorLayout>
            <div className="space-y-6">
                <section className={panelClassName}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Báo cáo và thống kê
                    </p>
                    <h1 className="mt-2 text-2xl font-bold text-slate-900">Bảng báo cáo giảng viên</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500">
                        Trang này đã được tách riêng theo hệ panel cổ điển để sẵn sàng cắm dữ liệu doanh thu và tăng trưởng sau này.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <ReportStub icon={<Wallet size={18} />} title="Doanh thu" description="Chưa kết nối nguồn dữ liệu." />
                    <ReportStub icon={<BarChart3 size={18} />} title="Lượt đăng ký" description="Sẽ hiển thị theo khóa học." />
                    <ReportStub icon={<FileBarChart size={18} />} title="Báo cáo xuất file" description="Khu vực dự phòng cho giai đoạn sau." />
                </section>

                <section className={panelClassName}>
                    <div className="border border-dashed border-[#d1d7dc] bg-[#f8fafb] px-6 py-12 text-center">
                        <p className="text-sm font-semibold text-slate-900">Khu vực placeholder</p>
                        <p className="mt-2 text-sm text-slate-500">
                            Chưa có API báo cáo được nối vào trang này. Có thể thêm biểu đồ, bảng doanh thu hoặc bộ lọc thời gian tại đây.
                        </p>
                    </div>
                </section>
            </div>
        </InstructorLayout>
    );
}

function ReportStub({
    icon,
    title,
    description,
}: {
    icon: ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="border border-[#d1d7dc] bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center border border-[#d1d7dc] bg-[#f8fafb] text-emerald-600">
                {icon}
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
    );
}
