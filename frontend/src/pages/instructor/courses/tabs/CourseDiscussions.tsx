import { BookOpenText, MessageSquare } from 'lucide-react';

import {
    CourseSectionCard,
    CourseSidebarCard,
    useInstructorCourseContext,
} from '../CourseDetailShell';

export default function InstructorCourseDiscussions() {
    const { lessons } = useInstructorCourseContext();

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_320px]">
            <CourseSectionCard
                title="Thảo luận khóa học"
                description="Phần này dành cho Q&A và thảo luận theo từng khóa học, tách thành URL riêng để đồng bộ với giao diện instructor classic."
            >
                <div className="rounded-sm border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-300">
                        <MessageSquare size={20} />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-900">
                        Chưa có chủ đề thảo luận nào
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Khi dữ liệu thảo luận được nối vào màn instructor, tab này đã có sẵn vùng hiển thị độc lập theo route mà không cần thay đổi cấu trúc chi tiết khóa học.
                    </p>
                </div>
            </CourseSectionCard>

            <div className="space-y-5">
                <CourseSidebarCard title="Tình trạng sẵn sàng">
                    <MetricRow label="Bài học hiện có" value={String(lessons.length)} />
                    <MetricRow
                        label="Có thể mở thảo luận"
                        value={lessons.length > 0 ? 'Sẵn sàng' : 'Chưa'}
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
