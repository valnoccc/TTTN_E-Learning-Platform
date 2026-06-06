import { Star, MessageSquareOff, CornerDownRight, Send, X, ChevronDown, ChevronUp, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCourseReviews } from '../hooks/useCourseReviews'; // Import hook mới
import {
    CourseSectionCard,
    CourseSidebarCard,
} from '../CourseDetailShell';
import Pagination from '../../../../components/Pagination'

export default function CourseReviews() {
    const {
        isNewCourse,
        loading,
        currentTopLevelReviews,
        replyingTo,
        replyContent,
        isSubmitting,
        expandedReplies,
        currentPage,
        totalPages,
        totalReviews,
        averageRating,
        starCounts,
        indexOfFirstReview,
        indexOfLastReview,
        setReplyingTo,
        setReplyContent,
        setCurrentPage,
        getReplies,
        toggleReplies,
        handleSubmitReply
    } = useCourseReviews(); // Gọi hook tại đây

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(dateString));
    };

    if (isNewCourse) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquareOff className="text-slate-300 mb-4" size={48} />
                <h3 className="text-lg font-bold text-slate-700">Khóa học chưa được tạo</h3>
                <p className="text-sm text-slate-500 mt-2">Vui lòng lưu khóa học trước khi xem phần đánh giá.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_320px]">
            {/* CỘT TRÁI: DANH SÁCH ĐÁNH GIÁ */}
            <div className="space-y-5">
                <CourseSectionCard
                    title="Đánh giá khóa học"
                    description="Khu vực lưu giữ các phản hồi từ học viên dành cho khóa học này."
                >
                    {loading ? (
                        <div className="animate-pulse space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                                        <div className="h-16 bg-slate-100 rounded w-full mt-2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : currentTopLevelReviews.length > 0 ? (
                        <div className="space-y-8 divide-y divide-slate-100">
                            {currentTopLevelReviews.map((review, index) => {
                                const replies = getReplies(review.reviewId);
                                const hasReplied = replies.length > 0;
                                const isRepliesOpen = expandedReplies[review.reviewId] || false;

                                return (
                                    <div key={review.reviewId} className={`${index > 0 ? 'pt-8' : ''}`}>
                                        <div className="flex items-start gap-4 relative">
                                            {review.studentAvatar ? (
                                                <img
                                                    src={review.studentAvatar}
                                                    alt={review.studentName}
                                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-200">
                                                    {review.studentName.charAt(0).toUpperCase()}
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="font-semibold text-slate-800 truncate">
                                                                {review.studentName}
                                                            </h4>
                                                            {hasReplied && (
                                                                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-100 shadow-sm">
                                                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                                                    Đã phản hồi
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-1 mb-2">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={14}
                                                                    fill={i < review.rating ? "currentColor" : "none"}
                                                                    className={i < review.rating ? "text-amber-400" : "text-slate-300"}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-slate-400">
                                                        {formatDate(review.createdAt)}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
                                                    {review.content || <span className="italic text-slate-400">Không có nội dung.</span>}
                                                </p>

                                                <div className="mt-3 flex items-center gap-4 flex-wrap">
                                                    <button
                                                        onClick={() => {
                                                            setReplyingTo(replyingTo === review.reviewId ? null : review.reviewId);
                                                            setReplyContent('');
                                                        }}
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
                                                    >
                                                        <CornerDownRight size={14} />
                                                        {replyingTo === review.reviewId ? 'Hủy' : 'Phản hồi'}
                                                    </button>

                                                    {hasReplied && (
                                                        <button
                                                            onClick={() => toggleReplies(review.reviewId)}
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50/50 hover:bg-emerald-50 px-2 py-1 rounded"
                                                        >
                                                            {isRepliesOpen ? (
                                                                <><ChevronUp size={14} /> Thu gọn phản hồi</>
                                                            ) : (
                                                                <><ChevronDown size={14} /> Xem {replies.length} phản hồi</>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* KHUNG NHẬP PHẢN HỒI */}
                                                {replyingTo === review.reviewId && (
                                                    <div className="mt-4 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <div className="flex-1">
                                                            <textarea
                                                                value={replyContent}
                                                                onChange={(e) => setReplyContent(e.target.value)}
                                                                placeholder={`Viết phản hồi cho ${review.studentName}...`}
                                                                className="w-full text-sm rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 resize-none"
                                                                rows={3}
                                                                autoFocus
                                                            />
                                                            <div className="mt-2 flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => setReplyingTo(null)}
                                                                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded border border-transparent"
                                                                >
                                                                    <X size={14} className="inline mr-1" /> Hủy
                                                                </button>
                                                                <button
                                                                    onClick={() => void handleSubmitReply(review.reviewId)}
                                                                    disabled={isSubmitting || !replyContent.trim()}
                                                                    className="px-3 py-1.5 text-xs font-bold text-white bg-[#1dbf73] hover:bg-[#169b5c] rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                                                                >
                                                                    {isSubmitting ? 'Đang gửi...' : <><Send size={12} className="mr-1.5" /> Gửi phản hồi</>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* HIỂN THỊ PHẢN HỒI CON */}
                                                {hasReplied && isRepliesOpen && (
                                                    <div className="mt-5 space-y-4 border-l-2 border-emerald-100 pl-4 sm:pl-5 ml-2 animate-in fade-in duration-200">
                                                        {replies.map(reply => (
                                                            <div key={reply.reviewId} className="flex items-start gap-3 relative">
                                                                <div className="absolute -left-5 top-4 w-4 h-px bg-emerald-100 sm:-left-6 sm:w-5"></div>

                                                                {reply.studentAvatar ? (
                                                                    <img src={reply.studentAvatar} className="w-8 h-8 rounded-full border border-slate-200 shrink-0" alt="Avatar" />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                                                                        {reply.studentName.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}

                                                                <div className="flex-1 min-w-0 bg-white border border-slate-100 rounded-md p-3 shadow-sm">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-semibold text-sm text-slate-800">{reply.studentName}</span>
                                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                                                                Giảng viên
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-[11px] text-slate-400">{formatDate(reply.createdAt)}</span>
                                                                    </div>
                                                                    <p className="text-sm text-slate-600 leading-relaxed">
                                                                        {reply.content}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={totalReviews}
                                indexOfFirst={indexOfFirstReview}
                                indexOfLast={indexOfLastReview}
                                variant="numbers" // Hiển thị kiểu số 1, 2, 3 giống hình mẫu
                            />
                        </div>
                    ) : (
                        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-md bg-slate-50/50">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm text-slate-300 mb-3">
                                <Star size={24} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-700">Chưa có dữ liệu đánh giá</h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                Tab này đã sẵn sàng. Dữ liệu sẽ xuất hiện khi học viên bắt đầu gửi phản hồi.
                            </p>
                        </div>
                    )}
                </CourseSectionCard>
            </div>

            {/* CỘT PHẢI: THỐNG KÊ */}
            <div className="space-y-5">
                <CourseSidebarCard title="Tóm tắt đánh giá">
                    <div className="flex flex-col items-center py-4 border-b border-slate-100 mb-4">
                        <h2 className="text-4xl font-extrabold text-slate-800">{averageRating}</h2>
                        <div className="flex items-center gap-1 my-2">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={18}
                                    fill={i < Math.round(Number(averageRating)) ? "currentColor" : "none"}
                                    className={i < Math.round(Number(averageRating)) ? "text-amber-400" : "text-slate-200"}
                                />
                            ))}
                        </div>
                        <p className="text-xs font-medium text-slate-500">
                            Dựa trên {totalReviews} đánh giá
                        </p>
                    </div>

                    <div className="space-y-3">
                        {starCounts.map((row) => (
                            <div key={row.star} className="flex items-center gap-3 text-sm text-slate-600">
                                <span className="flex items-center gap-1 font-medium w-6">
                                    {row.star} <Star size={12} className="text-slate-400" />
                                </span>
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-400 rounded-full"
                                        style={{ width: `${row.percentage}%` }}
                                    ></div>
                                </div>
                                <span className="w-8 text-right text-xs text-slate-400 font-medium">
                                    {row.percentage}%
                                </span>
                            </div>
                        ))}
                    </div>
                </CourseSidebarCard>
            </div>
        </div>
    );
}