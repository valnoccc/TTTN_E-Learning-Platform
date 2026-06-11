import {
    AlertCircle,
    Check,
    Filter,
    MessageSquare,
    Reply,
    Search,
    Send,
    Star,
    X,
} from 'lucide-react';
import { type ReactNode } from 'react';

import Pagination from '../../../components/Pagination';
import InstructorLayout from '../../../layouts/InstructorLayout';
import {
    type InstructorCourseReview,
    useInstructorCourseReviews,
} from './hooks/useInstructorCourseReviews';

function formatDate(dateString: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateString));
}

function ReviewStars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, index) => (
                <Star
                    key={index}
                    size={14}
                    fill={index < rating ? 'currentColor' : 'none'}
                    className={index < rating ? 'text-amber-400' : 'text-slate-300'}
                />
            ))}
        </div>
    );
}

function Avatar({ review }: { review: InstructorCourseReview }) {
    if (review.studentAvatar) {
        return (
            <img
                src={review.studentAvatar}
                alt={review.studentName}
                className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
            />
        );
    }

    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-sm font-bold text-emerald-700">
            {(review.studentName || 'H').charAt(0).toUpperCase()}
        </div>
    );
}

export default function InstructorCourseReviewsPage() {
    const {
        loading,
        searchTerm,
        selectedCourseId,
        ratingFilter,
        currentPage,
        totalPages,
        totalReviews,
        averageRating,
        unrepliedCount,
        courseOptions,
        filteredReviews,
        currentReviews,
        indexOfFirst,
        indexOfLast,
        replyingTo,
        replyContent,
        isSubmitting,
        expandedReplies,
        setSearchTerm,
        setSelectedCourseId,
        setRatingFilter,
        setCurrentPage,
        setReplyContent,
        handleStartReply,
        handleSubmitReply,
        getReplies,
        toggleReplies,
    } = useInstructorCourseReviews();

    return (
        <InstructorLayout>
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                            Phân hệ giảng viên
                        </p>
                        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                            Đánh giá khóa học
                        </h1>
                        <p className="mt-2 text-[14px] text-slate-500">
                            Theo dõi và phản hồi nhận xét của học viên để nâng cao chất lượng khóa học.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium shadow-sm">
                        <span className="text-slate-500">Đang xem:</span>
                        <span className="font-bold text-slate-900">
                            {selectedCourseId
                                ? courseOptions.find((course) => String(course.id) === selectedCourseId)?.title
                                : 'Tất cả khóa học'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <SummaryCard
                        label="Tổng đánh giá"
                        value={totalReviews.toLocaleString('vi-VN')}
                        icon={<MessageSquare size={20} className="text-emerald-500" />}
                    />
                    <SummaryCard
                        label="Điểm trung bình"
                        value={averageRating}
                        suffix="/ 5.0"
                        icon={<Star size={20} className="fill-amber-400 text-amber-400" />}
                    />
                    <SummaryCard
                        label="Chưa phản hồi"
                        value={unrepliedCount.toLocaleString('vi-VN')}
                        valueClassName="text-rose-600"
                        icon={<AlertCircle size={20} className="text-rose-500" />}
                    />
                </div>

                <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo nội dung, tên học viên..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="w-full rounded border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-[13px] outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                        <select
                            value={selectedCourseId}
                            onChange={(event) => setSelectedCourseId(event.target.value)}
                            className="rounded border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-[13px] font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white md:w-[240px]"
                        >
                            <option value="">Tất cả khóa học</option>
                            {courseOptions.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>
                        <select
                            value={ratingFilter}
                            onChange={(event) =>
                                setRatingFilter(event.target.value as '' | '5' | '4' | 'low')
                            }
                            className="rounded border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-[13px] font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white md:w-[150px]"
                        >
                            <option value="">Mọi đánh giá</option>
                            <option value="5">5 sao</option>
                            <option value="4">4 sao</option>
                            <option value="low">Từ 1 - 3 sao</option>
                        </select>
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded bg-[#10B981] px-6 py-2.5 text-[13px] font-semibold text-white transition hover:bg-emerald-600 active:bg-emerald-700"
                        >
                            <Filter size={16} />
                            Lọc dữ liệu
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                        <h2 className="text-[15px] font-bold text-slate-800">
                            Danh sách đánh giá ({filteredReviews.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="space-y-5 p-6">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="flex animate-pulse gap-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-200" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-4 w-1/4 rounded bg-slate-200" />
                                        <div className="h-16 rounded bg-slate-100" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : currentReviews.length > 0 ? (
                        <>
                            <div className="divide-y divide-slate-100">
                                {currentReviews.map((review) => {
                                    const replies = getReplies(review.reviewId);
                                    const hasReplies = replies.length > 0;
                                    const isReplyOpen = replyingTo === review.reviewId;
                                    const areRepliesVisible = expandedReplies[review.reviewId] ?? true;

                                    return (
                                        <div
                                            key={review.reviewId}
                                            className="p-6 transition hover:bg-slate-50/30"
                                        >
                                            <div className="flex gap-4">
                                                <Avatar review={review} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                        <div>
                                                            <h3 className="text-[14px] font-bold text-slate-900">
                                                                {review.studentName}
                                                            </h3>
                                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                                <ReviewStars rating={review.rating} />
                                                                <span className="text-[12px] font-medium text-slate-500">
                                                                    {formatDate(review.createdAt)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[12px] font-medium text-slate-400">
                                                            Khóa học:{' '}
                                                            <span className="text-slate-600">{review.courseTitle}</span>
                                                        </span>
                                                    </div>

                                                    <p className="mt-3 text-[14px] leading-relaxed text-slate-700">
                                                        {review.content || 'Không có nội dung đánh giá.'}
                                                    </p>

                                                    {hasReplies && areRepliesVisible && (
                                                        <div className="mt-4 space-y-3">
                                                            {replies.map((reply) => (
                                                                <div
                                                                    key={reply.reviewId}
                                                                    className="rounded border border-emerald-100 bg-emerald-50/50 p-4"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                                                                            <Check size={12} strokeWidth={3} />
                                                                        </div>
                                                                        <span className="text-[13px] font-bold text-emerald-800">
                                                                            Phản hồi của bạn
                                                                        </span>
                                                                        <span className="text-[11px] text-slate-400">
                                                                            {formatDate(reply.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="mt-2 text-[14px] text-slate-700">
                                                                        {reply.content}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        {hasReplies && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleReplies(review.reviewId)}
                                                                className="inline-flex items-center gap-2 rounded border border-emerald-100 bg-emerald-50 px-4 py-2 text-[13px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                                            >
                                                                {areRepliesVisible
                                                                    ? 'Thu gọn phản hồi'
                                                                    : `Xem ${replies.length} phản hồi`}
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartReply(review.reviewId)}
                                                            className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-emerald-600"
                                                        >
                                                            {isReplyOpen ? <X size={16} /> : <Reply size={16} />}
                                                            {isReplyOpen ? 'Hủy' : 'Trả lời học viên'}
                                                        </button>
                                                    </div>

                                                    {isReplyOpen && (
                                                        <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-4">
                                                            <textarea
                                                                value={replyContent}
                                                                onChange={(event) => setReplyContent(event.target.value)}
                                                                placeholder="Viết phản hồi của bạn..."
                                                                className="w-full resize-none rounded border border-slate-200 bg-white p-3 text-[13px] outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                                                rows={3}
                                                                autoFocus
                                                            />
                                                            <div className="mt-3 flex justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStartReply(review.reviewId)}
                                                                    className="rounded px-4 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-200"
                                                                >
                                                                    Hủy
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => void handleSubmitReply(review)}
                                                                    disabled={isSubmitting || !replyContent.trim()}
                                                                    className="inline-flex items-center gap-2 rounded bg-[#10B981] px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-emerald-600 active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    <Send size={14} />
                                                                    Gửi phản hồi
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="px-6 pb-6">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    totalItems={filteredReviews.length}
                                    indexOfFirst={indexOfFirst}
                                    indexOfLast={indexOfLast}
                                    variant="numbers"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                                <MessageSquare size={24} />
                            </div>
                            <h3 className="mt-4 text-sm font-bold text-slate-700">
                                Chưa có đánh giá phù hợp
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </InstructorLayout>
    );
}

function SummaryCard({
    label,
    value,
    suffix,
    icon,
    valueClassName = 'text-slate-900',
}: {
    label: string;
    value: string;
    suffix?: string;
    icon: ReactNode;
    valueClassName?: string;
}) {
    return (
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-slate-500">{label}</p>
                {icon}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
                <p className={`text-3xl font-bold ${valueClassName}`}>{value}</p>
                {suffix && <span className="text-[13px] font-medium text-slate-500">{suffix}</span>}
            </div>
        </div>
    );
}
