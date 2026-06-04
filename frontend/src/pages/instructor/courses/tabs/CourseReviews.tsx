import { MessageSquareQuote, Star } from 'lucide-react';

import {
    CourseSectionCard,
    CourseSidebarCard,
    useInstructorCourseContext,
} from '../CourseDetailShell';

export default function InstructorCourseReviews() {
    const { lessons, formData } = useInstructorCourseContext();

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_320px]">
            <CourseSectionCard
                title="Đánh giá khóa học"
                description="Khu vực này giữ tab route-backed riêng cho các phản hồi của học viên, theo phong cách instructor classic."
            >
                <div className="rounded-sm border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-300">
                        <Star size={20} />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-900">
                        Chưa có dữ liệu đánh giá để hiển thị
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Tab này đã sẵn sàng cho luồng đánh giá của khóa học. Dữ liệu sẽ xuất hiện khi hệ thống cung cấp endpoint hoặc khi học viên bắt đầu gửi phản hồi.
                    </p>
                </div>
            </CourseSectionCard>

            <div className="space-y-5">
                <CourseSidebarCard title="Tóm tắt">
                    <MetricRow label="Trạng thái khóa học" value={statusLabel(formData.trang_thai)} />
                    <MetricRow label="Số bài học" value={String(lessons.length)} />
                    <MetricRow
                        label="Giá bán"
                        value={
                            Number(formData.price) > 0
                                ? `${Number(formData.price).toLocaleString('vi-VN')} đ`
                                : 'Miễn phí'
                        }
                    />
                </CourseSidebarCard>
            </div>
        </div>
    );
}

function MetricRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-sm border border-slate-200 bg-white px-3 py-2">
            <span className="text-sm text-slate-600">{label}</span>
            <span className="text-sm font-semibold text-slate-900">{value}</span>
        </div>
    );
}

function statusLabel(status: string) {
    switch (status) {
        case 'PENDING':
            return 'Chờ duyệt';
        case 'PUBLISHED':
            return 'Đã xuất bản';
        case 'HIDDEN':
            return 'Đang ẩn';
        default:
            return 'Bản nháp';
    }
}
