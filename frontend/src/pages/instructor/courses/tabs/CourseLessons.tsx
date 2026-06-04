import { BookOpen, FileEdit, Plus, Trash2 } from 'lucide-react';

import {
    CourseSectionCard,
    CourseSidebarCard,
    useInstructorCourseContext,
} from '../CourseDetailShell';

export default function InstructorCourseLessons() {
    const { id, isLocked, lessons, handleDeleteLesson, navigate } = useInstructorCourseContext();

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_320px]">
            <CourseSectionCard
                title={`Chương trình học (${lessons.length})`}
                description="Quản lý thứ tự bài học và truy cập nhanh vào các thao tác thêm, sửa, xóa."
                action={
                    !isLocked ? (
                        <button
                            onClick={() => navigate(`/instructor/courses/${id}/lessons/new`)}
                            className="inline-flex items-center gap-2 rounded-sm bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                            <Plus size={16} />
                            Thêm bài học
                        </button>
                    ) : null
                }
            >
                <div className="space-y-3">
                    {lessons.length > 0 ? (
                        lessons.map((lesson, index) => (
                            <div
                                key={lesson.id}
                                className="rounded-sm border border-slate-200 bg-white px-4 py-4"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex min-w-0 gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                                            {String(index + 1).padStart(2, '0')}
                                        </div>
                                        <div className="min-w-0">
                                            <p
                                                className="truncate text-sm font-semibold text-slate-900"
                                                title={lesson.tieu_de}
                                            >
                                                {lesson.tieu_de}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {lesson.video_url ? 'Bài giảng có video' : 'Bài giảng dạng nội dung'}
                                            </p>
                                        </div>
                                    </div>

                                    {!isLocked ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/instructor/lessons/${lesson.id}/edit`)}
                                                className="inline-flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                            >
                                                <FileEdit size={14} />
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => void handleDeleteLesson(lesson.id)}
                                                className="inline-flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                                            >
                                                <Trash2 size={14} />
                                                Xóa
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="rounded-sm border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-300">
                                <BookOpen size={20} />
                            </div>
                            <p className="mt-4 text-sm font-semibold text-slate-900">
                                Chưa có bài học nào
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                                Thêm ít nhất một bài học trước khi gửi khóa học đi duyệt.
                            </p>
                        </div>
                    )}
                </div>
            </CourseSectionCard>

            <div className="space-y-5">
                <CourseSidebarCard title="Tiến độ nội dung">
                    <MetricRow label="Tổng bài học" value={String(lessons.length)} />
                    <MetricRow
                        label="Đã có video"
                        value={String(lessons.filter((lesson) => lesson.video_url).length)}
                    />
                    <MetricRow
                        label="Bản nháp nội dung"
                        value={String(lessons.filter((lesson) => !lesson.video_url).length)}
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
