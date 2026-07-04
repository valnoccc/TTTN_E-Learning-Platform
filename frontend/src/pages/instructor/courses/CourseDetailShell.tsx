import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowLeft,
    BadgeInfo,
    BookOpen,
    FileEdit,
    Layers3,
    Trash2,
    Bookmark,
    Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import InstructorLayout from '../../../layouts/InstructorLayout';
import {
    useCourseDetail,
    type InstructorCourseContextValue,
} from './hooks/useCourseDetail';

const InstructorCourseContext = createContext<InstructorCourseContextValue | null>(null);

const detailTabs = [
    { key: 'overview', label: 'Tổng quan', to: 'overview', icon: <FileEdit size={15} /> },
    { key: 'lessons', label: 'Bài học', to: 'lessons', icon: <BookOpen size={15} /> },
] as const;

interface InstructorCourseDetailProps {
    mode?: 'create' | 'edit';
    children?: ReactNode;
}

export default function InstructorCourseDetail({
    mode = 'edit',
    children,
}: InstructorCourseDetailProps) {
    const course = useCourseDetail({ mode });
    const {
        id,
        isNewCourse,
        isLocked,
        formData,
        lessons,
        isDeleteModalOpen,
        handleSave,
        handleDeleteCourse,
        confirmDelete,
        setIsDeleteModalOpen,
        handleStatusChange,
        navigate,
        isSaving,
        isStatusChanging,
    } = course as any;

    const videoLessons = (lessons ?? []).filter(
        (lesson: any) => Boolean(lesson.video_url || lesson.videoUrl),
    );
    const isAiChecking = videoLessons.some(
        (lesson: any) => lesson.aiStatus === 'PROCESSING' || lesson.aiStatus === 'PENDING',
    );
    const needsReviewLessons = videoLessons.filter(
        (lesson: any) => lesson.aiStatus === 'NEEDS_REVIEW',
    );
    const isTechnicalAiReject = (lesson: any) => {
        const reason = String(lesson?.aiRejectReason ?? '').toLowerCase();
        return reason.includes('lỗi kỹ thuật') || reason.includes('invalid_argument') || reason.includes('request contains an invalid argument');
    };
    const hardRejectedLessons = videoLessons.filter((lesson: any) => {
        return lesson.aiStatus === 'REJECTED' && !isTechnicalAiReject(lesson);
    });
    const technicalRejectedLessons = videoLessons.filter((lesson: any) => {
        return lesson.aiStatus === 'REJECTED' && isTechnicalAiReject(lesson);
    });
    const hasAiRejected = hardRejectedLessons.length > 0;
    const hasNeedsReview = needsReviewLessons.length > 0;
    const canRequestPublish =
        videoLessons.length > 0 && videoLessons.every((lesson: any) => lesson.aiStatus === 'APPROVED');
    const firstRejectedLesson = hardRejectedLessons[0] ?? technicalRejectedLessons[0] ?? null;
    const disablePublish = isSaving || isStatusChanging;
    let publishBtnTitle = '';
    if (isAiChecking) publishBtnTitle = 'Có video đang được AI xử lý';
    else if (hasAiRejected) {
        publishBtnTitle = firstRejectedLesson?.aiRejectReason
            ? `Có video bị AI từ chối: ${firstRejectedLesson.aiRejectReason}`
            : 'Có video bị AI từ chối, vui lòng kiểm tra lại';
    } else if (technicalRejectedLessons.length > 0) {
        publishBtnTitle = 'Có video bị lỗi kỹ thuật khi kiểm duyệt. Có thể gửi yêu cầu duyệt lại.';
    } else if (hasNeedsReview) {
        publishBtnTitle = 'Có video cần admin duyệt thêm.';
    } else if (!canRequestPublish) {
        publishBtnTitle = 'Khóa học chưa sẵn sàng để gửi duyệt. Hãy chờ toàn bộ video được AI duyệt.';
    }

    const courseReviewBanner = (() => {
        if (isAiChecking) {
            return {
                tone: 'amber',
                title: 'Khóa học đang được AI kiểm duyệt',
                description:
                    'Một số video vẫn đang được xử lý. Bạn có thể tiếp tục chỉnh sửa các phần khác trong lúc chờ.',
            };
        }

        if (hasAiRejected) {
            return {
                tone: 'rose',
                title: 'Có video bị từ chối',
                description: firstRejectedLesson?.aiRejectReason
                    ? `Ít nhất một video chưa đạt yêu cầu: ${firstRejectedLesson.aiRejectReason}`
                    : 'Ít nhất một video chưa đạt yêu cầu. Vui lòng kiểm tra lại bài học tương ứng.',
            };
        }

        if (hasNeedsReview) {
            return {
                tone: 'sky',
                title: 'Khóa học đang chờ admin duyệt thêm',
                description:
                    'AI đã đánh dấu một số video cần xem xét thủ công. Hệ thống sẽ chờ admin xử lý tiếp.',
            };
        }

        if (canRequestPublish && videoLessons.length > 0) {
            return {
                tone: 'emerald',
                title: 'Tất cả video đã được AI duyệt',
                description:
                    'Bạn có thể gửi yêu cầu duyệt khóa học ngay bây giờ để hệ thống chuyển sang bước public.',
            };
        }

        return null;
    })();

    useEffect(() => {
        const rejectedLessons = (lessons ?? []).filter((lesson: any) => lesson.aiStatus === 'REJECTED');
        if (rejectedLessons.length > 0) {
            console.groupCollapsed(
                `[Course AI Debug] Course ${formData.title || id || ''} has ${rejectedLessons.length} rejected lesson(s)`,
            );
            console.table(
                rejectedLessons.map((lesson: any) => ({
                    id: lesson.id,
                    title: lesson.tieu_de,
                    aiStatus: lesson.aiStatus,
                    aiRejectReason: lesson.aiRejectReason || 'no reason provided',
                    rejectType: isTechnicalAiReject(lesson) ? 'technical' : 'hard',
                    videoUrl: lesson.video_url || '',
                })),
            );
            console.groupEnd();
        }
    }, [formData.title, id, lessons]);

    return (
        <InstructorLayout>
            <InstructorCourseContext.Provider value={course}>
                <div className="space-y-6">
                    <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                <div className="min-w-0">
                                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
                                        {isNewCourse ? 'Tạo khóa học mới' : formData.title || 'Đang tải...'}
                                    </h1>
                                </div>

                                <div className="flex flex-col items-start gap-4 xl:items-end">
                                    {courseReviewBanner ? (
                                        <div
                                            className={`max-w-xl rounded-xl border px-4 py-3 text-sm shadow-sm ${
                                                courseReviewBanner.tone === 'amber'
                                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                                    : courseReviewBanner.tone === 'rose'
                                                        ? 'border-rose-200 bg-rose-50 text-rose-800'
                                                        : courseReviewBanner.tone === 'sky'
                                                            ? 'border-sky-200 bg-sky-50 text-sky-800'
                                                            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="font-bold">
                                                        {courseReviewBanner.title}
                                                    </p>
                                                    <p className="mt-1 leading-5">
                                                        {courseReviewBanner.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}

                                    {!isNewCourse && (
                                        <StatusActions
                                            status={formData.trang_thai}
                                            onAction={() =>
                                                // Luôn trả về DRAFT (Nháp) dù là Hủy duyệt hay Tạm ẩn xuất bản
                                                void handleStatusChange('DRAFT')
                                            }
                                        />
                                    )}

                                    <div className="mt-1 flex flex-wrap gap-3">
                                        <button
                                            onClick={() => navigate('/instructor/courses')}
                                            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
                                        >
                                            <ArrowLeft size={16} />
                                            Quay lại
                                        </button>

                                        {!isLocked && !isNewCourse ? (
                                            <button
                                                onClick={handleDeleteCourse}
                                                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-red-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2 size={16} />
                                                Xóa khóa học
                                            </button>
                                        ) : null}

                                        {!isLocked ? (
                                            <button
                                                onClick={() => void handleSave()}
                                                disabled={isSaving || isStatusChanging}
                                                className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-bold text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Bookmark size={16} />}
                                                {isNewCourse ? 'Tạo bản nháp' : 'Lưu thay đổi'}
                                            </button>
                                        ) : null}

                                        {!isLocked && !isNewCourse ? (
                                            <button
                                            onClick={() => {
                                                    if (isAiChecking) {
                                                        console.warn('[Course AI Debug] Publish blocked because AI is still checking lessons', {
                                                            courseId: id,
                                                            courseTitle: formData.title,
                                                            lessons,
                                                        });
                                                        toast.error('Khóa học có video đang được AI xử lý. Vui lòng đợi hoàn tất.');
                                                        return;
                                                    }
                                                    if (!canRequestPublish && !hasAiRejected && !hasNeedsReview && technicalRejectedLessons.length === 0) {
                                                        toast.error('Khóa học đang được AI kiểm duyệt. Vui lòng chờ tất cả video hoàn tất trước khi gửi duyệt.');
                                                        return;
                                                    }
                                                    if (hasAiRejected) {
                                                        console.error('[Course AI Debug] Publish blocked because AI rejected at least one lesson', {
                                                            courseId: id,
                                                            courseTitle: formData.title,
                                                            rejectedLessons: hardRejectedLessons
                                                                .map((lesson: any) => ({
                                                                    id: lesson.id,
                                                                    title: lesson.tieu_de,
                                                                    aiStatus: lesson.aiStatus,
                                                                    aiRejectReason: lesson.aiRejectReason || 'no reason provided',
                                                                    videoUrl: lesson.video_url || '',
                                                                })),
                                                        });
                                                        toast.error(
                                                            firstRejectedLesson?.aiRejectReason
                                                                ? `Khóa học có video bị AI từ chối: ${firstRejectedLesson.aiRejectReason}`
                                                                : 'Khóa học có video bị AI từ chối. Vui lòng kiểm tra lại!',
                                                        );
                                                        return;
                                                    }
                                                    void handleStatusChange('PENDING');
                                                }}
                                                disabled={disablePublish}
                                                title={publishBtnTitle}
                                                className="inline-flex items-center gap-2 rounded-md bg-[#1dbf73] px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#169b5c] hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isStatusChanging ? <Loader2 className="animate-spin" size={16} /> : <BadgeInfo size={16} />}
                                                Gửi yêu cầu duyệt
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!isNewCourse ? (
                            <>
                                <div className="border-b border-slate-200 bg-white px-6 sm:px-8">
                                    <div className="-mb-px flex flex-wrap gap-8">
                                        {detailTabs.map((tab) => (
                                            <NavLink
                                                key={tab.key}
                                                to={tab.to}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-2.5 border-b-[3px] px-1 py-4 text-[15px] font-bold transition-all duration-200 ${isActive
                                                        ? 'border-[#1dbf73] text-[#1dbf73]'
                                                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                                                    }`
                                                }
                                            >
                                                <span className="[&>svg]:h-5 [&>svg]:w-5">{tab.icon}</span>
                                                {tab.label}
                                            </NavLink>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-5 sm:grid-cols-3 sm:px-8">
                                    <CourseMetric label="Trạng thái" value={getStatusLabel(formData.trang_thai)} />
                                    <CourseMetric label="Số bài học" value={String(lessons.length)} />
                                    <CourseMetric
                                        label="Giá bán"
                                        value={
                                            Number(formData.price) > 0
                                                ? `${Number(formData.price).toLocaleString('vi-VN')} đ`
                                                : 'Miễn phí'
                                        }
                                    />
                                </div>
                            </>
                        ) : null}

                        <div className="bg-slate-50/30 px-6 py-6 sm:px-8">
                            {isNewCourse ? children : <Outlet />}
                        </div>
                    </section>
                </div>
            </InstructorCourseContext.Provider>

            {isDeleteModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
                    <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Xóa khóa học</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Bạn có chắc chắn muốn xóa khóa học này không? Hành động này không thể hoàn tác.
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="rounded-sm border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => void confirmDelete()}
                                className="rounded-sm bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                            >
                                Xác nhận xóa
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </InstructorLayout>
    );
}

export function useInstructorCourseContext() {
    const context = useContext(InstructorCourseContext);
    if (!context) {
        throw new Error('useInstructorCourseContext must be used within InstructorCourseDetail');
    }
    return context;
}

export function CourseSectionCard({
    title,
    description,
    children,
    action,
}: {
    title: string;
    description?: string;
    children: ReactNode;
    action?: ReactNode;
}) {
    return (
        <section className="rounded-sm border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                    {description ? (
                        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                    ) : null}
                </div>
                {action}
            </div>
            <div className="p-5">{children}</div>
        </section>
    );
}

export function CourseSidebarCard({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-sm border border-slate-200 bg-slate-50/60">
            <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            </div>
            <div className="space-y-4 p-4">{children}</div>
        </section>
    );
}

function CourseMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-sm border border-slate-200 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{value}</p>
        </div>
    );
}

function StatusActions({ status, onAction }: { status: string; onAction: () => void }) {
    if (status === 'PENDING') {
        return (
            <button
                onClick={onAction}
                className="inline-flex items-center gap-2 rounded-sm border border-yellow-500 bg-transparent px-4 py-2 text-sm font-bold text-yellow-600 transition hover:bg-yellow-50"
            >
                Hủy yêu cầu duyệt
            </button>
        );
    }

    if (status === 'PUBLISHED') {
        return (
            <button
                onClick={onAction}
                className="inline-flex items-center gap-2 rounded-sm border border-slate-500 bg-transparent px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
                Tạm ẩn khóa học
            </button>
        );
    }

    return null;
}

function getStatusLabel(status: string) {
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
