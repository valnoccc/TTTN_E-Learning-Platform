import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Ban,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    Clock3,
    FileText,
    Layers3,
    MessageSquare,
    PlayCircle,
    Star,
    Target,
    XCircle,
} from 'lucide-react';

import AdminLayout from '../../../layouts/AdminLayout';
import PageTransition from '../../../components/PageTransition';
import {
    REVIEW_PAGE_SIZE,
    useAdminCourseDetail,
} from './hooks/useAdminCourseDetail';

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(date);
}

function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
        PENDING: 'Chờ duyệt',
        PUBLISHED: 'Đã xuất bản',
        BANNED: 'Đã ban',
        DRAFT: 'Bản nháp',
        ACTIVE: 'Đang hoạt động',
        DELETED: 'Đã xóa',
    };

    return labels[status] ?? status;
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        PENDING: 'border-amber-300 bg-amber-50 text-amber-700',
        PUBLISHED: 'border-emerald-300 bg-emerald-50 text-emerald-700',
        BANNED: 'border-rose-300 bg-rose-50 text-rose-700',
        DRAFT: 'border-slate-300 bg-slate-50 text-slate-600',
        ACTIVE: 'border-emerald-300 bg-emerald-50 text-emerald-700',
        INACTIVE: 'border-slate-300 bg-slate-50 text-slate-600',
    };

    return (
        <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${styles[status] ?? styles.DRAFT}`}>
            {getStatusLabel(status)}
        </span>
    );
}

function getActionLabel(action: string) {
    const labels: Record<string, string> = {
        APPROVE: 'Phê duyệt',
        REJECT: 'Từ chối',
        BAN: 'Ban',
        HIDE: 'Ẩn',
    };

    return labels[action] ?? action;
}

export default function AdminCourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const courseId = Number(id);
    const {
        action,
        actionReason,
        canApproveOrReject,
        canBanCourse,
        course,
        expandedChapterId,
        expandedReplyIds,
        handleAction,
        handleApprove,
        loading,
        paginatedRootReviews,
        replyMap,
        reviewPage,
        reviewPageCount,
        rootReviews,
        selectedLesson,
        setActionReason,
        setActiveAction,
        setExpandedChapterId,
        setReviewPage,
        setSelectedLesson,
        toggleReplies,
    } = useAdminCourseDetail(courseId);

    return (
        <AdminLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <button
                            onClick={() => navigate('/admin/courses')}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                        >
                            <ArrowLeft size={16} />
                            Quay lại danh sách
                        </button>
                        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                            Chi tiết khóa học
                        </h1>
                        <p className="mt-2 max-w-3xl text-[14px] leading-6 text-slate-500">
                            Kiểm tra thông tin khóa học, danh sách bài học, nội dung từng bài, đánh giá và lịch sử kiểm duyệt.
                        </p>
                    </div>

                    {course ? (
                        <div className="flex flex-wrap gap-2">
                            <button
                                disabled={!canApproveOrReject}
                                onClick={() => void handleApprove()}
                                className="inline-flex h-[40px] items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 text-[13px] font-semibold text-teal-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <CheckCircle2 size={17} strokeWidth={2.5} />
                                Duyệt
                            </button>
                            <button
                                disabled={!canApproveOrReject}
                                onClick={() => setActiveAction('reject')}
                                className="inline-flex h-[40px] items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 text-[13px] font-semibold text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <XCircle size={17} strokeWidth={2.5} />
                                Từ chối
                            </button>
                            <button
                                disabled={!canBanCourse}
                                onClick={() => setActiveAction('ban')}
                                className="inline-flex h-[40px] items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 text-[13px] font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Ban size={17} strokeWidth={2.5} />
                                Ban
                            </button>
                        </div>
                    ) : null}
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, index) => (
                            <div key={index} className="h-28 animate-pulse rounded-[24px] bg-white shadow-sm" />
                        ))}
                    </div>
                ) : !course ? (
                    <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
                        <BookOpen className="mx-auto text-slate-400" size={34} strokeWidth={1.5} />
                        <h2 className="mt-4 text-[18px] font-bold text-slate-900">Không tìm thấy khóa học</h2>
                        <p className="mt-2 text-[14px] text-slate-500">Khóa học có thể đã bị xóa hoặc bạn không có quyền truy cập.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-5 md:flex-row">
                                <div className="h-36 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 md:w-44">
                                    {course.hinhThuNho ? (
                                        <img src={course.hinhThuNho} alt={course.tenKhoaHoc} className="h-full w-full object-cover" />
                                    ) : null}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h2 className="text-[24px] font-black tracking-tight text-slate-900">{course.tenKhoaHoc}</h2>
                                        <StatusBadge status={course.trangThai} />
                                    </div>
                                    <p className="mt-3 text-[14px] leading-7 text-slate-600">
                                        {course.moTa || 'Chưa có mô tả khóa học.'}
                                    </p>
                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <span className="rounded-full bg-slate-50 px-4 py-2 text-[13px] font-semibold text-slate-700">
                                            Giá: {formatCurrency(course.giaBan)}
                                        </span>
                                        <span className="rounded-full bg-slate-50 px-4 py-2 text-[13px] font-semibold text-slate-700">
                                            Mục tiêu: {course.mucTieu.length}
                                        </span>
                                        <span className="rounded-full bg-slate-50 px-4 py-2 text-[13px] font-semibold text-slate-700">
                                            Yêu cầu: {course.yeuCau.length}
                                        </span>
                                        <span className="rounded-full bg-slate-50 px-4 py-2 text-[13px] font-semibold text-slate-700">
                                            Đánh giá: {rootReviews.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-6 md:grid-cols-2">
                            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
                                    <Target size={17} className="text-blue-600" />
                                    Mục tiêu khóa học
                                </h3>
                                <div className="mt-4 space-y-3">
                                    {course.mucTieu.length === 0 ? (
                                        <p className="text-[14px] text-slate-500">Chưa có mục tiêu.</p>
                                    ) : (
                                        course.mucTieu.map((item, index) => (
                                            <p key={`${index}-${item}`} className="rounded-2xl bg-slate-50 px-4 py-3 text-[14px] leading-6 text-slate-700">
                                                {item}
                                            </p>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
                                    <FileText size={17} className="text-blue-600" />
                                    Yêu cầu đầu vào
                                </h3>
                                <div className="mt-4 space-y-3">
                                    {course.yeuCau.length === 0 ? (
                                        <p className="text-[14px] text-slate-500">Chưa có yêu cầu.</p>
                                    ) : (
                                        course.yeuCau.map((item, index) => (
                                            <p key={`${index}-${item}`} className="rounded-2xl bg-slate-50 px-4 py-3 text-[14px] leading-6 text-slate-700">
                                                {item}
                                            </p>
                                        ))
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <h3 className="flex items-center gap-2 text-[17px] font-bold text-slate-900">
                                        <BookOpen size={18} className="text-blue-600" />
                                        Chương học và bài học
                                    </h3>
                                    <p className="mt-1 text-[13px] text-slate-500">
                                        Chọn chương và bài học để kiểm tra nội dung, video bài giảng.
                                    </p>
                                </div>
                                <div className="w-fit rounded-full bg-slate-50 px-4 py-2 text-[13px] font-semibold text-slate-600">
                                    {course.curriculum.length} chương
                                </div>
                            </div>

                            <div className="mt-5 grid gap-5 xl:grid-cols-[0.82fr,1.18fr]">
                                <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
                                    <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
                                        {course.curriculum.length === 0 ? (
                                            <p className="text-[14px] text-slate-500">Chưa có chương học nào.</p>
                                        ) : (
                                            course.curriculum.map((chapter) => {
                                                const expanded = expandedChapterId === chapter.maChuong;
                                                return (
                                                    <div key={chapter.maChuong} className="overflow-hidden rounded-[18px] border border-slate-200 bg-white">
                                                        <button
                                                            onClick={() => setExpandedChapterId(expanded ? null : chapter.maChuong)}
                                                            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-slate-50"
                                                        >
                                                            <div>
                                                                <p className="text-[14px] font-bold text-slate-800">
                                                                    Chương {chapter.thuTu}: {chapter.tenChuong}
                                                                </p>
                                                                <p className="mt-1 text-[12px] font-medium text-slate-500">
                                                                    {chapter.baiHocs.length} bài học
                                                                </p>
                                                            </div>
                                                            <ChevronDown
                                                                size={18}
                                                                className={`shrink-0 text-slate-500 transition ${expanded ? 'rotate-180' : ''}`}
                                                            />
                                                        </button>

                                                        {expanded ? (
                                                            <div className="space-y-2 border-t border-slate-100 bg-slate-50 p-3">
                                                                {chapter.baiHocs.length === 0 ? (
                                                                    <p className="px-2 py-3 text-[13px] text-slate-500">Chưa có bài học trong chương này.</p>
                                                                ) : (
                                                                    chapter.baiHocs.map((lesson) => (
                                                                        <button
                                                                            key={lesson.maBH}
                                                                            onClick={() => setSelectedLesson(lesson)}
                                                                            className={`flex w-full items-start justify-between gap-3 rounded-2xl px-3 py-3 text-left transition ${selectedLesson?.maBH === lesson.maBH
                                                                                ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-100'
                                                                                : 'bg-white hover:bg-slate-50'
                                                                                }`}
                                                                        >
                                                                            <div>
                                                                                <p className="text-[13px] font-bold">
                                                                                    Bài {lesson.thuTu}: {lesson.tenBaiHoc}
                                                                                </p>
                                                                                <p className="mt-1 line-clamp-2 text-[12px] text-slate-500">
                                                                                    {lesson.noiDung || 'Chưa có nội dung bài học.'}
                                                                                </p>
                                                                            </div>
                                                                            {lesson.videoURL ? <PlayCircle size={16} className="mt-0.5 shrink-0 text-blue-600" /> : null}
                                                                        </button>
                                                                    ))
                                                                )}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                <div className="flex min-h-[620px] flex-col rounded-[22px] border border-slate-100 bg-slate-50 p-5">
                                    {selectedLesson ? (
                                        <>
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <h4 className="text-[18px] font-bold text-slate-900">
                                                        Bài {selectedLesson.thuTu}: {selectedLesson.tenBaiHoc}
                                                    </h4>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        <StatusBadge status={selectedLesson.trangThai} />
                                                        {selectedLesson.videoURL ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[12px] font-semibold text-blue-700">
                                                                <PlayCircle size={13} />
                                                                Có video
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedLesson.videoURL ? (
                                                <div className="mt-5 overflow-hidden rounded-[20px] border border-slate-200 bg-black shadow-sm">
                                                    <div className="aspect-video w-full">
                                                        <video
                                                            src={selectedLesson.videoURL}
                                                            className="h-full w-full"
                                                            controls
                                                            controlsList="nodownload"
                                                            preload="metadata"
                                                        >
                                                            Trình duyệt của bạn không hỗ trợ phát video.
                                                        </video>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-5 flex aspect-video items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-white px-6 text-center text-[14px] text-slate-400">
                                                    Bài học này chưa có video bài giảng.
                                                </div>
                                            )}

                                            <div className="mt-5 min-h-[170px] flex-1 rounded-[20px] border border-slate-100 bg-white p-5">
                                                <h5 className="text-[13px] font-bold uppercase tracking-wide text-slate-400">
                                                    Nội dung bài học
                                                </h5>
                                                <p className="mt-3 whitespace-pre-line text-[14px] leading-7 text-slate-700">
                                                    {selectedLesson.noiDung || 'Chưa có nội dung bài học.'}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex min-h-[540px] items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-white px-6 text-center text-[14px] text-slate-500">
                                            Chọn một bài học để xem nội dung và video.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="grid items-stretch gap-6 xl:grid-cols-2">
                            <div className="h-full min-h-[320px] rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="flex items-center gap-2 text-[17px] font-bold text-slate-900">
                                    <MessageSquare size={18} className="text-blue-600" />
                                    Các Lượt đánh giá
                                </h3>
                                <PageTransition key={reviewPage}>
                                    <div className="mt-5 space-y-4">
                                        {rootReviews.length === 0 ? (
                                            <p className="text-[14px] text-slate-500">Khóa học này chưa có đánh giá.</p>
                                        ) : (
                                            paginatedRootReviews.map((review) => {
                                                const replies = replyMap.get(review.reviewId) ?? [];
                                                const repliesExpanded = expandedReplyIds.has(review.reviewId);

                                                return (
                                                    <div key={review.reviewId} className="rounded-[20px] border border-slate-100 bg-slate-50 p-4">
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <div>
                                                                <p className="text-[14px] font-bold text-slate-800">{review.userName}</p>
                                                                <p className="mt-1 text-[12px] text-slate-500">{formatDateTime(review.createdAt)}</p>
                                                            </div>
                                                            <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[12px] font-bold text-amber-700">
                                                                <Star size={13} fill="currentColor" />
                                                                {review.rating ?? 0}/5
                                                            </div>
                                                        </div>
                                                        <p className="mt-3 text-[14px] leading-6 text-slate-700">{review.content || 'Không có nội dung đánh giá.'}</p>

                                                        {replies.length > 0 ? (
                                                            <button
                                                                onClick={() => toggleReplies(review.reviewId)}
                                                                className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[12px] font-semibold text-blue-700 transition hover:bg-blue-50"
                                                            >
                                                                <ChevronDown
                                                                    size={14}
                                                                    className={`transition ${repliesExpanded ? 'rotate-180' : ''}`}
                                                                />
                                                                {repliesExpanded ? 'Thu gọn phản hồi' : `Hiện ${replies.length} phản hồi`}
                                                            </button>
                                                        ) : null}

                                                        {repliesExpanded ? (
                                                            <div className="mt-3 space-y-3">
                                                                {replies.map((reply) => (
                                                                    <div key={reply.reviewId} className="rounded-2xl border border-blue-100 bg-white px-4 py-3">
                                                                        <p className="text-[13px] font-bold text-blue-800">{reply.userName}</p>
                                                                        <p className="mt-1 text-[13px] leading-6 text-slate-600">{reply.content}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </PageTransition>
                                {rootReviews.length > REVIEW_PAGE_SIZE ? (
                                    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-[12px] font-medium text-slate-500">
                                            Hiển thị {(reviewPage - 1) * REVIEW_PAGE_SIZE + 1}-
                                            {Math.min(reviewPage * REVIEW_PAGE_SIZE, rootReviews.length)} trong {rootReviews.length} đánh giá
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                disabled={reviewPage === 1}
                                                onClick={() => setReviewPage((page) => Math.max(1, page - 1))}
                                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Trước
                                            </button>
                                            {Array.from({ length: reviewPageCount }, (_, index) => index + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => setReviewPage(page)}
                                                    className={`h-8 min-w-8 rounded-full px-3 text-[12px] font-bold transition ${page === reviewPage
                                                        ? 'bg-blue-600 text-white shadow-sm'
                                                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            <button
                                                disabled={reviewPage === reviewPageCount}
                                                onClick={() => setReviewPage((page) => Math.min(reviewPageCount, page + 1))}
                                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Sau
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <div className="h-full min-h-[320px] rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="flex items-center gap-2 text-[16px] font-bold text-slate-900">
                                    <Clock3 size={17} className="text-blue-600" />
                                    Lịch sử kiểm duyệt
                                </h3>
                                <div className="mt-4 space-y-4">
                                    {course.moderationHistory.length === 0 ? (
                                        <p className="text-[14px] text-slate-500">Khóa học này chưa có lịch sử kiểm duyệt.</p>
                                    ) : (
                                        course.moderationHistory.map((item) => (
                                            <div key={item.maLSKD} className="rounded-[20px] border border-slate-100 bg-slate-50 p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${item.hanhDong === 'APPROVE'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-rose-100 text-rose-700'
                                                        }`}
                                                    >
                                                        {getActionLabel(item.hanhDong)}
                                                    </span>
                                                    <span className="text-[12px] text-slate-500">{formatDateTime(item.thoiGian)}</span>
                                                </div>
                                                <p className="mt-3 text-[13px] font-semibold text-slate-700">{item.adminName}</p>
                                                <p className="mt-2 text-[13px] leading-6 text-slate-600">
                                                    {item.ghiChu || 'Không có ghi chú.'}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {action && course ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                                <XCircle size={20} />
                            </div>
                            <h2 className="text-[18px] font-bold text-slate-900">{action.title}</h2>
                        </div>
                        <p className="mt-3 text-[14px] leading-relaxed text-slate-500">{action.description}</p>
                        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-[13px] text-slate-700">
                            <span className="font-semibold text-slate-900">Khóa học:</span> {course.tenKhoaHoc}
                        </div>
                        <textarea
                            value={actionReason}
                            onChange={(event) => setActionReason(event.target.value)}
                            placeholder={action.placeholder}
                            className="mt-4 min-h-[120px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-700 shadow-sm outline-none transition focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                        />
                        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                            <button
                                onClick={() => {
                                    setActiveAction(null);
                                    setActionReason('');
                                }}
                                className="rounded-xl px-4 py-2 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => void handleAction()}
                                disabled={!actionReason.trim()}
                                className="rounded-xl bg-rose-600 px-5 py-2 text-[14px] font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {action.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </AdminLayout>
    );
}
